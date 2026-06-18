import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, matchesTable, nationsTable, pollsTable, pollOptionsTable, pollVotesTable, reactionsTable, usersTable } from "@workspace/db";
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

export default router;
