/**
 * iSports API sync service
 *
 * Pulls football schedules from api.isportsapi.com and upserts real
 * international (FIFA/World Cup) matches into FanVerse's matches table.
 * Uses external_id to deduplicate on re-sync.
 *
 * iSports status codes:
 *   0  = not started → upcoming
 *   1  = in-play     → live
 *  -1  = finished    → completed
 *  -10 = cancelled   → skip
 */

import { eq } from "drizzle-orm";
import { db, matchesTable, nationsTable } from "@workspace/db";
import { logger } from "./logger";

const API_KEY = process.env.ISPORTS_API_KEY;
const BASE_URL = "http://api.isportsapi.com/sport/football";

// Rate-limit guard — iSports allows ~1 req/5s on free tier
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── iSports types ────────────────────────────────────────────────────────────

interface ISportsMatch {
  matchId: string;
  leagueName: string;
  leagueShortName: string;
  leagueType: number;       // 1=domestic club, 2=international
  matchTime: number;        // unix seconds
  status: number;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  round?: string;
  group?: string;
}

interface ISportsResponse {
  code: number;
  message: string;
  data: ISportsMatch[];
}

// ─── Name aliases — iSports team name → FanVerse nation code ─────────────────
// Covers common variations iSports uses for the 48 World Cup nations.

const NAME_ALIASES: Record<string, string> = {
  // CONCACAF
  "mexico": "MEX",
  "canada": "CAN",
  "united states": "USA",
  "usa": "USA",
  "panama": "PAN",
  "haiti": "HTI",
  "jamaica": "JAM",
  "honduras": "HON",
  // CONMEBOL
  "argentina": "ARG",
  "brazil": "BRA",
  "uruguay": "URU",
  "colombia": "COL",
  "ecuador": "ECU",
  "paraguay": "PAR",
  "venezuela": "VEN",
  "bolivia": "BOL",
  "chile": "CHI",
  "peru": "PER",
  // UEFA
  "england": "ENG",
  "france": "FRA",
  "germany": "GER",
  "spain": "ESP",
  "portugal": "POR",
  "netherlands": "NED",
  "belgium": "BEL",
  "croatia": "CRO",
  "switzerland": "SUI",
  "austria": "AUT",
  "scotland": "SCO",
  "norway": "NOR",
  "sweden": "SWE",
  "denmark": "DEN",
  "poland": "POL",
  "ukraine": "UKR",
  "serbia": "SRB",
  "romania": "ROU",
  "turkey": "TUR",
  "türkiye": "TUR",
  "czechia": "CZE",
  "czech republic": "CZE",
  "slovakia": "SVK",
  "hungary": "HUN",
  "slovenia": "SVN",
  "albania": "ALB",
  "georgia": "GEO",
  "bosnia": "BIH",
  "bosnia & herzegovina": "BIH",
  // CAF
  "morocco": "MAR",
  "senegal": "SEN",
  "egypt": "EGY",
  "nigeria": "NGA",
  "ghana": "GHA",
  "cameroon": "CMR",
  "algeria": "ALG",
  "south africa": "RSA",
  "tunisia": "TUN",
  "côte d'ivoire": "CIV",
  "cote d'ivoire": "CIV",
  "ivory coast": "CIV",
  "dr congo": "COD",
  "democratic republic of congo": "COD",
  "cabo verde": "CPV",
  "cape verde": "CPV",
  // AFC
  "japan": "JPN",
  "south korea": "KOR",
  "korea republic": "KOR",
  "australia": "AUS",
  "iran": "IRN",
  "ir iran": "IRN",
  "saudi arabia": "KSA",
  "qatar": "QAT",
  "uzbekistan": "UZB",
  "jordan": "JOR",
  "iraq": "IRQ",
  "china": "CHN",
  "china pr": "CHN",
  // OFC
  "new zealand": "NZL",
  // Misc aliases
  "curaçao": "CUW",
  "curacao": "CUW",
};

// ─── Nation map (DB names + aliases) ─────────────────────────────────────────

let _nationMap: Map<string, string> | null = null;

