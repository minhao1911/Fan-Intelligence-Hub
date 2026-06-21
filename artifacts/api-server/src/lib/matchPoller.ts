import { db, matchesTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { logger } from "./logger";

const FOOTBALL_DATA_API_KEY = process.env["FOOTBALL_DATA_API_KEY"];
const POLL_INTERVAL_MS = 60_000;

const FD_STATUS_MAP: Record<string, string> = {
  SCHEDULED: "upcoming",
  TIMED: "upcoming",
  IN_PLAY: "live",
  PAUSED: "live",
  HALFTIME: "live",
  EXTRA_TIME: "live",
  PENALTY_SHOOTOUT: "live",
  FINISHED: "completed",
  SUSPENDED: "upcoming",
  POSTPONED: "upcoming",
  CANCELLED: "upcoming",
  AWARDED: "completed",
};

async function syncFromFootballData(): Promise<void> {
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": FOOTBALL_DATA_API_KEY! },
  });

  if (!res.ok) {
    logger.warn({ status: res.status, body: await res.text() }, "football-data.org API error");
    return;
  }

  const data = (await res.json()) as { matches: Array<{
    homeTeam: { tla: string };
    awayTeam: { tla: string };
    status: string;
    score: { fullTime: { home: number | null; away: number | null } };
  }> };

  const dbMatches = await db.select().from(matchesTable);
  let updated = 0;

  for (const fdMatch of data.matches) {
    const homeTla = fdMatch.homeTeam?.tla?.toUpperCase();
    const awayTla = fdMatch.awayTeam?.tla?.toUpperCase();
    if (!homeTla || !awayTla) continue;

    const ourStatus = FD_STATUS_MAP[fdMatch.status] ?? "upcoming";
    const homeScore = fdMatch.score?.fullTime?.home ?? null;
    const awayScore = fdMatch.score?.fullTime?.away ?? null;

    const dbMatch = dbMatches.find(
      (m) => m.homeNationCode === homeTla && m.awayNationCode === awayTla,
    );
    if (!dbMatch) continue;

    if (
      dbMatch.status === ourStatus &&
      dbMatch.homeScore === homeScore &&
      dbMatch.awayScore === awayScore
    ) continue;

    await db
      .update(matchesTable)
      .set({ status: ourStatus, homeScore, awayScore })
      .where(eq(matchesTable.id, dbMatch.id));

    updated++;
  }

  if (updated > 0) {
    logger.info({ updated }, "Synced match statuses from football-data.org");
  }
}

async function advanceByTime(): Promise<void> {
  const now = new Date();
  const matchEndCutoff = new Date(now.getTime() - 105 * 60 * 1000);

  const toLive = await db
    .update(matchesTable)
    .set({ status: "live" })
    .where(and(eq(matchesTable.status, "upcoming"), lte(matchesTable.scheduledAt, now)))
    .returning({ id: matchesTable.id });

  const toCompleted = await db
    .update(matchesTable)
    .set({ status: "completed" })
    .where(and(eq(matchesTable.status, "live"), lte(matchesTable.scheduledAt, matchEndCutoff)))
    .returning({ id: matchesTable.id });

  if (toLive.length > 0 || toCompleted.length > 0) {
    logger.info(
      { toLive: toLive.length, toCompleted: toCompleted.length },
      "Advanced match statuses by time",
    );
  }
}

async function poll(): Promise<void> {
  try {
    if (FOOTBALL_DATA_API_KEY) {
      await syncFromFootballData();
    } else {
      await advanceByTime();
    }
  } catch (err) {
    logger.warn({ err }, "Match poller tick failed (non-fatal)");
  }
}

export function startMatchPoller(): void {
  const mode = FOOTBALL_DATA_API_KEY ? "football-data.org" : "time-based (no FOOTBALL_DATA_API_KEY set)";
  logger.info({ mode }, "Match poller started");
  void poll();
  setInterval(poll, POLL_INTERVAL_MS);
}
