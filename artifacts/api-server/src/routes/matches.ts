import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, matchesTable, nationsTable, pollsTable, pollOptionsTable, pollVotesTable, reactionsTable, usersTable, matchPredictionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateUser, getReputationTier } from "../lib/userHelpers";
import { CastPollVoteBody, SubmitReactionBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function formatMatchRow(m: any) {
  const [homeNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, m.homeNationCode));
  const [awayNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, m.awayNationCode));
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
    homeConfidence: homeNation?.confidenceScore ?? null,
    awayConfidence: awayNation?.confidenceScore ?? null,
  };
}

router.get("/matches", async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const nationCode = typeof req.query.nationCode === "string" ? req.query.nationCode : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10) || 20, 100);

  const conditions: any[] = [];
  if (status) conditions.push(eq(matchesTable.status, status));
  if (nationCode) {
    conditions.push(sql`(${matchesTable.homeNationCode} = ${nationCode.toUpperCase()} OR ${matchesTable.awayNationCode} = ${nationCode.toUpperCase()})`);
  }

  const matches = await db
    .select()
    .from(matchesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(matchesTable.scheduledAt)
    .limit(limit);

  const formatted = await Promise.all(matches.map(formatMatchRow));
  res.json(formatted);
});

router.get("/matches/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [homeNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, match.homeNationCode));
  const [awayNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, match.awayNationCode));

  const polls = await db.select().from(pollsTable).where(eq(pollsTable.matchId, id));
  const formattedPolls = await Promise.all(polls.map(async (p) => {
    const options = await db.select().from(pollOptionsTable).where(eq(pollOptionsTable.pollId, p.id));
    const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);
    return {
      id: p.id,
      matchId: p.matchId,
      question: p.question,
      pollType: p.pollType,
      options: options.map(o => ({
        value: o.value,
        label: o.label,
        voteCount: o.voteCount,
        percentage: totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : 0,
      })),
      totalVotes,
      userVote: null,
      closesAt: p.closesAt?.toISOString() ?? null,
    };
  }));

  const reactionCounts = await db
    .select({ type: reactionsTable.reactionType, count: sql<number>`count(*)::int` })
    .from(reactionsTable)
    .where(eq(reactionsTable.matchId, id))
    .groupBy(reactionsTable.reactionType);

  const reactions: Record<string, number> = { ecstatic: 0, satisfied: 0, neutral: 0, disappointed: 0, devastated: 0 };
  let totalReactions = 0;
  for (const r of reactionCounts) {
    reactions[r.type] = r.count;
    totalReactions += r.count;
  }

  let dominantReaction: string | null = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(reactions)) {
    if (count > maxCount) { maxCount = count; dominantReaction = type; }
  }

  const sentimentMap: Record<string, number> = { ecstatic: 1, satisfied: 0.5, neutral: 0, disappointed: -0.5, devastated: -1 };
  let sentimentSum = 0;
  for (const [type, count] of Object.entries(reactions)) {
    sentimentSum += (sentimentMap[type] ?? 0) * count;
  }
  const averageSentiment = totalReactions > 0 ? sentimentSum / totalReactions : 0;

  const homeConf = homeNation?.confidenceScore ?? 50;
  const awayConf = awayNation?.confidenceScore ?? 50;
  const total = homeConf + awayConf;
  const homeWinConf = total > 0 ? Math.round((homeConf / total) * 70) : 35;
  const awayWinConf = total > 0 ? Math.round((awayConf / total) * 70) : 35;
  const drawConf = 100 - homeWinConf - awayWinConf;

  res.json({
    id: match.id,
    homeNationCode: match.homeNationCode,
    homeNationName: homeNation?.name ?? match.homeNationCode,
    homeNationFlag: homeNation?.flagEmoji ?? "🏳",
    awayNationCode: match.awayNationCode,
    awayNationName: awayNation?.name ?? match.awayNationCode,
    awayNationFlag: awayNation?.flagEmoji ?? "🏳",
    competition: match.competition,
    stage: match.stage,
    status: match.status,
    scheduledAt: match.scheduledAt.toISOString(),
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    polls: formattedPolls,
    pulse: {
      matchId: match.id,
      homeNationCode: match.homeNationCode,
      awayNationCode: match.awayNationCode,
      homeWinConfidence: homeWinConf,
      drawConfidence: drawConf,
      awayWinConfidence: awayWinConf,
      homeExpectedGoals: 1.8,
      awayExpectedGoals: 1.2,
      fanMoodScore: 0.6,
      totalVoters: totalReactions + formattedPolls.reduce((s, p) => s + p.totalVotes, 0),
      homeVoterCount: Math.floor(totalReactions * 0.45),
      awayVoterCount: Math.floor(totalReactions * 0.35),
      neutralVoterCount: Math.floor(totalReactions * 0.2),
    },
    reactionSummary: {
      matchId: match.id,
      total: totalReactions,
      ...reactions,
      dominantReaction,
      averageSentiment,
    },
  });
});

