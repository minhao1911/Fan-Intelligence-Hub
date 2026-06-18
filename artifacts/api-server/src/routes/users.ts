import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, nationsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateUser, getReputationTier } from "../lib/userHelpers";
import { UpdateMeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkUserId;
  const auth = getAuth(req);
  const user = await getOrCreateUser(clerkId);

  let nationName: string | null = null;
  if (user.nationCode) {
    const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, user.nationCode));
    nationName = nation?.name ?? null;
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    nationCode: user.nationCode,
    nationName,
    reputationPoints: user.reputationPoints,
    reputationTier: getReputationTier(user.reputationPoints),
    totalVotes: user.totalVotes,
    totalReactions: user.totalReactions,
    totalDiscussions: user.totalDiscussions,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkUserId;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkId);
  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, user.id))
    .returning();

  let nationName: string | null = null;
  if (updated.nationCode) {
    const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, updated.nationCode));
    nationName = nation?.name ?? null;
  }

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    username: updated.username,
    avatarUrl: updated.avatarUrl,
    nationCode: updated.nationCode,
    nationName,
    reputationPoints: updated.reputationPoints,
    reputationTier: getReputationTier(updated.reputationPoints),
    totalVotes: updated.totalVotes,
    totalReactions: updated.totalReactions,
    totalDiscussions: updated.totalDiscussions,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/leaderboard", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10) || 20, 100);
  const nationCode = typeof req.query.nationCode === "string" ? req.query.nationCode : undefined;

  let query = db.select().from(usersTable).orderBy(usersTable.reputationPoints);
  const users = await db
    .select()
    .from(usersTable)
    .where(nationCode ? eq(usersTable.nationCode, nationCode) : undefined)
    .orderBy(usersTable.reputationPoints)
    .limit(limit);

  const leaderboard = users.map((u, i) => ({
    rank: i + 1,
    user: {
      id: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      reputationPoints: u.reputationPoints,
      reputationTier: getReputationTier(u.reputationPoints),
      nationCode: u.nationCode,
    },
    totalVotes: u.totalVotes,
    totalReactions: u.totalReactions,
    predictionAccuracy: null,
  }));

  res.json(leaderboard);
});

export default router;
