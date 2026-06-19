import { Router, type IRouter } from "express";
import { eq, like, asc } from "drizzle-orm";
import { db, matchesTable, nationsTable } from "@workspace/db";

const router: IRouter = Router();

function nationToTeam(nation: typeof nationsTable.$inferSelect | undefined, fallbackCode: string) {
  const code = nation?.code ?? fallbackCode;
  const name = nation?.name ?? fallbackCode;
  return { id: 0, name, shortName: name, crest: null, tla: code, flagEmoji: nation?.flagEmoji ?? null };
}

function mapDbStatus(status: string): "upcoming" | "live" | "completed" {
  if (status === "live") return "live";
  if (status === "finished" || status === "completed") return "completed";
  return "upcoming";
}

function dbStageToApiStage(stage: string | null): string {
  if (!stage) return "GROUP_STAGE";
  const s = stage.toLowerCase();
  if (s.startsWith("group")) return "GROUP_STAGE";
  if (s.includes("round of 32")) return "ROUND_OF_32";
  if (s.includes("round of 16")) return "ROUND_OF_16";
  if (s.includes("quarter")) return "QUARTER_FINALS";
  if (s.includes("semi")) return "SEMI_FINALS";
  if (s.includes("third") || s.includes("3rd")) return "THIRD_PLACE";
  if (s === "final") return "FINAL";
  return stage.toUpperCase().replace(/ /g, "_");
}

function apiStageToDbPattern(apiStage: string): { exact?: string; pattern?: string } {
  const map: Record<string, { exact?: string; pattern?: string }> = {
    GROUP_STAGE:    { pattern: "Group %" },
    ROUND_OF_32:   { exact: "Round of 32" },
    ROUND_OF_16:   { exact: "Round of 16" },
    QUARTER_FINALS:{ pattern: "Quarter%" },
    SEMI_FINALS:   { pattern: "Semi%" },
    THIRD_PLACE:   { pattern: "Third%" },
    FINAL:         { exact: "Final" },
  };
  return map[apiStage] ?? { exact: apiStage };
}

function computeWinner(
  homeScore: number | null,
  awayScore: number | null,
  status: string,
): "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null {
  if (homeScore === null || awayScore === null) return null;
  if (status !== "finished" && status !== "completed") return null;
  if (homeScore > awayScore) return "HOME_TEAM";
  if (awayScore > homeScore) return "AWAY_TEAM";
  return "DRAW";
}

function formatMatch(
  m: typeof matchesTable.$inferSelect,
  nationMap: Record<string, typeof nationsTable.$inferSelect>,
) {
  const homeNation = nationMap[m.homeNationCode];
  const awayNation = nationMap[m.awayNationCode];
  return {
    id: m.id,
    homeTeam: nationToTeam(homeNation, m.homeNationCode),
    awayTeam: nationToTeam(awayNation, m.awayNationCode),
    status: mapDbStatus(m.status),
    rawStatus: m.status.toUpperCase(),
    utcDate: m.scheduledAt.toISOString(),
    score: {
      home: m.homeScore ?? null,
      away: m.awayScore ?? null,
      winner: computeWinner(m.homeScore ?? null, m.awayScore ?? null, m.status),
    },
    stage: dbStageToApiStage(m.stage ?? null),
    group: m.stage?.startsWith("Group ") ? m.stage : null,
    matchday: null,
    venue: null,
    referees: [],
    minute: null,
  };
}

router.get("/fixtures", async (req, res): Promise<void> => {
  try {
    const stageFilter = typeof req.query.stage === "string" ? req.query.stage : null;

    let rows: (typeof matchesTable.$inferSelect)[];
    if (stageFilter) {
      const { exact, pattern } = apiStageToDbPattern(stageFilter);
      if (pattern) {
        rows = await db.select().from(matchesTable)
          .where(like(matchesTable.stage, pattern))
          .orderBy(asc(matchesTable.scheduledAt)).limit(200);
      } else if (exact) {
        rows = await db.select().from(matchesTable)
          .where(eq(matchesTable.stage, exact))
          .orderBy(asc(matchesTable.scheduledAt)).limit(200);
      } else {
        rows = [];
      }
    } else {
      rows = await db.select().from(matchesTable)
        .orderBy(asc(matchesTable.scheduledAt)).limit(200);
    }

    const nations = await db.select().from(nationsTable);
    const nationMap = Object.fromEntries(nations.map((n) => [n.code, n]));
    const matches = rows.map((m) => formatMatch(m, nationMap));

    res.json({
      matches,
      count: matches.length,
      competition: { id: 2000, name: "FIFA World Cup 2026", emblem: null },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fixtures/standings", async (req, res): Promise<void> => {
  try {
    const groupMatches = await db.select().from(matchesTable)
      .where(like(matchesTable.stage, "Group %"))
      .orderBy(asc(matchesTable.scheduledAt));

    const nations = await db.select().from(nationsTable);
    const nationMap = Object.fromEntries(nations.map((n) => [n.code, n]));

    const groupsMap: Record<string, Record<string, {
      code: string; played: number; won: number; draw: number; lost: number;
      gf: number; ga: number; points: number;
    }>> = {};

    for (const m of groupMatches) {
      const grp = m.stage!;
      if (!groupsMap[grp]) groupsMap[grp] = {};
      for (const code of [m.homeNationCode, m.awayNationCode]) {
        if (!groupsMap[grp][code]) {
          groupsMap[grp][code] = { code, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, points: 0 };
        }
      }
      if (m.status === "finished" || m.status === "completed") {
        const hs = m.homeScore ?? 0;
        const as_ = m.awayScore ?? 0;
        const h = groupsMap[grp][m.homeNationCode];
        const a = groupsMap[grp][m.awayNationCode];
        h.played++; a.played++;
        h.gf += hs; h.ga += as_;
        a.gf += as_; a.ga += hs;
        if (hs > as_) { h.won++; h.points += 3; a.lost++; }
        else if (as_ > hs) { a.won++; a.points += 3; h.lost++; }
        else { h.draw++; a.draw++; h.points += 1; a.points += 1; }
      }
    }

    const standings = Object.entries(groupsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([grp, teams]) => ({
        stage: "GROUP_STAGE",
        type: "TOTAL",
        group: grp,
        table: Object.values(teams)
          .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
          .map((t, i) => ({
            position: i + 1,
            team: { id: 0, name: nationMap[t.code]?.name ?? t.code, shortName: nationMap[t.code]?.name ?? t.code, crest: null, tla: t.code },
            playedGames: t.played,
            won: t.won,
            draw: t.draw,
            lost: t.lost,
            points: t.points,
            goalsFor: t.gf,
            goalsAgainst: t.ga,
            goalDifference: t.gf - t.ga,
            form: null,
          })),
      }));

    res.json({ standings, competition: { id: 2000, name: "FIFA World Cup 2026" } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fixtures/:matchId", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.matchId, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid match ID" }); return; }

    const [m] = await db.select().from(matchesTable).where(eq(matchesTable.id, id));
    if (!m) { res.status(404).json({ error: "Match not found" }); return; }

    const nations = await db.select().from(nationsTable);
    const nationMap = Object.fromEntries(nations.map((n) => [n.code, n]));

    res.json({
      ...formatMatch(m, nationMap),
      head2head: { numberOfMatches: 0, totalGoals: 0, homeTeam: {}, awayTeam: {} },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
