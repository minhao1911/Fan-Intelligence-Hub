/**
 * Match Simulator — cluster-aware via PostgreSQL advisory locks
 *
 * Every tick it tries to acquire a Postgres advisory lock (key 7426657265).
 * If another server instance already holds it, this tick is silently skipped —
 * only one instance ever processes matches at a time.
 *
 *   upcoming  → live       when scheduledAt <= now
 *   live      → completed  when scheduledAt + 95 min <= now
 */

import { eq, and, lte, sql } from "drizzle-orm";
import { db, pool, matchesTable, nationsTable, matchPredictionsTable, usersTable } from "@workspace/db";
import { logger } from "./logger";

const MATCH_DURATION_MS = 95 * 60 * 1000;
const TICK_INTERVAL_MS  = 60 * 1000;
const ADVISORY_LOCK_KEY = 7426657265; // "fanverse" as a stable bigint

// ─── Score generator ──────────────────────────────────────────────────────────
const SCORELINES: [number, number][] = [
  [0, 0], [0, 0],
  [1, 0], [1, 0], [1, 0], [1, 0],
  [0, 1], [0, 1], [0, 1], [0, 1],
  [1, 1], [1, 1], [1, 1],
  [2, 0], [2, 0], [2, 0],
  [0, 2], [0, 2], [0, 2],
  [2, 1], [2, 1], [2, 1],
  [1, 2], [1, 2], [1, 2],
  [2, 2],
  [3, 0], [3, 0],
  [0, 3], [0, 3],
  [3, 1], [3, 1],
  [1, 3], [1, 3],
  [3, 2], [2, 3],
  [4, 0], [0, 4],
  [4, 1], [1, 4],
];

function randomScore(): [number, number] {
  return SCORELINES[Math.floor(Math.random() * SCORELINES.length)];
}

// ─── PostgreSQL advisory lock helpers ────────────────────────────────────────
async function tryAcquireLock(): Promise<boolean> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS acquired",
      [ADVISORY_LOCK_KEY],
    );
    return rows[0]?.acquired ?? false;
  } finally {
    client.release();
  }
}

async function releaseLock(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
  } finally {
    client.release();
  }
}

// ─── Confidence nudge ────────────────────────────────────────────────────────
async function nudgeConfidence(nationCode: string, delta: number) {
  await db
    .update(nationsTable)
    .set({ confidenceScore: sql`GREATEST(1, LEAST(99, COALESCE(confidence_score, 50) + ${delta}))` })
    .where(eq(nationsTable.code, nationCode));
}

// ─── Settle predictions ──────────────────────────────────────────────────────
async function settlePredictions(matchId: number, homeScore: number, awayScore: number) {
  const outcome: "home" | "draw" | "away" =
    homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "draw";

  const preds = await db
    .select()
    .from(matchPredictionsTable)
    .where(and(eq(matchPredictionsTable.matchId, matchId), eq(matchPredictionsTable.isResolved, 0)));

  for (const pred of preds) {
    const outcomeCorrect = pred.predictedOutcome === outcome;
    const scoreExact = pred.predictedHomeScore === homeScore && pred.predictedAwayScore === awayScore;

    let bonusXp = 0;
    if (scoreExact) bonusXp = 30;
    else if (outcomeCorrect) bonusXp = 10;

    await db
      .update(matchPredictionsTable)
      .set({ isResolved: outcomeCorrect ? 1 : 2, xpEarned: pred.xpEarned + bonusXp })
      .where(eq(matchPredictionsTable.id, pred.id));

    if (bonusXp > 0) {
      await db
        .update(usersTable)
        .set({ reputationPoints: sql`reputation_points + ${bonusXp}` })
        .where(eq(usersTable.id, pred.userId));
    }
  }

  return preds.length;
}

// ─── Single tick (guarded by advisory lock) ───────────────────────────────────
async function tick() {
  const locked = await tryAcquireLock();
  if (!locked) {
    logger.debug("[simulator] Another instance holds the lock — skipping tick");
    return;
  }

  try {
    const now = new Date();
    const liveThreshold = new Date(now.getTime() - MATCH_DURATION_MS);

    // 1. upcoming → live
    const toStart = await db
      .select({ id: matchesTable.id, homeNationCode: matchesTable.homeNationCode, awayNationCode: matchesTable.awayNationCode })
      .from(matchesTable)
      .where(and(eq(matchesTable.status, "upcoming"), lte(matchesTable.scheduledAt, now)));

    for (const m of toStart) {
      await db.update(matchesTable).set({ status: "live" }).where(eq(matchesTable.id, m.id));
      logger.info({ matchId: m.id, home: m.homeNationCode, away: m.awayNationCode }, "[simulator] Match started → live");
    }

    // 2. live → completed
    const toComplete = await db
      .select()
      .from(matchesTable)
      .where(and(eq(matchesTable.status, "live"), lte(matchesTable.scheduledAt, liveThreshold)));

    for (const m of toComplete) {
      const [homeScore, awayScore] = randomScore();
      const outcome = homeScore > awayScore ? "home" : homeScore < awayScore ? "away" : "draw";

      await db.update(matchesTable).set({ status: "completed", homeScore, awayScore }).where(eq(matchesTable.id, m.id));

      if (outcome === "home") {
        await nudgeConfidence(m.homeNationCode, 3);
        await nudgeConfidence(m.awayNationCode, -2);
      } else if (outcome === "away") {
        await nudgeConfidence(m.awayNationCode, 3);
        await nudgeConfidence(m.homeNationCode, -2);
      } else {
        await nudgeConfidence(m.homeNationCode, 1);
        await nudgeConfidence(m.awayNationCode, 1);
      }

      const settled = await settlePredictions(m.id, homeScore, awayScore);
      logger.info({ matchId: m.id, home: m.homeNationCode, away: m.awayNationCode, homeScore, awayScore, settled }, "[simulator] Match completed");
    }

    if (toStart.length > 0 || toComplete.length > 0) {
      logger.info({ started: toStart.length, completed: toComplete.length }, "[simulator] Tick applied changes");
    }
  } finally {
    await releaseLock();
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function startMatchSimulator() {
  logger.info("[simulator] Match simulator starting (cluster-aware via pg advisory lock)");
  tick().catch((err) => logger.error({ err }, "[simulator] Tick error"));
  const interval = setInterval(() => {
    tick().catch((err) => logger.error({ err }, "[simulator] Tick error"));
  }, TICK_INTERVAL_MS);
  interval.unref();
  return interval;
}
