import { Router, type IRouter } from "express";
import { eq, desc, and, ne, inArray, sql } from "drizzle-orm";
import { withCache, cacheDel, cacheDelPrefix, TTL } from "../lib/cache";
import {
  db, usersTable, nationsTable, matchPredictionsTable, matchesTable,
  nationConfidenceVotesTable, founderPassesTable, subscriptionsTable,
  userCosmeticsTable, productsTable, discussionsTable, commentsTable,
  reactionsTable, pollVotesTable, notificationsTable,
} from "@workspace/db";

import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateUser, getReputationTier } from "../lib/userHelpers";
import { UpdateMeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/me", async (req, res): Promise<void> => {
  const replitId = (req as any).replitUser?.id;
  if (!replitId) {
    res.json(null);
    return;
  }
  const clerkId = String(replitId);
  const user = await getOrCreateUser(clerkId);

  let nationName: string | null = null;
  if (user.nationCode) {
    const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, user.nationCode));
    nationName = nation?.name ?? null;
  }

  const [founderPass] = await db.select().from(founderPassesTable).where(eq(founderPassesTable.userId, user.id));

  const now = new Date();
  const [activeSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, user.id),
        eq(subscriptionsTable.status, "active"),
        sql`${subscriptionsTable.expiryDate} > ${now}`,
      ),
    );

  const equippedCosmetics = await db
    .select({ productId: userCosmeticsTable.productId, name: productsTable.name, category: productsTable.category })
    .from(userCosmeticsTable)
    .innerJoin(productsTable, eq(userCosmeticsTable.productId, productsTable.id))
    .where(and(eq(userCosmeticsTable.userId, user.id), eq(userCosmeticsTable.isEquipped, true)));

  const equippedFrame = equippedCosmetics.find((c) => c.category === "nation_frame") ?? null;

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
    isFounder: !!founderPass,
    founderNumber: founderPass?.founderNumber ?? null,
    isPremium: !!activeSub,
    equippedFrame: equippedFrame ? { productId: equippedFrame.productId, name: equippedFrame.name, category: equippedFrame.category } : null,
    ownedCosmetics: equippedCosmetics.map((c) => ({ productId: c.productId, name: c.name, category: c.category })),
  });
});

router.get("/me/check-username", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).replitUserId;
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
  const clerkId = (req as any).replitUserId;
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
  const cacheKey = `leaderboard:${nationCode ?? "all"}:${limit}`;

  const leaderboard = await withCache(cacheKey, TTL.LEADERBOARD, async () => {
    const users = await db
      .select()
      .from(usersTable)
      .where(nationCode ? eq(usersTable.nationCode, nationCode) : undefined)
      .orderBy(desc(usersTable.reputationPoints))
      .limit(limit);

    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return [];

    const [founderPasses, activeSubs] = await Promise.all([
      db.select({ userId: founderPassesTable.userId, founderNumber: founderPassesTable.founderNumber })
        .from(founderPassesTable)
        .where(inArray(founderPassesTable.userId, userIds)),
      db.select({ userId: subscriptionsTable.userId })
        .from(subscriptionsTable)
        .where(
          and(
            inArray(subscriptionsTable.userId, userIds),
            eq(subscriptionsTable.status, "active"),
            sql`${subscriptionsTable.expiryDate} > ${new Date()}`,
          ),
        ),
    ]);

    const founderMap = new Map(founderPasses.map((f) => [f.userId, f.founderNumber]));
    const premiumSet = new Set(activeSubs.map((s) => s.userId));

    return users.map((u, i) => ({
      rank: i + 1,
      user: {
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        reputationPoints: u.reputationPoints,
        reputationTier: getReputationTier(u.reputationPoints),
        nationCode: u.nationCode,
        isFounder: founderMap.has(u.id),
        founderNumber: founderMap.get(u.id) ?? null,
        isPremium: premiumSet.has(u.id),
      },
      totalVotes: u.totalVotes,
      totalReactions: u.totalReactions,
      predictionAccuracy: null,
    }));
  });

  res.json(leaderboard);
});

router.get("/me/predictions", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).replitUserId;
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
  const clerkId = (req as any).replitUserId;
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