router.get("/matches/:id/pulse", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [homeNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, match.homeNationCode));
  const [awayNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, match.awayNationCode));

  const homeConf = homeNation?.confidenceScore ?? 50;
  const awayConf = awayNation?.confidenceScore ?? 50;
  const total = homeConf + awayConf;
  const homeWinConf = total > 0 ? Math.round((homeConf / total) * 70) : 35;
  const awayWinConf = total > 0 ? Math.round((awayConf / total) * 70) : 35;
  const drawConf = 100 - homeWinConf - awayWinConf;

  res.json({
    matchId: match.id,
    homeNationCode: match.homeNationCode,
    awayNationCode: match.awayNationCode,
    homeWinConfidence: homeWinConf,
    drawConfidence: drawConf,
    awayWinConfidence: awayWinConf,
    homeExpectedGoals: 1.8,
    awayExpectedGoals: 1.2,
    fanMoodScore: 0.6,
    totalVoters: 0,
    homeVoterCount: 0,
    awayVoterCount: 0,
    neutralVoterCount: 0,
  });
});

router.get("/matches/:matchId/polls", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const polls = await db.select().from(pollsTable).where(eq(pollsTable.matchId, matchId));
  const formatted = await Promise.all(polls.map(async (p) => {
    const options = await db.select().from(pollOptionsTable).where(eq(pollOptionsTable.pollId, p.id));
    const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);
    return {
      id: p.id,
      matchId: p.matchId,
      question: p.question,
      pollType: p.pollType,
      options: options.map(o => ({
        value: o.value,
        label: o.label,
        voteCount: o.voteCount,
        percentage: totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : 0,
      })),
      totalVotes,
      userVote: null,
      closesAt: p.closesAt?.toISOString() ?? null,
    };
  }));
  res.json(formatted);
});

router.post("/matches/:matchId/polls/:pollId/vote", requireAuth, async (req, res): Promise<void> => {
  const rawMatchId = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const rawPollId = Array.isArray(req.params.pollId) ? req.params.pollId[0] : req.params.pollId;
  const matchId = parseInt(rawMatchId, 10);
  const pollId = parseInt(rawPollId, 10);

  const parsed = CastPollVoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const clerkId = (req as any).clerkUserId;
  const user = await getOrCreateUser(clerkId);

  const existing = await db
    .select()
    .from(pollVotesTable)
    .where(and(eq(pollVotesTable.pollId, pollId), eq(pollVotesTable.userId, user.id)));

  if (existing[0]) {
    await db
      .update(pollOptionsTable)
      .set({ voteCount: sql`${pollOptionsTable.voteCount} - 1` })
      .where(and(eq(pollOptionsTable.pollId, pollId), eq(pollOptionsTable.value, existing[0].optionValue)));

    await db
      .update(pollVotesTable)
      .set({ optionValue: parsed.data.optionValue })
      .where(and(eq(pollVotesTable.pollId, pollId), eq(pollVotesTable.userId, user.id)));
  } else {
    await db.insert(pollVotesTable).values({
      pollId,
      userId: user.id,
      optionValue: parsed.data.optionValue,
    });
    await db
      .update(usersTable)
      .set({ totalVotes: sql`${usersTable.totalVotes} + 1`, reputationPoints: sql`${usersTable.reputationPoints} + 5` })
      .where(eq(usersTable.id, user.id));
  }

  await db
    .update(pollOptionsTable)
    .set({ voteCount: sql`${pollOptionsTable.voteCount} + 1` })
    .where(and(eq(pollOptionsTable.pollId, pollId), eq(pollOptionsTable.value, parsed.data.optionValue)));

  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId));
  const options = await db.select().from(pollOptionsTable).where(eq(pollOptionsTable.pollId, pollId));
  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);

  res.json({
    id: poll.id,
    matchId: poll.matchId,
    question: poll.question,
    pollType: poll.pollType,
    options: options.map(o => ({
      value: o.value,
      label: o.label,
      voteCount: o.voteCount,
      percentage: totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : 0,
    })),
    totalVotes,
    userVote: parsed.data.optionValue,
    closesAt: poll.closesAt?.toISOString() ?? null,
  });
});

