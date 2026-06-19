import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { nationsTable, matchesTable } from "./schema";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const nations = [
  { code: "USA", name: "United States", flagEmoji: "🇺🇸", confederation: "CONCACAF" },
  { code: "MEX", name: "Mexico", flagEmoji: "🇲🇽", confederation: "CONCACAF" },
  { code: "CAN", name: "Canada", flagEmoji: "🇨🇦", confederation: "CONCACAF" },
  { code: "PAN", name: "Panama", flagEmoji: "🇵🇦", confederation: "CONCACAF" },
  { code: "HND", name: "Honduras", flagEmoji: "🇭🇳", confederation: "CONCACAF" },
  { code: "CRC", name: "Costa Rica", flagEmoji: "🇨🇷", confederation: "CONCACAF" },
  { code: "ARG", name: "Argentina", flagEmoji: "🇦🇷", confederation: "CONMEBOL" },
  { code: "BRA", name: "Brazil", flagEmoji: "🇧🇷", confederation: "CONMEBOL" },
  { code: "COL", name: "Colombia", flagEmoji: "🇨🇴", confederation: "CONMEBOL" },
  { code: "URU", name: "Uruguay", flagEmoji: "🇺🇾", confederation: "CONMEBOL" },
  { code: "ECU", name: "Ecuador", flagEmoji: "🇪🇨", confederation: "CONMEBOL" },
  { code: "VEN", name: "Venezuela", flagEmoji: "🇻🇪", confederation: "CONMEBOL" },
  { code: "FRA", name: "France", flagEmoji: "🇫🇷", confederation: "UEFA" },
  { code: "ENG", name: "England", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA" },
  { code: "GER", name: "Germany", flagEmoji: "🇩🇪", confederation: "UEFA" },
  { code: "ESP", name: "Spain", flagEmoji: "🇪🇸", confederation: "UEFA" },
  { code: "POR", name: "Portugal", flagEmoji: "🇵🇹", confederation: "UEFA" },
  { code: "NED", name: "Netherlands", flagEmoji: "🇳🇱", confederation: "UEFA" },
  { code: "ITA", name: "Italy", flagEmoji: "🇮🇹", confederation: "UEFA" },
  { code: "BEL", name: "Belgium", flagEmoji: "🇧🇪", confederation: "UEFA" },
  { code: "CRO", name: "Croatia", flagEmoji: "🇭🇷", confederation: "UEFA" },
  { code: "SRB", name: "Serbia", flagEmoji: "🇷🇸", confederation: "UEFA" },
  { code: "AUT", name: "Austria", flagEmoji: "🇦🇹", confederation: "UEFA" },
  { code: "SUI", name: "Switzerland", flagEmoji: "🇨🇭", confederation: "UEFA" },
  { code: "DEN", name: "Denmark", flagEmoji: "🇩🇰", confederation: "UEFA" },
  { code: "TUR", name: "Turkey", flagEmoji: "🇹🇷", confederation: "UEFA" },
  { code: "SCO", name: "Scotland", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA" },
  { code: "SVN", name: "Slovenia", flagEmoji: "🇸🇮", confederation: "UEFA" },
  { code: "MAR", name: "Morocco", flagEmoji: "🇲🇦", confederation: "CAF" },
  { code: "SEN", name: "Senegal", flagEmoji: "🇸🇳", confederation: "CAF" },
  { code: "NGA", name: "Nigeria", flagEmoji: "🇳🇬", confederation: "CAF" },
  { code: "EGY", name: "Egypt", flagEmoji: "🇪🇬", confederation: "CAF" },
  { code: "CMR", name: "Cameroon", flagEmoji: "🇨🇲", confederation: "CAF" },
  { code: "TUN", name: "Tunisia", flagEmoji: "🇹🇳", confederation: "CAF" },
  { code: "RSA", name: "South Africa", flagEmoji: "🇿🇦", confederation: "CAF" },
  { code: "GHA", name: "Ghana", flagEmoji: "🇬🇭", confederation: "CAF" },
  { code: "CIV", name: "Ivory Coast", flagEmoji: "🇨🇮", confederation: "CAF" },
  { code: "JPN", name: "Japan", flagEmoji: "🇯🇵", confederation: "AFC" },
  { code: "KOR", name: "South Korea", flagEmoji: "🇰🇷", confederation: "AFC" },
  { code: "AUS", name: "Australia", flagEmoji: "🇦🇺", confederation: "AFC" },
  { code: "IRN", name: "Iran", flagEmoji: "🇮🇷", confederation: "AFC" },
  { code: "KSA", name: "Saudi Arabia", flagEmoji: "🇸🇦", confederation: "AFC" },
  { code: "IRQ", name: "Iraq", flagEmoji: "🇮🇶", confederation: "AFC" },
  { code: "JOR", name: "Jordan", flagEmoji: "🇯🇴", confederation: "AFC" },
  { code: "UZB", name: "Uzbekistan", flagEmoji: "🇺🇿", confederation: "AFC" },
  { code: "NZL", name: "New Zealand", flagEmoji: "🇳🇿", confederation: "OFC" },
  { code: "JAM", name: "Jamaica", flagEmoji: "🇯🇲", confederation: "CONCACAF" },
  { code: "ALG", name: "Algeria", flagEmoji: "🇩🇿", confederation: "CAF" },
];

type GroupEntry = [string, string, string, string];

const groups: Record<string, GroupEntry> = {
  A: ["USA", "MEX", "MAR", "NZL"],
  B: ["CAN", "HND", "SEN", "ALG"],
  C: ["FRA", "KOR", "NGA", "CRC"],
  D: ["BRA", "VEN", "CMR", "IRQ"],
  E: ["ENG", "POR", "JPN", "RSA"],
  F: ["ESP", "NED", "AUS", "GHA"],
  G: ["GER", "ARG", "IRN", "JAM"],
  H: ["ITA", "CRO", "URU", "CIV"],
  I: ["BEL", "SUI", "ECU", "TUN"],
  J: ["TUR", "SRB", "COL", "KSA"],
  K: ["AUT", "DEN", "EGY", "UZB"],
  L: ["SCO", "SVN", "PAN", "JOR"],
};

function groupMatchDates(groupIndex: number): [Date, Date, Date, Date, Date, Date] {
  const base = new Date("2026-06-11T00:00:00Z");
  const slotHours = [14, 17, 20, 23];
  const groupDay = Math.floor(groupIndex / 3);
  const groupSlot = groupIndex % 3;

  function d(md1DayOffset: number, hour: number): Date {
    const dt = new Date(base);
    dt.setUTCDate(dt.getUTCDate() + md1DayOffset);
    dt.setUTCHours(hour, 0, 0, 0);
    return dt;
  }

  const md1Day = groupDay;
  const md2Day = groupDay + 5;
  const md3Day = groupDay + 11;
  const h0 = slotHours[groupSlot];
  const h1 = slotHours[groupSlot + 1] ?? slotHours[0];

  return [
    d(md1Day, h0),
    d(md1Day, h1),
    d(md2Day, h0),
    d(md2Day, h1),
    d(md3Day, h0),
    d(md3Day, h0),
  ];
}

async function seed() {
  console.log("Seeding nations...");
  await db
    .insert(nationsTable)
    .values(nations)
    .onConflictDoNothing();
  console.log(`  ✓ ${nations.length} nations inserted`);

  console.log("Seeding group stage matches...");
  const matchRows: {
    homeNationCode: string;
    awayNationCode: string;
    competition: string;
    stage: string;
    status: string;
    scheduledAt: Date;
  }[] = [];

  const groupEntries = Object.entries(groups);
  groupEntries.forEach(([groupLetter, [t1, t2, t3, t4]], idx) => {
    const [d1, d2, d3, d4, d5, d6] = groupMatchDates(idx);
    const stage = `Group ${groupLetter}`;
    matchRows.push(
      { homeNationCode: t1, awayNationCode: t2, competition: "FIFA World Cup 2026", stage, status: "upcoming", scheduledAt: d1 },
      { homeNationCode: t3, awayNationCode: t4, competition: "FIFA World Cup 2026", stage, status: "upcoming", scheduledAt: d2 },
      { homeNationCode: t1, awayNationCode: t3, competition: "FIFA World Cup 2026", stage, status: "upcoming", scheduledAt: d3 },
      { homeNationCode: t2, awayNationCode: t4, competition: "FIFA World Cup 2026", stage, status: "upcoming", scheduledAt: d4 },
      { homeNationCode: t1, awayNationCode: t4, competition: "FIFA World Cup 2026", stage, status: "upcoming", scheduledAt: d5 },
      { homeNationCode: t2, awayNationCode: t3, competition: "FIFA World Cup 2026", stage, status: "upcoming", scheduledAt: d6 },
    );
  });

  await db
    .insert(matchesTable)
    .values(matchRows)
    .onConflictDoNothing();
  console.log(`  ✓ ${matchRows.length} group stage matches inserted`);

  await pool.end();
  console.log("Done!");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
