import { Router, type IRouter } from "express";

const router: IRouter = Router();

const FOOTBALL_API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";

async function footballFetch(path: string) {
  const res = await fetch(`${FOOTBALL_API_BASE}${path}`, {
    headers: { "X-Auth-Token": API_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org error ${res.status}: ${text}`);
  }
  return res.json();
}

function mapStatus(status: string): "upcoming" | "live" | "completed" {
  if (["SCHEDULED", "TIMED", "POSTPONED"].includes(status)) return "upcoming";
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(status)) return "live";
  return "completed";
}

router.get("/fixtures", async (req, res): Promise<void> => {
  if (!API_KEY) {
    res.status(503).json({ error: "FOOTBALL_DATA_API_KEY not configured" });
    return;
  }

  try {
    const matchday = req.query.matchday ? `&matchday=${req.query.matchday}` : "";
    const stage = req.query.stage ? `&stage=${req.query.stage}` : "";
    const data: any = await footballFetch(`/competitions/WC/matches?season=2026${matchday}${stage}`);

    const matches = (data.matches ?? []).map((m: any) => ({
      id: m.id,
      homeTeam: {
        id: m.homeTeam?.id,
        name: m.homeTeam?.name ?? "TBD",
        shortName: m.homeTeam?.shortName ?? m.homeTeam?.name ?? "TBD",
        crest: m.homeTeam?.crest ?? null,
        tla: m.homeTeam?.tla ?? "???",
      },
      awayTeam: {
        id: m.awayTeam?.id,
        name: m.awayTeam?.name ?? "TBD",
        shortName: m.awayTeam?.shortName ?? m.awayTeam?.name ?? "TBD",
        crest: m.awayTeam?.crest ?? null,
        tla: m.awayTeam?.tla ?? "???",
      },
      status: mapStatus(m.status),
      rawStatus: m.status,
      utcDate: m.utcDate,
      score: {
        home: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
        away: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
        winner: m.score?.winner ?? null,
      },
      stage: m.stage,
      group: m.group ?? null,
      matchday: m.matchday ?? null,
      venue: m.venue ?? null,
      referees: (m.referees ?? []).map((r: any) => r.name),
      minute: m.minute ?? null,
    }));

    res.json({ matches, count: matches.length, competition: data.competition });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fixtures/standings", async (req, res): Promise<void> => {
  if (!API_KEY) {
    res.status(503).json({ error: "FOOTBALL_DATA_API_KEY not configured" });
    return;
  }
  try {
    const data: any = await footballFetch(`/competitions/WC/standings?season=2026`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fixtures/teams", async (req, res): Promise<void> => {
  if (!API_KEY) {
    res.status(503).json({ error: "FOOTBALL_DATA_API_KEY not configured" });
    return;
  }
  try {
    const data: any = await footballFetch(`/competitions/WC/teams?season=2026`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fixtures/:matchId", async (req, res): Promise<void> => {
  if (!API_KEY) {
    res.status(503).json({ error: "FOOTBALL_DATA_API_KEY not configured" });
    return;
  }
  try {
    const data: any = await footballFetch(`/matches/${req.params.matchId}`);
    const m = data;
    res.json({
      id: m.id,
      homeTeam: {
        id: m.homeTeam?.id,
        name: m.homeTeam?.name ?? "TBD",
        shortName: m.homeTeam?.shortName ?? m.homeTeam?.name ?? "TBD",
        crest: m.homeTeam?.crest ?? null,
        tla: m.homeTeam?.tla ?? "???",
      },
      awayTeam: {
        id: m.awayTeam?.id,
        name: m.awayTeam?.name ?? "TBD",
        shortName: m.awayTeam?.shortName ?? m.awayTeam?.name ?? "TBD",
        crest: m.awayTeam?.crest ?? null,
        tla: m.awayTeam?.tla ?? "???",
      },
      status: mapStatus(m.status),
      rawStatus: m.status,
      utcDate: m.utcDate,
      score: {
        home: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
        away: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
        winner: m.score?.winner ?? null,
      },
      stage: m.stage,
      group: m.group ?? null,
      matchday: m.matchday ?? null,
      venue: m.venue ?? null,
      referees: (m.referees ?? []).map((r: any) => r.name),
      minute: m.minute ?? null,
      head2head: data.head2head ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
