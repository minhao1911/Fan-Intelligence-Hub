import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, inArray } from "drizzle-orm";
import { db, nationsTable, usersTable, matchesTable, pollVotesTable, pollOptionsTable, pollsTable, nationConfidenceVotesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePremium } from "../middlewares/requirePremium";
import { getOrCreateUser, getReputationTier } from "../lib/userHelpers";
import { withCache, cacheDel, cacheDelPrefix, TTL } from "../lib/cache";

const router: IRouter = Router();

/** Batch-fetch nations for a list of matches — zero N+1. */
async function buildNationMapForMatches(matches: { homeNationCode: string; awayNationCode: string }[]) {
  const codes = [...new Set(matches.flatMap((m) => [m.homeNationCode, m.awayNationCode]))];
  if (codes.length === 0) return new Map<string, any>();
  const nations = await db.select().from(nationsTable).where(inArray(nationsTable.code, codes));
  return new Map(nations.map((n) => [n.code, n]));
}

function formatMatchWithMap(m: any, nationMap: Map<string, any>) {
  const homeNation = nationMap.get(m.homeNationCode);
  const awayNation = nationMap.get(m.awayNationCode);
  return {
    id: m.id,
    homeNationCode: m.homeNationCode,
    homeNationName: homeNation?.name ?? m.homeNationCode,
    homeNationFlag: homeNation?.flagEmoji ?? "🏳",
    awayNationCode: m.awayNationCode,
    awayNationName: awayNation?.name ?? m.awayNationCode,
    awayNationFlag: awayNation?.flagEmoji ?? "🏳",
    competition: m.competition,
    stage: m.stage,
    status: m.status,
    scheduledAt: m.scheduledAt.toISOString(),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    totalVoters: 0,
    homeConfidence: null,
    awayConfidence: null,
  };
}

