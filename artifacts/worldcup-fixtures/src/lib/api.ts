const API_BASE = "/api";

export async function fetchFixtures(params?: { matchday?: number; stage?: string }) {
  const qs = new URLSearchParams();
  if (params?.matchday) qs.set("matchday", String(params.matchday));
  if (params?.stage) qs.set("stage", params.stage);
  const url = `${API_BASE}/fixtures${qs.toString() ? "?" + qs.toString() : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch fixtures: ${res.status}`);
  return res.json() as Promise<FixturesResponse>;
}

export async function fetchStandings() {
  const res = await fetch(`${API_BASE}/fixtures/standings`);
  if (!res.ok) throw new Error(`Failed to fetch standings: ${res.status}`);
  return res.json() as Promise<StandingsResponse>;
}

export async function fetchFixtureDetail(matchId: number) {
  const res = await fetch(`${API_BASE}/fixtures/${matchId}`);
  if (!res.ok) throw new Error(`Failed to fetch match: ${res.status}`);
  return res.json() as Promise<MatchDetail>;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  crest: string | null;
  tla: string;
  flagEmoji: string | null;
}

export interface Score {
  home: number | null;
  away: number | null;
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
}

export interface Match {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  status: "upcoming" | "live" | "completed";
  rawStatus: string;
  utcDate: string;
  score: Score;
  stage: string;
  group: string | null;
  matchday: number | null;
  venue: string | null;
  referees: string[];
  minute: number | null;
}

export interface MatchDetail extends Match {
  head2head: any;
}

export interface FixturesResponse {
  matches: Match[];
  count: number;
  competition: { id: number; name: string; emblem: string | null };
}

export interface StandingEntry {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string | null;
}

export interface StandingGroup {
  stage: string;
  type: string;
  group: string | null;
  table: StandingEntry[];
}

export interface StandingsResponse {
  standings: StandingGroup[];
  competition: { id: number; name: string };
  season: { id: number; startDate: string; endDate: string };
}
