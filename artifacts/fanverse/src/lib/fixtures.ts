const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

export interface FixtureTeam {
  id: number;
  name: string;
  shortName: string;
  crest: string | null;
  tla: string;
}

export interface FixtureScore {
  home: number | null;
  away: number | null;
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
}

export interface Fixture {
  id: number;
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
  status: "upcoming" | "live" | "completed";
  rawStatus: string;
  utcDate: string;
  score: FixtureScore;
  stage: string;
  group: string | null;
  matchday: number | null;
  venue: string | null;
  referees: string[];
  minute: number | null;
}

export interface FixtureDetail extends Fixture {
  head2head: any;
}

export interface FixturesResponse {
  matches: Fixture[];
  count: number;
  competition: { id: number; name: string; emblem: string | null };
}

export interface StandingEntry {
  position: number;
  team: FixtureTeam;
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
}

export async function getFixtures(params?: { stage?: string }): Promise<FixturesResponse> {
  const qs = new URLSearchParams();
  if (params?.stage) qs.set("stage", params.stage);
  const res = await fetch(`${API}/fixtures${qs.toString() ? "?" + qs.toString() : ""}`);
  if (!res.ok) throw new Error(`Fixtures API error: ${res.status}`);
  return res.json();
}

export async function getFixtureDetail(id: number): Promise<FixtureDetail> {
  const res = await fetch(`${API}/fixtures/${id}`);
  if (!res.ok) throw new Error(`Fixture detail error: ${res.status}`);
  return res.json();
}

export async function getFixtureStandings(): Promise<StandingsResponse> {
  const res = await fetch(`${API}/fixtures/standings`);
  if (!res.ok) throw new Error(`Standings API error: ${res.status}`);
  return res.json();
}

export function stageName(s: string): string {
  const map: Record<string, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarter Finals",
    SEMI_FINALS: "Semi Finals",
    THIRD_PLACE: "3rd Place",
    FINAL: "Final",
  };
  return map[s] ?? s.replace(/_/g, " ");
}

export function formatKickoff(utcDate: string, long = false): string {
  const d = new Date(utcDate);
  if (long) {
    return d.toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });
  }
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