router.get("/matches/:matchId/reactions", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const reactions = await db
    .select()
    .from(reactionsTable)
    .where(eq(reactionsTable.matchId, matchId))
    .orderBy(desc(reactionsTable.createdAt))
    .limit(50);

  const formatted = await Promise.all(reactions.map(async (r) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId));
    return {
      id: r.id,
      matchId: r.matchId,
      userId: r.userId,
      username: user?.username ?? "Anonymous",
      avatarUrl: user?.avatarUrl ?? null,
      nationCode: user?.nationCode ?? null,
      reactionType: r.reactionType,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    };
  }));

  res.json(formatted);
});

router.post("/matches/:matchId/reactions", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const parsed = SubmitReactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const clerkId = (req as any).clerkUserId;
  const user = await getOrCreateUser(clerkId);

  const [reaction] = await db.insert(reactionsTable).values({
    matchId,
    userId: user.id,
    reactionType: parsed.data.reactionType,
    comment: parsed.data.comment ?? null,
  }).returning();

  await db
    .update(usersTable)
    .set({ totalReactions: sql`${usersTable.totalReactions} + 1`, reputationPoints: sql`${usersTable.reputationPoints} + 3` })
    .where(eq(usersTable.id, user.id));

  res.status(201).json({
    id: reaction.id,
    matchId: reaction.matchId,
    userId: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    nationCode: user.nationCode,
    reactionType: reaction.reactionType,
    comment: reaction.comment,
    createdAt: reaction.createdAt.toISOString(),
  });
});

router.get("/matches/:matchId/reactions/summary", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const reactionCounts = await db
    .select({ type: reactionsTable.reactionType, count: sql<number>`count(*)::int` })
    .from(reactionsTable)
    .where(eq(reactionsTable.matchId, matchId))
    .groupBy(reactionsTable.reactionType);

  const reactions: Record<string, number> = { ecstatic: 0, satisfied: 0, neutral: 0, disappointed: 0, devastated: 0 };
  let total = 0;
  for (const r of reactionCounts) {
    reactions[r.type] = r.count;
    total += r.count;
  }

  let dominantReaction: string | null = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(reactions)) {
    if (count > maxCount) { maxCount = count; dominantReaction = type; }
  }

  const sentimentMap: Record<string, number> = { ecstatic: 1, satisfied: 0.5, neutral: 0, disappointed: -0.5, devastated: -1 };
  let sentimentSum = 0;
  for (const [type, count] of Object.entries(reactions)) {
    sentimentSum += (sentimentMap[type] ?? 0) * count;
  }
  const averageSentiment = total > 0 ? sentimentSum / total : 0;

  res.json({
    matchId,
    total,
    ...reactions,
    dominantReaction,
    averageSentiment,
  });
});

// ── Predictions ─────────────────────────────────────────────────────────────

router.post("/matches/:matchId/predict", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const clerkId = (req as any).clerkUserId;
  const user = await getOrCreateUser(clerkId);

  const { predictedOutcome, predictedHomeScore, predictedAwayScore } = req.body;
  if (!["home", "draw", "away"].includes(predictedOutcome)) {
    res.status(400).json({ error: "predictedOutcome must be home, draw, or away" });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (match.status !== "upcoming") { res.status(409).json({ error: "Match already started or completed" }); return; }

  const [existing] = await db
    .select()
    .from(matchPredictionsTable)
    .where(and(eq(matchPredictionsTable.matchId, matchId), eq(matchPredictionsTable.userId, user.id)));

  let prediction;
  if (existing) {
    [prediction] = await db
      .update(matchPredictionsTable)
      .set({
        predictedOutcome,
        predictedHomeScore: predictedHomeScore ?? null,
        predictedAwayScore: predictedAwayScore ?? null,
      })
      .where(and(eq(matchPredictionsTable.matchId, matchId), eq(matchPredictionsTable.userId, user.id)))
      .returning();
  } else {
    [prediction] = await db
      .insert(matchPredictionsTable)
      .values({
        matchId,
        userId: user.id,
        predictedOutcome,
        predictedHomeScore: predictedHomeScore ?? null,
        predictedAwayScore: predictedAwayScore ?? null,
        xpEarned: 5,
      })
      .returning();
    // Award +5 XP for first prediction on this match
    await db
      .update(usersTable)
      .set({ reputationPoints: sql`${usersTable.reputationPoints} + 5` })
      .where(eq(usersTable.id, user.id));
  }

  res.json({
    matchId: prediction.matchId,
    predictedOutcome: prediction.predictedOutcome,
    predictedHomeScore: prediction.predictedHomeScore,
    predictedAwayScore: prediction.predictedAwayScore,
    xpEarned: prediction.xpEarned,
  });
});