router.get("/nations", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const confederation = typeof req.query.confederation === "string" ? req.query.confederation : undefined;
  const cacheKey = `nations:list:${search ?? ""}:${confederation ?? ""}`;

  const data = await withCache(cacheKey, TTL.NATION, async () => {
    const conditions = [];
    if (search) conditions.push(ilike(nationsTable.name, `%${search}%`));
    if (confederation) conditions.push(eq(nationsTable.confederation, confederation));

    const nations = await db
      .select()
      .from(nationsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${nationsTable.memberCount} DESC`, nationsTable.name);

    return nations.map(n => ({
      code: n.code,
      name: n.name,
      flagEmoji: n.flagEmoji,
      confederation: n.confederation,
      memberCount: n.memberCount,
      confidenceScore: n.confidenceScore,
    }));
  });

  res.json(data);
});

router.get("/nations/:code", async (req, res): Promise<void> => {
  const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code).toUpperCase();

  const data = await withCache(`nations:detail:${code}`, TTL.NATION, async () => {
    const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, code));
    if (!nation) return null;

    const [recentMatches, upcomingMatches] = await Promise.all([
      db.select().from(matchesTable).where(and(
        sql`(${matchesTable.homeNationCode} = ${code} OR ${matchesTable.awayNationCode} = ${code})`,
        eq(matchesTable.status, "completed"),
      )).limit(5),
      db.select().from(matchesTable).where(and(
        sql`(${matchesTable.homeNationCode} = ${code} OR ${matchesTable.awayNationCode} = ${code})`,
        eq(matchesTable.status, "upcoming"),
      )).limit(5),
    ]);

    const allMatches = [...recentMatches, ...upcomingMatches];
    const nationMap = await buildNationMapForMatches(allMatches);

    return {
      code: nation.code,
      name: nation.name,
      flagEmoji: nation.flagEmoji,
      confederation: nation.confederation,
      memberCount: nation.memberCount,
      confidenceScore: nation.confidenceScore,
      recentMatches: recentMatches.map((m) => formatMatchWithMap(m, nationMap)),
      upcomingMatches: upcomingMatches.map((m) => formatMatchWithMap(m, nationMap)),
      isUserMember: false,
    };
  });

  if (!data) { res.status(404).json({ error: "Nation not found" }); return; }
  res.json(data);
});

router.post("/nations/:code/join", requireAuth, async (req, res): Promise<void> => {
  const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code).toUpperCase();
  const clerkId = (req as any).replitUserId;

  const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, code));
  if (!nation) { res.status(404).json({ error: "Nation not found" }); return; }

  const user = await getOrCreateUser(clerkId);

  if (user.nationCode && user.nationCode !== code) {
    await db.update(nationsTable).set({ memberCount: sql`${nationsTable.memberCount} - 1` }).where(eq(nationsTable.code, user.nationCode));
    // Invalidate old nation caches
    cacheDel(`nations:detail:${user.nationCode}`);
    cacheDel(`nations:members:${user.nationCode}`);
    cacheDelPrefix(`nations:list:`);
  }

  if (!user.nationCode || user.nationCode !== code) {
    await db.update(nationsTable).set({ memberCount: sql`${nationsTable.memberCount} + 1` }).where(eq(nationsTable.code, code));
  }

  const [updated] = await db
    .update(usersTable)
    .set({ nationCode: code, reputationPoints: sql`${usersTable.reputationPoints} + 10` })
    .where(eq(usersTable.id, user.id))
    .returning();

  // Invalidate new nation caches + leaderboard
  cacheDel(`nations:detail:${code}`);
  cacheDel(`nations:members:${code}`);
  cacheDelPrefix(`nations:list:`);
  cacheDelPrefix("leaderboard:");

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    username: updated.username,
    avatarUrl: updated.avatarUrl,
    nationCode: updated.nationCode,
    nationName: nation.name,
    reputationPoints: updated.reputationPoints,
    reputationTier: getReputationTier(updated.reputationPoints),
    totalVotes: updated.totalVotes,
    totalReactions: updated.totalReactions,
    totalDiscussions: updated.totalDiscussions,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.post("/nations/:code/leave", requireAuth, async (req, res): Promise<void> => {
  const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code).toUpperCase();
  const clerkId = (req as any).replitUserId;

  const user = await getOrCreateUser(clerkId);

  if (user.nationCode === code) {
    await db.update(nationsTable).set({ memberCount: sql`${nationsTable.memberCount} - 1` }).where(eq(nationsTable.code, code));
  }

  const [updated] = await db
    .update(usersTable)
    .set({ nationCode: null })
    .where(eq(usersTable.id, user.id))
    .returning();

  // Invalidate caches
  cacheDel(`nations:detail:${code}`);
  cacheDel(`nations:members:${code}`);
  cacheDelPrefix(`nations:list:`);
  cacheDelPrefix("leaderboard:");

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    username: updated.username,
    avatarUrl: updated.avatarUrl,
    nationCode: updated.nationCode,
    nationName: null,
    reputationPoints: updated.reputationPoints,
    reputationTier: getReputationTier(updated.reputationPoints),
    totalVotes: updated.totalVotes,
    totalReactions: updated.totalReactions,
    totalDiscussions: updated.totalDiscussions,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/nations/:code/pulse", requireAuth, requirePremium, async (req, res): Promise<void> => {
  const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code).toUpperCase();

  const data = await withCache(`nations:pulse:${code}`, TTL.PULSE, async () => {
    const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, code));
    if (!nation) return null;

    const [matches, topContributors] = await Promise.all([
      db.select().from(matchesTable)
        .where(sql`(${matchesTable.homeNationCode} = ${code} OR ${matchesTable.awayNationCode} = ${code})`)
        .limit(5),
      db.select().from(usersTable)
        .where(eq(usersTable.nationCode, code))
        .orderBy(sql`${usersTable.reputationPoints} DESC`)
        .limit(5),
    ]);

    const confidence = nation.confidenceScore ?? 60;
    return {
      nationCode: nation.code,
      nationName: nation.name,
      overallConfidence: confidence,
      winConfidence: confidence,
      drawConfidence: 20,
      lossConfidence: 100 - confidence - 20,
      sentimentScore: confidence / 100,
      totalVoters: nation.memberCount,
      recentTrend: "stable",
      matchPulses: matches.map(m => ({
        matchId: m.id,
        homeNation: m.homeNationCode,
        awayNation: m.awayNationCode,
        homeConfidence: m.homeNationCode === code ? 65 : 35,
        awayConfidence: m.awayNationCode === code ? 65 : 35,
        totalVoters: nation.memberCount ?? 50,
        scheduledAt: m.scheduledAt.toISOString(),
      })),
      topContributors: topContributors.map(u => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        reputationPoints: u.reputationPoints,
        reputationTier: getReputationTier(u.reputationPoints),
        nationCode: u.nationCode,
      })),
    };
  });

  if (!data) { res.status(404).json({ error: "Nation not found" }); return; }
  res.json(data);
});

router.get("/nations/:code/members", async (req, res): Promise<void> => {
  const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code).toUpperCase();

  const members = await withCache(`nations:members:${code}`, TTL.NATION, async () => {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.nationCode, code))
      .orderBy(sql`${usersTable.reputationPoints} DESC`)
      .limit(20);
    return rows.map(u => ({
      id: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      reputationPoints: u.reputationPoints,
      reputationTier: getReputationTier(u.reputationPoints),
      nationCode: u.nationCode,
    }));
  });

  res.json(members);
});

const CONFIDENCE_LEVELS = [
  { level: 1, label: "Doomed",    emoji: "💀", score: 10 },
  { level: 2, label: "Shaky",     emoji: "😟", score: 30 },
  { level: 3, label: "Neutral",   emoji: "😐", score: 50 },
  { level: 4, label: "Strong",    emoji: "💪", score: 75 },
  { level: 5, label: "Champions", emoji: "🔥", score: 95 },
];

async function buildConfidencePayload(code: string, userId?: number) {
  const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, code));
  if (!nation) return null;

  const votes = await db
    .select()
    .from(nationConfidenceVotesTable)
    .where(eq(nationConfidenceVotesTable.nationCode, code));

  const totalVotes = votes.length;
  const breakdown = CONFIDENCE_LEVELS.map((lvl) => {
    const count = votes.filter((v) => v.level === lvl.level).length;
    return { ...lvl, count, pct: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0 };
  });

  const overallConfidence =
    totalVotes > 0
      ? Math.round(votes.reduce((sum, v) => {
          const lvl = CONFIDENCE_LEVELS.find((l) => l.level === v.level);
          return sum + (lvl?.score ?? 50);
        }, 0) / totalVotes)
      : (nation.confidenceScore ?? 50);

  const myVote = userId
    ? (votes.find((v) => v.userId === userId)?.level ?? null)
    : null;

  return {
    nationCode: nation.code,
    nationName: nation.name,
    flagEmoji: nation.flagEmoji,
    overallConfidence,
    totalVotes,
    myVote,
    breakdown,
  };
}

router.get("/nations/:code/confidence", async (req, res): Promise<void> => {
  const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code).toUpperCase();
  const payload = await withCache(`nations:confidence:${code}`, TTL.CONFIDENCE, () => buildConfidencePayload(code));
  if (!payload) { res.status(404).json({ error: "Nation not found" }); return; }
  res.json(payload);
});

router.post("/nations/:code/confidence", requireAuth, async (req, res): Promise<void> => {
  const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code).toUpperCase();
  const clerkId = (req as any).replitUserId;
  const user = await getOrCreateUser(clerkId);

  const level = parseInt(req.body.level, 10);
  if (isNaN(level) || level < 1 || level > 5) {
    res.status(400).json({ error: "level must be 1–5" });
    return;
  }

  const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, code));
  if (!nation) { res.status(404).json({ error: "Nation not found" }); return; }

  // Upsert vote
  await db
    .insert(nationConfidenceVotesTable)
    .values({ nationCode: code, userId: user.id, level })
    .onConflictDoUpdate({
      target: [nationConfidenceVotesTable.nationCode, nationConfidenceVotesTable.userId],
      set: { level, updatedAt: new Date() },
    });

  // Recalculate and persist aggregate confidence score
  const allVotes = await db
    .select()
    .from(nationConfidenceVotesTable)
    .where(eq(nationConfidenceVotesTable.nationCode, code));

  const newScore = allVotes.length > 0
    ? allVotes.reduce((sum, v) => {
        const lvl = CONFIDENCE_LEVELS.find((l) => l.level === v.level);
        return sum + (lvl?.score ?? 50);
      }, 0) / allVotes.length
    : nation.confidenceScore ?? 50;

  await db
    .update(nationsTable)
    .set({ confidenceScore: newScore })
    .where(eq(nationsTable.code, code));

  // Award reputation for first-time vote
  const existingVotes = allVotes.filter(v => v.userId === user.id);
  if (existingVotes.length === 1) {
    await db
      .update(usersTable)
      .set({ reputationPoints: sql`${usersTable.reputationPoints} + 5` })
      .where(eq(usersTable.id, user.id));
    cacheDelPrefix("leaderboard:");
  }

  // Invalidate confidence + nation caches after vote
  cacheDel(`nations:confidence:${code}`);
  cacheDel(`nations:detail:${code}`);
  cacheDel(`nations:pulse:${code}`);
  cacheDelPrefix("nations:list:");

  const payload = await buildConfidencePayload(code, user.id);
  res.json(payload);
});

const ADVANCE_XP: Record<number, number> = { 5: 50, 4: 25, 3: 5, 2: 0, 1: 0 };

router.post("/nations/:code/advance", async (req, res): Promise<void> => {
  const secret = req.headers["x-resolve-secret"];
  if (secret !== (process.env.RESOLVE_SECRET ?? "fanverse-resolve-2026")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const code = (Array.isArray(req.params.code) ? req.params.code[0] : req.params.code).toUpperCase();
  const [nation] = await db.select().from(nationsTable).where(eq(nationsTable.code, code));
  if (!nation) { res.status(404).json({ error: "Nation not found" }); return; }

  const votes = await db
    .select()
    .from(nationConfidenceVotesTable)
    .where(eq(nationConfidenceVotesTable.nationCode, code));

  let totalXpAwarded = 0;
  let rewardedCount = 0;

  for (const vote of votes) {
    const xp = ADVANCE_XP[vote.level] ?? 0;
    if (xp > 0) {
      await db
        .update(usersTable)
        .set({ reputationPoints: sql`${usersTable.reputationPoints} + ${xp}` })
        .where(eq(usersTable.id, vote.userId));
      totalXpAwarded += xp;
      rewardedCount++;
    }
  }

  res.json({
    nationCode: code,
    nationName: nation.name,
    totalVoters: votes.length,
    rewardedCount,
    totalXpAwarded,
    breakdown: ADVANCE_XP,
  });
});

export default router;