router.get("/me/activity", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);
  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 100);

  const [myDiscussions, myComments, myReactions, myPollVotes] = await Promise.all([
    db.select({
      id: discussionsTable.id,
      title: discussionsTable.title,
      category: discussionsTable.category,
      nationCode: discussionsTable.nationCode,
      matchId: discussionsTable.matchId,
      createdAt: discussionsTable.createdAt,
    })
      .from(discussionsTable)
      .where(eq(discussionsTable.userId, user.id))
      .orderBy(desc(discussionsTable.createdAt))
      .limit(limit),

    db.select({
      id: commentsTable.id,
      discussionId: commentsTable.discussionId,
      content: commentsTable.content,
      createdAt: commentsTable.createdAt,
    })
      .from(commentsTable)
      .where(eq(commentsTable.userId, user.id))
      .orderBy(desc(commentsTable.createdAt))
      .limit(limit),

    db.select({
      id: reactionsTable.id,
      matchId: reactionsTable.matchId,
      reactionType: reactionsTable.reactionType,
      comment: reactionsTable.comment,
      createdAt: reactionsTable.createdAt,
    })
      .from(reactionsTable)
      .where(eq(reactionsTable.userId, user.id))
      .orderBy(desc(reactionsTable.createdAt))
      .limit(limit),

    db.select({
      id: pollVotesTable.id,
      pollId: pollVotesTable.pollId,
      optionValue: pollVotesTable.optionValue,
      createdAt: pollVotesTable.createdAt,
    })
      .from(pollVotesTable)
      .where(eq(pollVotesTable.userId, user.id))
      .orderBy(desc(pollVotesTable.createdAt))
      .limit(limit),
  ]);

  // Enrich reactions with match info
  const reactionMatchIds = [...new Set(myReactions.map((r) => r.matchId))];
  const reactionMatches = reactionMatchIds.length > 0
    ? await db.select({
        id: matchesTable.id,
        homeNationCode: matchesTable.homeNationCode,
        awayNationCode: matchesTable.awayNationCode,
      }).from(matchesTable).where(inArray(matchesTable.id, reactionMatchIds))
    : [];
  const reactionMatchMap = new Map(reactionMatches.map((m) => [m.id, m]));

  type ActivityItem = {
    type: "discussion" | "comment" | "reaction" | "poll_vote";
    id: number;
    createdAt: string;
    pts: number;
    [key: string]: unknown;
  };

  const items: ActivityItem[] = [
    ...myDiscussions.map((d) => ({
      type: "discussion" as const,
      id: d.id,
      title: d.title,
      category: d.category,
      nationCode: d.nationCode,
      matchId: d.matchId,
      createdAt: d.createdAt.toISOString(),
      pts: 8,
    })),
    ...myComments.map((c) => ({
      type: "comment" as const,
      id: c.id,
      discussionId: c.discussionId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      pts: 2,
    })),
    ...myReactions.map((r) => {
      const match = reactionMatchMap.get(r.matchId);
      return {
        type: "reaction" as const,
        id: r.id,
        matchId: r.matchId,
        reactionType: r.reactionType,
        comment: r.comment,
        homeNationCode: match?.homeNationCode ?? null,
        awayNationCode: match?.awayNationCode ?? null,
        createdAt: r.createdAt.toISOString(),
        pts: 3,
      };
    }),
    ...myPollVotes.map((v) => ({
      type: "poll_vote" as const,
      id: v.id,
      pollId: v.pollId,
      optionValue: v.optionValue,
      createdAt: v.createdAt.toISOString(),
      pts: 5,
    })),
  ];

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(items.slice(0, limit));
});

router.get("/me/notifications", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);
  const limit = Math.min(parseInt(String(req.query.limit ?? "30"), 10) || 30, 100);

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);

  res.json(notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    discussionId: n.discussionId,
    actorUsername: n.actorUsername,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.post("/me/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, user.id));

  res.json({ ok: true });
});

router.post("/me/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);
  const notifId = parseInt(String(req.params.id), 10);

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, notifId), eq(notificationsTable.userId, user.id)));

  res.json({ ok: true });
});

export default router;

