export const nations = [
  // CONCACAF
  { code: "MEX", name: "Mexico", flagEmoji: "🇲🇽", confederation: "CONCACAF" },
  { code: "CAN", name: "Canada", flagEmoji: "🇨🇦", confederation: "CONCACAF" },
  { code: "USA", name: "United States", flagEmoji: "🇺🇸", confederation: "CONCACAF" },
  { code: "PAN", name: "Panama", flagEmoji: "🇵🇦", confederation: "CONCACAF" },
  { code: "CUW", name: "Curaçao", flagEmoji: "🇨🇼", confederation: "CONCACAF" },
  { code: "HTI", name: "Haiti", flagEmoji: "🇭🇹", confederation: "CONCACAF" },
  // CONMEBOL
  { code: "ARG", name: "Argentina", flagEmoji: "🇦🇷", confederation: "CONMEBOL" },
  { code: "BRA", name: "Brazil", flagEmoji: "🇧🇷", confederation: "CONMEBOL" },
  { code: "COL", name: "Colombia", flagEmoji: "🇨🇴", confederation: "CONMEBOL" },
  { code: "URU", name: "Uruguay", flagEmoji: "🇺🇾", confederation: "CONMEBOL" },
  { code: "ECU", name: "Ecuador", flagEmoji: "🇪🇨", confederation: "CONMEBOL" },
  { code: "PAR", name: "Paraguay", flagEmoji: "🇵🇾", confederation: "CONMEBOL" },
  // UEFA
  { code: "FRA", name: "France", flagEmoji: "🇫🇷", confederation: "UEFA" },
  { code: "ENG", name: "England", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA" },
  { code: "GER", name: "Germany", flagEmoji: "🇩🇪", confederation: "UEFA" },
  { code: "ESP", name: "Spain", flagEmoji: "🇪🇸", confederation: "UEFA" },
  { code: "POR", name: "Portugal", flagEmoji: "🇵🇹", confederation: "UEFA" },
  { code: "NED", name: "Netherlands", flagEmoji: "🇳🇱", confederation: "UEFA" },
  { code: "BEL", name: "Belgium", flagEmoji: "🇧🇪", confederation: "UEFA" },
  { code: "CRO", name: "Croatia", flagEmoji: "🇭🇷", confederation: "UEFA" },
  { code: "AUT", name: "Austria", flagEmoji: "🇦🇹", confederation: "UEFA" },
  { code: "SUI", name: "Switzerland", flagEmoji: "🇨🇭", confederation: "UEFA" },
  { code: "NOR", name: "Norway", flagEmoji: "🇳🇴", confederation: "UEFA" },
  { code: "SWE", name: "Sweden", flagEmoji: "🇸🇪", confederation: "UEFA" },
  { code: "SCO", name: "Scotland", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA" },
  { code: "TUR", name: "Türkiye", flagEmoji: "🇹🇷", confederation: "UEFA" },
  { code: "CZE", name: "Czech Republic", flagEmoji: "🇨🇿", confederation: "UEFA" },
  { code: "BIH", name: "Bosnia & Herzegovina", flagEmoji: "🇧🇦", confederation: "UEFA" },
  // CAF
  { code: "MAR", name: "Morocco", flagEmoji: "🇲🇦", confederation: "CAF" },
  { code: "SEN", name: "Senegal", flagEmoji: "🇸🇳", confederation: "CAF" },
  { code: "EGY", name: "Egypt", flagEmoji: "🇪🇬", confederation: "CAF" },
  { code: "TUN", name: "Tunisia", flagEmoji: "🇹🇳", confederation: "CAF" },
  { code: "RSA", name: "South Africa", flagEmoji: "🇿🇦", confederation: "CAF" },
  { code: "GHA", name: "Ghana", flagEmoji: "🇬🇭", confederation: "CAF" },
  { code: "CIV", name: "Côte d'Ivoire", flagEmoji: "🇨🇮", confederation: "CAF" },
  { code: "CPV", name: "Cabo Verde", flagEmoji: "🇨🇻", confederation: "CAF" },
  { code: "ALG", name: "Algeria", flagEmoji: "🇩🇿", confederation: "CAF" },
  { code: "COD", name: "DR Congo", flagEmoji: "🇨🇩", confederation: "CAF" },
  // AFC
  { code: "JPN", name: "Japan", flagEmoji: "🇯🇵", confederation: "AFC" },
  { code: "KOR", name: "South Korea", flagEmoji: "🇰🇷", confederation: "AFC" },
  { code: "AUS", name: "Australia", flagEmoji: "🇦🇺", confederation: "AFC" },
  { code: "IRN", name: "IR Iran", flagEmoji: "🇮🇷", confederation: "AFC" },
  { code: "KSA", name: "Saudi Arabia", flagEmoji: "🇸🇦", confederation: "AFC" },
  { code: "IRQ", name: "Iraq", flagEmoji: "🇮🇶", confederation: "AFC" },
  { code: "JOR", name: "Jordan", flagEmoji: "🇯🇴", confederation: "AFC" },
  { code: "UZB", name: "Uzbekistan", flagEmoji: "🇺🇿", confederation: "AFC" },
  { code: "QAT", name: "Qatar", flagEmoji: "🇶🇦", confederation: "AFC" },
  // OFC
  { code: "NZL", name: "New Zealand", flagEmoji: "🇳🇿", confederation: "OFC" },
];

type GroupEntry = [string, string, string, string];

// Real FIFA World Cup 2026 groups (draw: December 5, 2025, Kennedy Center, Washington D.C.)
export const groups: Record<string, GroupEntry> = {
  A: ["MEX", "KOR", "RSA", "CZE"],
  B: ["CAN", "SUI", "QAT", "BIH"],
  C: ["BRA", "MAR", "SCO", "HTI"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "TUN", "SWE"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "NOR", "IRQ"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COL", "UZB", "COD"],
  L: ["ENG", "CRO", "GHA", "PAN"],
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
  const md3Day = groupDay + 15; // MD3 pushed to June 26-29 to stay future
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

export function generateMatchRows() {
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

  return matchRows;
}
