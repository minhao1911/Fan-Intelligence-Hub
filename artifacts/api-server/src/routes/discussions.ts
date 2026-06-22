import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, discussionsTable, commentsTable, discussionUpvotesTable, usersTable, notificationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateUser, getReputationTier } from "../lib/userHelpers";
import { CreateDiscussionBody, AddCommentBody } from "@workspace/api-zod";

const router: IRouter = Router();

/** Batch-format many discussions in 2 queries instead of 2×N. */
async function formatDiscussions(discussions: any[], viewerUserId?: number) {
  if (discussions.length === 0) return [];

  const authorIds = [...new Set(discussions.map((d) => d.userId))];
  const discussionIds = discussions.map((d) => d.id);

  const [authors, upvotes] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, authorIds)),
    viewerUserId
      ? db.select({ discussionId: discussionUpvotesTable.discussionId })
          .from(discussionUpvotesTable)
          .where(and(
            inArray(discussionUpvotesTable.discussionId, discussionIds),
            eq(discussionUpvotesTable.userId, viewerUserId),
          ))
      : Promise.resolve([]),
  ]);

  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const upvotedSet = new Set((upvotes as { discussionId: number }[]).map((u) => u.discussionId));

  return discussions.map((d) => {
    const author = authorMap.get(d.userId);
    return {
      id: d.id,
      nationCode: d.nationCode,
      matchId: d.matchId,
      userId: d.userId,
      username: author?.username ?? "Anonymous",
      avatarUrl: author?.avatarUrl ?? null,
      userNationCode: author?.nationCode ?? null,
      reputationTier: getReputationTier(author?.reputationPoints ?? 0),
      title: d.title,
      content: d.content,
      category: d.category,
      upvotes: d.upvotes,
      commentCount: d.commentCount,
      hasUserUpvoted: upvotedSet.has(d.id),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  });
}

/** Single-discussion formatter (used for POST response / upvote response). */
async function formatDiscussion(d: any, userId?: number) {
  const [formatted] = await formatDiscussions([d], userId);
  return formatted;
}

router.get("/discussions", async (req, res): Promise<void> => {
  const nationCode = typeof req.query.nationCode === "string" ? req.query.nationCode : undefined;
  const matchId = req.query.matchId ? parseInt(String(req.query.matchId), 10) : undefined;
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10) || 20, 100);
  const offset = parseInt(String(req.query.offset ?? "0"), 10) || 0;

  const conditions: any[] = [];
  if (nationCode) conditions.push(eq(discussionsTable.nationCode, nationCode));
  if (matchId) conditions.push(eq(discussionsTable.matchId, matchId));
  if (category) conditions.push(eq(discussionsTable.category, category));

  const discussions = await db
    .select()
    .from(discussionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(discussionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const formatted = await formatDiscussions(discussions);
  res.json(formatted);
});

router.post("/discussions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDiscussionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const [discussion] = await db.insert(discussionsTable).values({
    userId: user.id,
    nationCode: parsed.data.nationCode ?? null,
    matchId: parsed.data.matchId ?? null,
    title: parsed.data.title,
    content: parsed.data.content,
    category: parsed.data.category,
  }).returning();

  await db
    .update(usersTable)
    .set({
      totalDiscussions: sql`${usersTable.totalDiscussions} + 1`,
      reputationPoints: sql`${usersTable.reputationPoints} + 8`,
    })
    .where(eq(usersTable.id, user.id));

  const formatted = await formatDiscussion(discussion, user.id);
  res.status(201).json(formatted);
});

router.get("/discussions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [discussion] = await db.select().from(discussionsTable).where(eq(discussionsTable.id, id));
  if (!discussion) {
    res.status(404).json({ error: "Discussion not found" });
    return;
  }

  // Fetch comments + all their authors in 2 queries (no N+1)
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.discussionId, id))
    .orderBy(commentsTable.createdAt);

  const commentAuthorIds = [...new Set(comments.map((c) => c.userId))];
  const commentAuthors = commentAuthorIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, commentAuthorIds))
    : [];
  const commentAuthorMap = new Map(commentAuthors.map((a) => [a.id, a]));

  const formattedComments = comments.map((c) => {
    const author = commentAuthorMap.get(c.userId);
    return {
      id: c.id,
      discussionId: c.discussionId,
      userId: c.userId,
      username: author?.username ?? "Anonymous",
      avatarUrl: author?.avatarUrl ?? null,
      userNationCode: author?.nationCode ?? null,
      reputationTier: getReputationTier(author?.reputationPoints ?? 0),
      content: c.content,
      upvotes: c.upvotes,
      createdAt: c.createdAt.toISOString(),
    };
  });

  const base = await formatDiscussion(discussion);
  res.json({ ...base, comments: formattedComments });
});

router.post("/discussions/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = AddCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const [comment] = await db.insert(commentsTable).values({
    discussionId: id,
    userId: user.id,
    content: parsed.data.content,
  }).returning();

  const [discussion] = await db
    .select({ userId: discussionsTable.userId, title: discussionsTable.title })
    .from(discussionsTable)
    .where(eq(discussionsTable.id, id));

  await Promise.all([
    db.update(discussionsTable)
      .set({ commentCount: sql`${discussionsTable.commentCount} + 1` })
      .where(eq(discussionsTable.id, id)),
    db.update(usersTable)
      .set({ reputationPoints: sql`${usersTable.reputationPoints} + 2` })
      .where(eq(usersTable.id, user.id)),
    // Notify thread author (skip if commenting on own thread)
    discussion && discussion.userId !== user.id
      ? db.insert(notificationsTable).values({
          userId: discussion.userId,
          type: "comment",
          title: "New reply on your thread",
          body: `${user.username} replied: "${parsed.data.content.slice(0, 80)}${parsed.data.content.length > 80 ? "…" : ""}"`,
          discussionId: id,
          actorUsername: user.username,
        })
      : Promise.resolve(),
  ]);

  res.status(201).json({
    id: comment.id,
    discussionId: comment.discussionId,
    userId: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    userNationCode: user.nationCode,
    reputationTier: getReputationTier(user.reputationPoints),
    content: comment.content,
    upvotes: comment.upvotes,
    createdAt: comment.createdAt.toISOString(),
  });
});

router.post("/discussions/:id/upvote", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const [existing] = await db
    .select()
    .from(discussionUpvotesTable)
    .where(and(eq(discussionUpvotesTable.discussionId, id), eq(discussionUpvotesTable.userId, user.id)));

  if (!existing) {
    const [discussion] = await db
      .select({ userId: discussionsTable.userId, title: discussionsTable.title })
      .from(discussionsTable)
      .where(eq(discussionsTable.id, id));

    await Promise.all([
      db.insert(discussionUpvotesTable).values({ discussionId: id, userId: user.id }),
      db.update(discussionsTable)
        .set({ upvotes: sql`${discussionsTable.upvotes} + 1` })
        .where(eq(discussionsTable.id, id)),
      // Notify thread author (skip if upvoting own thread)
      discussion && discussion.userId !== user.id
        ? db.insert(notificationsTable).values({
            userId: discussion.userId,
            type: "upvote",
            title: "Someone upvoted your thread",
            body: `${user.username} upvoted "${discussion.title.slice(0, 60)}${discussion.title.length > 60 ? "…" : ""}"`,
            discussionId: id,
            actorUsername: user.username,
          })
        : Promise.resolve(),
    ]);
  }

  const [discussion] = await db.select().from(discussionsTable).where(eq(discussionsTable.id, id));
  const formatted = await formatDiscussion(discussion, user.id);
  res.json(formatted);
});

export default router;
