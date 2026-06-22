import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { db, usersTable, nationsTable, groupsTable, groupMembersTable, groupPostsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateUser, getReputationTier } from "../lib/userHelpers";

const router: IRouter = Router();

function formatGroup(g: any, isUserMember = false, userRole: string | null = null) {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    coverEmoji: g.coverEmoji,
    nationCode: g.nationCode,
    creatorId: g.creatorId,
    memberCount: g.memberCount,
    isPublic: g.isPublic,
    isUserMember,
    userRole,
    createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : g.createdAt,
  };
}

router.get("/groups", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const nationCode = typeof req.query.nationCode === "string" ? req.query.nationCode : undefined;

  const conditions = [eq(groupsTable.isPublic, true)];
  if (search) conditions.push(ilike(groupsTable.name, `%${search}%`));
  if (nationCode) conditions.push(eq(groupsTable.nationCode, nationCode.toUpperCase()));

  const groups = await db
    .select()
    .from(groupsTable)
    .where(and(...conditions))
    .orderBy(desc(groupsTable.memberCount))
    .limit(50);

  res.json(groups.map((g) => formatGroup(g)));
});

router.post("/groups", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const { name, description, coverEmoji, nationCode, isPublic } = req.body;
  if (!name?.trim() || !description?.trim()) {
    res.status(400).json({ error: "name and description are required" });
    return;
  }

  const [group] = await db
    .insert(groupsTable)
    .values({
      name: name.trim(),
      description: description.trim(),
      coverEmoji: coverEmoji ?? "⚽",
      nationCode: nationCode?.toUpperCase() ?? null,
      creatorId: user.id,
      memberCount: 1,
      isPublic: isPublic !== false,
    })
    .returning();

  await db.insert(groupMembersTable).values({
    groupId: group.id,
    userId: user.id,
    role: "admin",
  });

  res.status(201).json(formatGroup(group, true, "admin"));
});

router.get("/groups/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid group id" }); return; }

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, id));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const members = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      nationCode: usersTable.nationCode,
      reputationPoints: usersTable.reputationPoints,
      role: groupMembersTable.role,
      joinedAt: groupMembersTable.joinedAt,
    })
    .from(groupMembersTable)
    .innerJoin(usersTable, eq(groupMembersTable.userId, usersTable.id))
    .where(eq(groupMembersTable.groupId, id))
    .orderBy(desc(usersTable.reputationPoints))
    .limit(20);

  let nation = null;
  if (group.nationCode) {
    const [n] = await db.select().from(nationsTable).where(eq(nationsTable.code, group.nationCode));
    if (n) nation = { code: n.code, name: n.name, flagEmoji: n.flagEmoji };
  }

  res.json({
    ...formatGroup(group),
    nation,
    members: members.map((m) => ({
      id: m.id,
      username: m.username,
      avatarUrl: m.avatarUrl,
      nationCode: m.nationCode,
      reputationPoints: m.reputationPoints,
      reputationTier: getReputationTier(m.reputationPoints),
      role: m.role,
      joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : m.joinedAt,
    })),
  });
});

router.post("/groups/:id/join", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid group id" }); return; }

  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, id));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const [existing] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, id), eq(groupMembersTable.userId, user.id)));

  if (existing) {
    res.status(409).json({ error: "Already a member" });
    return;
  }

  await db.insert(groupMembersTable).values({ groupId: id, userId: user.id, role: "member" });
  const [updated] = await db
    .update(groupsTable)
    .set({ memberCount: sql`${groupsTable.memberCount} + 1` })
    .where(eq(groupsTable.id, id))
    .returning();

  res.json(formatGroup(updated, true, "member"));
});

router.post("/groups/:id/leave", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid group id" }); return; }

  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const [existing] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, id), eq(groupMembersTable.userId, user.id)));

  if (!existing) { res.status(404).json({ error: "Not a member" }); return; }

  await db
    .delete(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, id), eq(groupMembersTable.userId, user.id)));

  const [updated] = await db
    .update(groupsTable)
    .set({ memberCount: sql`GREATEST(${groupsTable.memberCount} - 1, 0)` })
    .where(eq(groupsTable.id, id))
    .returning();

  res.json(formatGroup(updated, false, null));
});

router.get("/groups/:id/posts", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid group id" }); return; }

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, id));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const cursor = req.query.cursor ? parseInt(req.query.cursor as string, 10) : undefined;

  const posts = await db
    .select({
      id: groupPostsTable.id,
      groupId: groupPostsTable.groupId,
      userId: groupPostsTable.userId,
      content: groupPostsTable.content,
      createdAt: groupPostsTable.createdAt,
      authorId: usersTable.id,
      authorUsername: usersTable.username,
      authorAvatarUrl: usersTable.avatarUrl,
      authorReputationPoints: usersTable.reputationPoints,
      memberRole: groupMembersTable.role,
    })
    .from(groupPostsTable)
    .innerJoin(usersTable, eq(groupPostsTable.userId, usersTable.id))
    .leftJoin(
      groupMembersTable,
      and(eq(groupMembersTable.groupId, id), eq(groupMembersTable.userId, groupPostsTable.userId))
    )
    .where(
      cursor
        ? and(eq(groupPostsTable.groupId, id), sql`${groupPostsTable.id} < ${cursor}`)
        : eq(groupPostsTable.groupId, id)
    )
    .orderBy(desc(groupPostsTable.id))
    .limit(30);

  res.json(
    posts.map((p) => ({
      id: p.id,
      groupId: p.groupId,
      userId: p.userId,
      content: p.content,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      author: {
        id: p.authorId,
        username: p.authorUsername,
        avatarUrl: p.authorAvatarUrl,
        reputationTier: getReputationTier(p.authorReputationPoints),
        role: p.memberRole ?? "member",
      },
    }))
  );
});

router.post("/groups/:id/posts", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid group id" }); return; }

  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, id));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const [membership] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, id), eq(groupMembersTable.userId, user.id)));

  if (!membership) { res.status(403).json({ error: "You must be a member to post" }); return; }

  const { content } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }
  if (content.trim().length > 1000) { res.status(400).json({ error: "Post too long (max 1000 chars)" }); return; }

  const [post] = await db
    .insert(groupPostsTable)
    .values({ groupId: id, userId: user.id, content: content.trim() })
    .returning();

  res.status(201).json({
    id: post.id,
    groupId: post.groupId,
    userId: post.userId,
    content: post.content,
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
    author: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      reputationTier: getReputationTier(user.reputationPoints),
      role: membership.role,
    },
  });
});

router.delete("/groups/:id/posts/:postId", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const postId = parseInt(req.params.postId as string, 10);
  if (isNaN(id) || isNaN(postId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const [post] = await db.select().from(groupPostsTable).where(eq(groupPostsTable.id, postId));
  if (!post || post.groupId !== id) { res.status(404).json({ error: "Post not found" }); return; }

  const [membership] = await db
    .select()
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, id), eq(groupMembersTable.userId, user.id)));

  const isOwner = post.userId === user.id;
  const isAdmin = membership?.role === "admin";
  if (!isOwner && !isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(groupPostsTable).where(eq(groupPostsTable.id, postId));
  res.json({ ok: true });
});

export default router;