router.get("/matches/:matchId/my-prediction", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const clerkId = (req as any).clerkUserId;
  const user = await getOrCreateUser(clerkId);

  const [prediction] = await db
    .select()
    .from(matchPredictionsTable)
    .where(and(eq(matchPredictionsTable.matchId, matchId), eq(matchPredictionsTable.userId, user.id)));

  if (!prediction) { res.status(404).json({ error: "No prediction" }); return; }

  res.json({
    matchId: prediction.matchId,
    predictedOutcome: prediction.predictedOutcome,
    predictedHomeScore: prediction.predictedHomeScore,
    predictedAwayScore: prediction.predictedAwayScore,
    xpEarned: prediction.xpEarned,
  });
});

router.get("/matches/:matchId/predictions/summary", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const preds = await db
    .select()
    .from(matchPredictionsTable)
    .where(eq(matchPredictionsTable.matchId, matchId));

  const total = preds.length;
  const count = (o: string) => preds.filter((p) => p.predictedOutcome === o).length;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const homeCount = count("home");
  const drawCount = count("draw");
  const awayCount = count("away");

  res.json({
    matchId,
    total,
    homePct: pct(homeCount),
    drawPct: pct(drawCount),
    awayPct: pct(awayCount),
  });
});

// ── Public prediction stats (shareable) ──────────────────────────────────────
router.get("/matches/:matchId/predictions/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  const [homeNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, match.homeNationCode));
  const [awayNation] = await db.select().from(nationsTable).where(eq(nationsTable.code, match.awayNationCode));

  const preds = await db
    .select()
    .from(matchPredictionsTable)
    .where(eq(matchPredictionsTable.matchId, matchId))
    .orderBy(matchPredictionsTable.createdAt);

  const total = preds.length;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  const homeCount = preds.filter((p) => p.predictedOutcome === "home").length;
  const drawCount = preds.filter((p) => p.predictedOutcome === "draw").length;
  const awayCount = preds.filter((p) => p.predictedOutcome === "away").length;

  // Top scorelines (only where both scores were entered)
  const scoredPreds = preds.filter((p) => p.predictedHomeScore != null && p.predictedAwayScore != null);
  const scoreMap = new Map<string, { homeScore: number; awayScore: number; outcome: string; count: number }>();
  for (const p of scoredPreds) {
    const key = `${p.predictedHomeScore}-${p.predictedAwayScore}`;
    const existing = scoreMap.get(key);
    const outcome = p.predictedHomeScore! > p.predictedAwayScore! ? "home"
      : p.predictedHomeScore! < p.predictedAwayScore! ? "away" : "draw";
    if (existing) existing.count++;
    else scoreMap.set(key, { homeScore: p.predictedHomeScore!, awayScore: p.predictedAwayScore!, outcome, count: 1 });
  }
  const topScorelines = [...scoreMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((s) => ({ ...s, pct: scoredPreds.length > 0 ? Math.round((s.count / scoredPreds.length) * 100) : 0 }));

  // Trend: bucket predictions by day (relative to match scheduledAt)
  const matchDate = match.scheduledAt;
  const bucketMap = new Map<string, { label: string; homeCount: number; drawCount: number; awayCount: number; order: number }>();
  for (const p of preds) {
    const d = new Date(p.createdAt);
    const dayKey = d.toISOString().slice(0, 10);
    if (!bucketMap.has(dayKey)) {
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      bucketMap.set(dayKey, { label, homeCount: 0, drawCount: 0, awayCount: 0, order: d.getTime() });
    }
    const b = bucketMap.get(dayKey)!;
    if (p.predictedOutcome === "home") b.homeCount++;
    else if (p.predictedOutcome === "draw") b.drawCount++;
    else b.awayCount++;
  }
  const trend = [...bucketMap.values()].sort((a, b) => a.order - b.order);

  // Top predictors (for completed matches: show correct/exact; for upcoming: show early birds)
  let topPredictors: any[] = [];
  if (total > 0) {
    const limit = match.status === "completed" ? 6 : 5;
    const relevant = match.status === "completed"
      ? preds.filter((p) => p.isResolved === 1).sort((a, b) => (b.xpEarned ?? 0) - (a.xpEarned ?? 0)).slice(0, limit)
      : preds.slice(0, limit); // early birds

    if (relevant.length > 0) {
      const userIds = relevant.map((p) => p.userId);
      const users = await db.select().from(usersTable).where(sql`${usersTable.id} = ANY(ARRAY[${sql.raw(userIds.map((id) => `'${id}'`).join(","))}])`);
      const userMap = new Map(users.map((u) => [u.id, u]));

      topPredictors = relevant.map((p) => {
        const u = userMap.get(p.userId);
        return {
          username: u?.username ?? "Fan",
          nationCode: u?.nationCode ?? null,
          reputationTier: u?.reputationPoints != null ? getReputationTier(u.reputationPoints) : "fan",
          predictedOutcome: p.predictedOutcome,
          predictedHomeScore: p.predictedHomeScore,
          predictedAwayScore: p.predictedAwayScore,
          isCorrect: p.isResolved === 1,
          isExact: p.isResolved === 1 && p.predictedHomeScore === match.homeScore && p.predictedAwayScore === match.awayScore,
          xpEarned: p.xpEarned ?? 5,
        };
      });
    }
  }

  res.json({
    match: {
      id: match.id,
      homeNationCode: match.homeNationCode,
      homeNationName: homeNation?.name ?? match.homeNationCode,
      homeNationFlag: homeNation?.flagEmoji ?? "🏳️",
      awayNationCode: match.awayNationCode,
      awayNationName: awayNation?.name ?? match.awayNationCode,
      awayNationFlag: awayNation?.flagEmoji ?? "🏳️",
      stage: match.stage,
      scheduledAt: match.scheduledAt,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    },
    community: { total, homeCount, drawCount, awayCount, homePct: pct(homeCount), drawPct: pct(drawCount), awayPct: pct(awayCount) },
    topScorelines,
    trend,
    topPredictors,
    scoredCount: scoredPreds.length,
  });
});

