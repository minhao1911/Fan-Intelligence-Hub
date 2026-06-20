import { Router, type IRouter } from "express";
import { eq, desc, and, ne } from "drizzle-orm";
import { db, usersTable, nationsTable, matchPredictionsTable, matchesTable, nationConfidenceVotesTable } from "@workspace/db";
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
    totalPredictions: user.totalPredictions,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/me/check-username", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkUserId;
  const username = typeof req.query.username === "string" ? req.query.username.trim() : "";

  if (!username || username.length < 2 || username.length > 40) {
    res.json({ available: false, reason: "Username must be 2–40 characters." });
    return;
  }

  const currentUser = await getOrCreateUser(clerkId);

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.username, username), ne(usersTable.id, currentUser.id)));

  res.json({ available: !existing, reason: existing ? "Username is already taken." : null });
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

  const users = await db
    .select()
    .from(usersTable)
    .where(nationCode ? eq(usersTable.nationCode, nationCode) : undefined)
    .orderBy(desc(usersTable.reputationPoints))
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

router.get("/me/predictions", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkUserId;
  const user = await getOrCreateUser(clerkId);

  const predictions = await db
    .select()
    .from(matchPredictionsTable)
    .where(eq(matchPredictionsTable.userId, user.id))
    .orderBy(desc(matchPredictionsTable.createdAt));

  const results = await Promise.all(
    predictions.map(async (p) => {
      const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, p.matchId));
      if (!match) return null;
      const [homeNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, match.homeNationCode));
      const [awayNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, match.awayNationCode));
      return {
        matchId: p.matchId,
        predictedOutcome: p.predictedOutcome,
        predictedHomeScore: p.predictedHomeScore,
        predictedAwayScore: p.predictedAwayScore,
        isResolved: p.isResolved,
        xpEarned: p.xpEarned,
        createdAt: p.createdAt.toISOString(),
        match: {
          homeNationCode: match.homeNationCode,
          homeNationName: homeNation?.name ?? match.homeNationCode,
          homeNationFlag: homeNation?.flagEmoji ?? "🏳",
          awayNationCode: match.awayNationCode,
          awayNationName: awayNation?.name ?? match.awayNationCode,
          awayNationFlag: awayNation?.flagEmoji ?? "🏳",
          stage: match.stage,
          status: match.status,
          scheduledAt: match.scheduledAt.toISOString(),
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        },
      };
    })
  );

  res.json(results.filter(Boolean));
});

router.get("/me/confidence-votes", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkUserId;
  const user = await getOrCreateUser(clerkId);

  const XP_REWARDS: Record<number, number> = { 5: 50, 4: 25, 3: 5, 2: 0, 1: 0 };
  const LEVEL_LABELS: Record<number, string> = {
    1: "Doomed", 2: "Shaky", 3: "Neutral", 4: "Strong", 5: "Champions",
  };
  const LEVEL_EMOJI: Record<number, string> = {
    1: "💀", 2: "😟", 3: "😐", 4: "💪", 5: "🔥",
  };

  const votes = await db
    .select({
      nationCode: nationConfidenceVotesTable.nationCode,
      level: nationConfidenceVotesTable.level,
      updatedAt: nationConfidenceVotesTable.updatedAt,
      nationName: nationsTable.name,
      flagEmoji: nationsTable.flagEmoji,
      overallConfidence: nationsTable.confidenceScore,
    })
    .from(nationConfidenceVotesTable)
    .innerJoin(nationsTable, eq(nationConfidenceVotesTable.nationCode, nationsTable.code))
    .where(eq(nationConfidenceVotesTable.userId, user.id))
    .orderBy(desc(nationConfidenceVotesTable.updatedAt));

  res.json(votes.map((v) => ({
    nationCode: v.nationCode,
    nationName: v.nationName,
    flagEmoji: v.flagEmoji,
    level: v.level,
    levelLabel: LEVEL_LABELS[v.level] ?? "Unknown",
    levelEmoji: LEVEL_EMOJI[v.level] ?? "❓",
    overallConfidence: v.overallConfidence ?? 50,
    pendingXp: XP_REWARDS[v.level] ?? 0,
    updatedAt: v.updatedAt?.toISOString() ?? null,
  })));
});

export default router;
