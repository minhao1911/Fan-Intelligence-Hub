import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { db, usersTable, nationsTable, groupsTable, groupMembersTable } from "@workspace/db";
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
  const clerkId = (req as any).clerkUserId;
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

  const clerkId = (req as any).clerkUserId;
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

  const clerkId = (req as any).clerkUserId;
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

export default router;