// ── Resolve a match and settle all predictions ──────────────────────────────
// POST /api/matches/:matchId/resolve  { homeScore: number, awayScore: number }
// Protected by a simple RESOLVE_SECRET header so it can't be abused publicly.
router.post("/matches/:matchId/resolve", async (req, res): Promise<void> => {
  const secret = req.headers["x-resolve-secret"];
  if (secret !== (process.env.RESOLVE_SECRET ?? "fanverse-resolve-2026")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const raw = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
  const matchId = parseInt(raw, 10);

  const { homeScore, awayScore } = req.body;
  if (typeof homeScore !== "number" || typeof awayScore !== "number") {
    res.status(400).json({ error: "homeScore and awayScore must be numbers" });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (match.status === "completed") { res.status(409).json({ error: "Match already resolved" }); return; }

  // Determine actual outcome
  const actualOutcome: "home" | "draw" | "away" =
    homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "draw";

  // Update match record
  await db
    .update(matchesTable)
    .set({ status: "completed", homeScore, awayScore })
    .where(eq(matchesTable.id, matchId));

  // Settle all predictions for this match
  const preds = await db
    .select()
    .from(matchPredictionsTable)
    .where(eq(matchPredictionsTable.matchId, matchId));

  let settledCount = 0;
  let correctCount = 0;
  let exactCount = 0;

  for (const pred of preds) {
    const outcomeCorrect = pred.predictedOutcome === actualOutcome;
    const scoreExact =
      pred.predictedHomeScore === homeScore &&
      pred.predictedAwayScore === awayScore;

    // XP breakdown: +5 already awarded on submit, +10 bonus for correct outcome, +20 bonus for exact score
    let bonusXp = 0;
    if (scoreExact) {
      bonusXp = 30; // total 35 XP
    } else if (outcomeCorrect) {
      bonusXp = 10; // total 15 XP
    }

    const isResolved = outcomeCorrect ? 1 : 2;
    const totalXp = 5 + bonusXp;

    await db
      .update(matchPredictionsTable)
      .set({ isResolved, xpEarned: totalXp })
      .where(and(eq(matchPredictionsTable.matchId, matchId), eq(matchPredictionsTable.userId, pred.userId)));

    if (bonusXp > 0) {
      await db
        .update(usersTable)
        .set({ reputationPoints: sql`${usersTable.reputationPoints} + ${bonusXp}` })
        .where(eq(usersTable.id, pred.userId));
    }

    settledCount++;
    if (outcomeCorrect) correctCount++;
    if (scoreExact) exactCount++;
  }

  res.json({
    matchId,
    homeScore,
    awayScore,
    actualOutcome,
    settledCount,
    correctCount,
    exactCount,
  });
});

export default router;
