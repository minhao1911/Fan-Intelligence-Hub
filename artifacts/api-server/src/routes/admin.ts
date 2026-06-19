import { Router } from "express";
import { eq, sql, and, count, inArray } from "drizzle-orm";
import {
  db,
  matchesTable,
  matchPredictionsTable,
  usersTable,
  nationsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// ── List all matches with prediction counts ──────────────────────────────────
router.get("/admin/matches", requireAuth, async (req, res): Promise<void> => {
  const matches = await db
    .select()
    .from(matchesTable)
    .orderBy(matchesTable.scheduledAt);

  if (matches.length === 0) { res.json([]); return; }

  const predCounts = await db
    .select({ matchId: matchPredictionsTable.matchId, cnt: count() })
    .from(matchPredictionsTable)
    .groupBy(matchPredictionsTable.matchId);

  const countMap = new Map(predCounts.map((r) => [r.matchId, Number(r.cnt)]));

  const allCodes = [...new Set([
    ...matches.map((m) => m.homeNationCode),
    ...matches.map((m) => m.awayNationCode),
  ])];

  const nations = await db
    .select({ code: nationsTable.code, name: nationsTable.name, flag: nationsTable.flagEmoji })
    .from(nationsTable)
    .where(inArray(nationsTable.code, allCodes));

  const nationMap = new Map(nations.map((n) => [n.code, n]));

  const result = matches.map((m) => ({
    id: m.id,
    homeNationCode: m.homeNationCode,
    homeNationName: nationMap.get(m.homeNationCode)?.name ?? m.homeNationCode,
    homeNationFlag: nationMap.get(m.homeNationCode)?.flag ?? "🏳️",
    awayNationCode: m.awayNationCode,
    awayNationName: nationMap.get(m.awayNationCode)?.name ?? m.awayNationCode,
    awayNationFlag: nationMap.get(m.awayNationCode)?.flag ?? "🏳️",
    stage: m.stage,
    status: m.status,
    scheduledAt: m.scheduledAt,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    predictionCount: countMap.get(m.id) ?? 0,
  }));

  res.json(result);
});

// ── Update match status ───────────────────────────────────────────────────────
router.patch("/admin/matches/:matchId/status", requireAuth, async (req, res): Promise<void> => {
  const matchId = parseInt(req.params.matchId, 10);
  const { status } = req.body;

  if (!["upcoming", "live"].includes(status)) {
    res.status(400).json({ error: "status must be upcoming or live" });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (match.status === "completed") {
    res.status(409).json({ error: "Cannot change status of a completed match" });
    return;
  }

  await db.update(matchesTable).set({ status }).where(eq(matchesTable.id, matchId));
  res.json({ matchId, status });
});

// ── Resolve a match and settle predictions ────────────────────────────────────
router.post("/admin/matches/:matchId/resolve", requireAuth, async (req, res): Promise<void> => {
  const matchId = parseInt(req.params.matchId, 10);
  const { homeScore, awayScore } = req.body;

  if (typeof homeScore !== "number" || typeof awayScore !== "number") {
    res.status(400).json({ error: "homeScore and awayScore must be numbers" });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (match.status === "completed") { res.status(409).json({ error: "Match already resolved" }); return; }

  const actualOutcome: "home" | "draw" | "away" =
    homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "draw";

  await db
    .update(matchesTable)
    .set({ status: "completed", homeScore, awayScore })
    .where(eq(matchesTable.id, matchId));

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

    let bonusXp = 0;
    if (scoreExact) {
      bonusXp = 30;
    } else if (outcomeCorrect) {
      bonusXp = 10;
    }

    const isResolved = outcomeCorrect ? 1 : 2;
    const totalXp = 5 + bonusXp;

    await db
      .update(matchPredictionsTable)
      .set({ isResolved, xpEarned: totalXp })
      .where(and(
        eq(matchPredictionsTable.matchId, matchId),
        eq(matchPredictionsTable.userId, pred.userId),
      ));

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

  res.json({ matchId, homeScore, awayScore, actualOutcome, settledCount, correctCount, exactCount });
});

export default router;