async function getNationMap(): Promise<Map<string, string>> {
  if (_nationMap) return _nationMap;
  const nations = await db.select({ code: nationsTable.code, name: nationsTable.name }).from(nationsTable);
  const map = new Map<string, string>(
    Object.entries(NAME_ALIASES).map(([k, v]) => [k.toLowerCase(), v])
  );
  for (const n of nations) {
    map.set(n.name.toLowerCase(), n.code);
    map.set(n.code.toLowerCase(), n.code);
  }
  _nationMap = map;
  return map;
}

function resolveNationCode(teamName: string, map: Map<string, string>): string | null {
  const key = teamName.toLowerCase().trim();
  if (map.has(key)) return map.get(key)!;
  // Prefix match (e.g. "Korea Republic" → "south korea")
  for (const [name, code] of map) {
    if (key === name || key.startsWith(name) || name.startsWith(key)) return code;
  }
  return null;
}

function toStatus(s: number): "upcoming" | "live" | "completed" | null {
  if (s === 1)  return "live";
  if (s === -1) return "completed";
  if (s === 0)  return "upcoming";
  return null; // cancelled / postponed — skip
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function fetchSchedule(date: string): Promise<ISportsMatch[]> {
  if (!API_KEY) throw new Error("ISPORTS_API_KEY not set");
  const url = `${BASE_URL}/schedule?api_key=${API_KEY}&date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iSports HTTP ${res.status}`);
  const json = (await res.json()) as ISportsResponse;
  if (json.code !== 0) throw new Error(`iSports error: ${json.message}`);
  return json.data;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  date: string;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  mapped: string[];
}

export async function syncDate(date: string): Promise<SyncResult> {
  const raw = await fetchSchedule(date);
  const nationMap = await getNationMap();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const mapped: string[] = [];

  for (const m of raw) {
    const status = toStatus(m.status);
    if (!status) { skipped++; continue; }

    // Only process international matches (leagueType 2) or FIFA/World Cup
    const isInternational =
      m.leagueType === 2 ||
      m.leagueName.toLowerCase().includes("world cup") ||
      m.leagueName.toLowerCase().includes("nations league") ||
      m.leagueName.toLowerCase().includes("copa america") ||
      m.leagueName.toLowerCase().includes("euro") ||
      m.leagueName.toLowerCase().includes("afcon") ||
      m.leagueName.toLowerCase().includes("asian cup");

    if (!isInternational) { skipped++; continue; }

    const homeCode = resolveNationCode(m.homeName, nationMap);
    const awayCode = resolveNationCode(m.awayName, nationMap);

    if (!homeCode || !awayCode) {
      logger.debug({ home: m.homeName, away: m.awayName }, "[isports] Could not map teams to nations — skipping");
      skipped++;
      continue;
    }

    const scheduledAt = new Date(m.matchTime * 1000);
    const stage = [m.round, m.group].filter(Boolean).join(" – ") || null;
    const externalId = `isports:${m.matchId}`;

    const existing = await db
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.externalId, externalId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(matchesTable)
        .set({
          status,
          homeScore: m.homeScore ?? null,
          awayScore: m.awayScore ?? null,
        })
        .where(eq(matchesTable.externalId, externalId));
      updated++;
    } else {
      await db.insert(matchesTable).values({
        externalId,
        homeNationCode: homeCode,
        awayNationCode: awayCode,
        competition: m.leagueName,
        stage,
        status,
        scheduledAt,
        homeScore: status === "completed" ? (m.homeScore ?? null) : null,
        awayScore: status === "completed" ? (m.awayScore ?? null) : null,
      });
      inserted++;
      mapped.push(`${m.homeName} vs ${m.awayName} [${m.leagueName}]`);
    }
  }

  logger.info({ date, fetched: raw.length, inserted, updated, skipped }, "[isports] Sync complete");
  return { date, fetched: raw.length, inserted, updated, skipped, mapped };
}

export async function syncDays(days = 3): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    try {
      results.push(await syncDate(dateStr));
    } catch (err) {
      logger.error({ err, date: dateStr }, "[isports] Sync failed for date");
    }
    // Respect iSports free-tier rate limit (~1 req / 30s)
    if (i < days - 1) await sleep(35000);
  }
  return results;
}
