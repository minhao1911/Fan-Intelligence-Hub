import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  nationsTable,
  usersTable,
  discussionsTable,
  commentsTable,
  pollsTable,
  pollOptionsTable,
  pollVotesTable,
  matchesTable,
} from "./schema";
import { eq, and } from "drizzle-orm";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─── Synthetic users ────────────────────────────────────────────────
const SYNTHETIC_USERS = [
  { clerkId: "seed_usr_001", username: "TacticsTitan", nationCode: "ENG", reputationPoints: 820, totalVotes: 48, totalReactions: 22, totalDiscussions: 14 },
  { clerkId: "seed_usr_002", username: "GoalMachineGabi", nationCode: "BRA", reputationPoints: 650, totalVotes: 35, totalReactions: 18, totalDiscussions: 9 },
  { clerkId: "seed_usr_003", username: "UltrasMarcelo", nationCode: "ARG", reputationPoints: 1240, totalVotes: 72, totalReactions: 41, totalDiscussions: 21 },
  { clerkId: "seed_usr_004", username: "CurvaNord", nationCode: "ITA", reputationPoints: 540, totalVotes: 29, totalReactions: 14, totalDiscussions: 7 },
  { clerkId: "seed_usr_005", username: "TifoseriaStar", nationCode: "FRA", reputationPoints: 390, totalVotes: 21, totalReactions: 9, totalDiscussions: 5 },
  { clerkId: "seed_usr_006", username: "FuryFromManila", nationCode: "ESP", reputationPoints: 710, totalVotes: 40, totalReactions: 25, totalDiscussions: 11 },
  { clerkId: "seed_usr_007", username: "SambaKing99", nationCode: "BRA", reputationPoints: 930, totalVotes: 55, totalReactions: 33, totalDiscussions: 17 },
  { clerkId: "seed_usr_008", username: "DasBootFan", nationCode: "GER", reputationPoints: 460, totalVotes: 24, totalReactions: 11, totalDiscussions: 6 },
  { clerkId: "seed_usr_009", username: "AtlasLion", nationCode: "MAR", reputationPoints: 680, totalVotes: 38, totalReactions: 20, totalDiscussions: 10 },
  { clerkId: "seed_usr_010", username: "StarAndCrescent", nationCode: "TUR", reputationPoints: 310, totalVotes: 16, totalReactions: 7, totalDiscussions: 4 },
  { clerkId: "seed_usr_011", username: "OranjeLion", nationCode: "NED", reputationPoints: 570, totalVotes: 31, totalReactions: 15, totalDiscussions: 8 },
  { clerkId: "seed_usr_012", username: "RedEagles07", nationCode: "SRB", reputationPoints: 250, totalVotes: 13, totalReactions: 5, totalDiscussions: 3 },
  { clerkId: "seed_usr_013", username: "SambaDrummer", nationCode: "BRA", reputationPoints: 495, totalVotes: 27, totalReactions: 12, totalDiscussions: 6 },
  { clerkId: "seed_usr_014", username: "TerraceCaptain", nationCode: "ENG", reputationPoints: 880, totalVotes: 51, totalReactions: 28, totalDiscussions: 15 },
  { clerkId: "seed_usr_015", username: "GauchoElite", nationCode: "URU", reputationPoints: 345, totalVotes: 18, totalReactions: 8, totalDiscussions: 4 },
];

// ─── Nation member counts + confidence scores ───────────────────────
const NATION_STATS: Record<string, { memberCount: number; confidenceScore: number }> = {
  BRA: { memberCount: 4821, confidenceScore: 78 },
  ARG: { memberCount: 4293, confidenceScore: 82 },
  ENG: { memberCount: 3967, confidenceScore: 71 },
  FRA: { memberCount: 3541, confidenceScore: 74 },
  GER: { memberCount: 3102, confidenceScore: 67 },
  ESP: { memberCount: 3289, confidenceScore: 76 },
  POR: { memberCount: 2874, confidenceScore: 73 },
  NED: { memberCount: 2156, confidenceScore: 65 },
  ITA: { memberCount: 2478, confidenceScore: 62 },
  BEL: { memberCount: 1923, confidenceScore: 59 },
  MAR: { memberCount: 2311, confidenceScore: 70 },
  USA: { memberCount: 3654, confidenceScore: 61 },
  MEX: { memberCount: 2789, confidenceScore: 63 },
  JPN: { memberCount: 1876, confidenceScore: 66 },
  KOR: { memberCount: 1654, confidenceScore: 60 },
  SEN: { memberCount: 1432, confidenceScore: 64 },
  NGA: { memberCount: 1789, confidenceScore: 58 },
  CRO: { memberCount: 987,  confidenceScore: 57 },
  COL: { memberCount: 1245, confidenceScore: 62 },
  URU: { memberCount: 876,  confidenceScore: 55 },
  TUR: { memberCount: 1123, confidenceScore: 53 },
  SRB: { memberCount: 743,  confidenceScore: 50 },
  AUT: { memberCount: 654,  confidenceScore: 48 },
  SUI: { memberCount: 712,  confidenceScore: 52 },
  DEN: { memberCount: 891,  confidenceScore: 56 },
  CAN: { memberCount: 1532, confidenceScore: 58 },
};

// ─── Discussion templates ─────────────────────────────────────────────
function buildDiscussions(userIds: number[]) {
  const u = userIds;
  return [
    { userId: u[2], nationCode: "ARG", matchId: null, title: "Argentina's midfield is the deepest in this tournament", content: "Nobody is talking about how stacked our midfield options are. De Paul, Mac Allister, Enzo — we literally have three world-class central mids and can rotate without drop-off. If Scaloni gets the combinations right, we cruise to the final.", category: "tactics", upvotes: 47 },
    { userId: u[6], nationCode: "BRA", matchId: null, title: "Vini Jr MUST start every game. No debate.", content: "I don't want to hear about rotating him. The man is the most dangerous winger on the planet right now. You sit him and you're basically gift-wrapping a goal for the opponent. Full stop.", category: "general", upvotes: 61 },
    { userId: u[0], nationCode: "ENG", matchId: null, title: "England's tournament curse — can we finally break it?", content: "I've watched England bottle it at penalties since I was eight. But something feels different this squad. We're not scared anymore, we've got leaders who've won things at club level. Is this finally the year?", category: "general", upvotes: 89 },
    { userId: u[5], nationCode: "ESP", matchId: null, title: "La Roja tiki-taka is BACK and I'm obsessed", content: "The youth Barcelona players coming through, Pedri orchestrating everything — it feels like 2010 all over again but younger and faster. Watch Spain go all the way and silence everyone who wrote us off.", category: "tactics", upvotes: 34 },
    { userId: u[8], nationCode: "MAR", matchId: null, title: "Morocco can reach the final again — here's why", content: "People wrote us off in 2022 too and we made the semis. Our defensive organisation is still elite, Hakimi is the best attacking fullback in the world, and we play at our best under pressure. Don't sleep on the Atlas Lions.", category: "general", upvotes: 52 },
    { userId: u[1], nationCode: "BRA", matchId: null, title: "Who plays the false 9 role for Brazil?", content: "With Endrick and Rodrygo both available, Dorival has an interesting puzzle. Do you play someone as a nine or go with a free-roaming front three? I say go with Rodrygo as a false 9 and let Vini + Savinho wreak havoc.", category: "tactics", upvotes: 28 },
    { userId: u[13], nationCode: "ENG", matchId: null, title: "Southgate out — do we trust the new manager?", content: "New manager, new era. But is the squad really that different? We need someone who trusts the youngsters and doesn't set up to not lose. Hoping the new setup actually lets Bellingham play his natural game.", category: "general", upvotes: 73 },
    { userId: u[7], nationCode: "GER", matchId: null, title: "Germany's new generation has arrived — believe it", content: "Florian Wirtz alone is worth the ticket price. Add Musiala and you have two of the most creative players in Europe playing together in their prime World Cup years. The rebuild is complete. Wir sind dabei!", category: "general", upvotes: 41 },
    { userId: u[10], nationCode: "NED", matchId: null, title: "Van Dijk needs the World Cup on his CV", content: "One of the best defenders of his generation and still no World Cup medal. This squad might be the best shot — Gakpo, Dumfries, Xavi Simons coming good. Come on Oranje, let's do this.", category: "general", upvotes: 29 },
    { userId: u[4], nationCode: "FRA", matchId: null, title: "Mbappé as captain changes everything for France", content: "He's not just the star now, he's the leader. That extra responsibility has matured him massively. When Mbappé is captain and motivated, France are the favourites. Simple as that.", category: "general", upvotes: 55 },
    { userId: u[2], nationCode: null, matchId: null, title: "Best World Cup group stage ever? Group G is insane", content: "Germany vs Argentina in the group stage. Think about that. Two World Cup winners, two of the richest fanbases, both with legitimate title aspirations. This is the match of the tournament even before the knockouts.", category: "general", upvotes: 112 },
    { userId: u[0], nationCode: "ENG", matchId: null, title: "Prediction thread: who finishes top of Group E?", content: "England, Portugal, Japan, South Africa. On paper England top, Portugal second. But Japan always punch above their weight and Portugal can be inconsistent. What does everyone think?", category: "predictions", upvotes: 38 },
    { userId: u[3], nationCode: "ITA", matchId: null, title: "Italy's Azzurri — renaissance or false dawn?", content: "We missed 2022 and it was genuinely painful. The rebuild has been promising but we still haven't solved our striker problem. Retegui is decent but is he a World Cup winner? I'm cautiously optimistic but scarred.", category: "general", upvotes: 44 },
    { userId: u[9], nationCode: "TUR", matchId: null, title: "Turkey in Group J is the upset waiting to happen", content: "Colombia and Serbia are quality but Turkey have been on a tear. Güler is special, the team is well-organised and hungry. A lot of people are sleeping on us. Group J exit is not guaranteed for anyone.", category: "predictions", upvotes: 19 },
    { userId: u[14], nationCode: "URU", matchId: null, title: "Uruguay's spirit runs deeper than any other nation", content: "We are 3.5 million people and we've won the World Cup twice. That alone tells you everything about our football culture. Darwin Núñez + Valverde in the same team? Don't laugh us off.", category: "general", upvotes: 33 },
  ];
}

// ─── Poll templates (for first 6 upcoming matches) ──────────────────
function buildPolls(matches: { id: number; homeNationCode: string; awayNationCode: string }[]) {
  return matches.slice(0, 6).map((m) => ({
    matchId: m.id,
    question: `Who wins: ${m.homeNationCode} vs ${m.awayNationCode}?`,
    pollType: "confidence",
    closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    options: [
      { value: "home", label: `${m.homeNationCode} Win`, voteCount: Math.floor(Math.random() * 80) + 20 },
      { value: "draw", label: "Draw", voteCount: Math.floor(Math.random() * 40) + 10 },
      { value: "away", label: `${m.awayNationCode} Win`, voteCount: Math.floor(Math.random() * 70) + 15 },
    ],
  }));
}

async function seedSampleData() {
  // 1. Update nation stats
  console.log("Updating nation member counts & confidence scores...");
  let nationCount = 0;
  for (const [code, stats] of Object.entries(NATION_STATS)) {
    await db
      .update(nationsTable)
      .set({ memberCount: stats.memberCount, confidenceScore: stats.confidenceScore })
      .where(eq(nationsTable.code, code));
    nationCount++;
  }
  console.log(`  ✓ Updated ${nationCount} nations`);

  // 2. Seed synthetic users
  console.log("Seeding synthetic users...");
  const insertedUsers = await db
    .insert(usersTable)
    .values(SYNTHETIC_USERS)
    .onConflictDoNothing()
    .returning({ id: usersTable.id, clerkId: usersTable.clerkId });

  // Fetch all seeded users to get their IDs
  const allSeedUsers = await db
    .select({ id: usersTable.id, clerkId: usersTable.clerkId })
    .from(usersTable)
    .then((rows) => rows.filter((r) => r.clerkId.startsWith("seed_usr_")));

  const userIds = allSeedUsers.map((u) => u.id);
  console.log(`  ✓ ${allSeedUsers.length} synthetic users ready`);

  // 3. Seed discussions
  console.log("Seeding sample discussions...");
  const discussions = buildDiscussions(userIds);
  const insertedDiscussions = await db
    .insert(discussionsTable)
    .values(discussions.map((d) => ({
      userId: d.userId,
      nationCode: d.nationCode,
      matchId: d.matchId,
      title: d.title,
      content: d.content,
      category: d.category,
      upvotes: d.upvotes,
    })))
    .onConflictDoNothing()
    .returning({ id: discussionsTable.id });
  console.log(`  ✓ ${insertedDiscussions.length} discussions seeded`);

  // 4. Seed a few comments on the first 4 discussions
  console.log("Seeding sample comments...");
  const commentData = [
    { discussionId: insertedDiscussions[0]?.id, userId: userIds[1], content: "Completely agree. Mac Allister alone would start for any other nation. The depth is genuinely frightening." },
    { discussionId: insertedDiscussions[0]?.id, userId: userIds[6], content: "Don't forget Paredes either. Even as a squad player he's elite. Argentina's options are ridiculous." },
    { discussionId: insertedDiscussions[1]?.id, userId: userIds[12], content: "Preach! Managers who bench Vini should be investigated for crimes against football." },
    { discussionId: insertedDiscussions[2]?.id, userId: userIds[13], content: "Born in '98. I have never seen England win a tournament. This HAS to be the year. It has to be." },
    { discussionId: insertedDiscussions[2]?.id, userId: userIds[4], content: "As a France fan I'm quietly hoping you bottle it again 😅 but honestly this England squad is scary." },
    { discussionId: insertedDiscussions[4]?.id, userId: userIds[0], content: "Hakimi vs any fullback in this tournament is basically unfair. The man is ridiculous going forward." },
    { discussionId: insertedDiscussions[10]?.id, userId: userIds[3], content: "Italy got robbed in qualifying again in an alternate timeline. Group G would've been even wilder." },
    { discussionId: insertedDiscussions[10]?.id, userId: userIds[7], content: "As a Germany fan — yeah we know. This game is going to be absolute carnage and I cannot wait." },
  ].filter((c) => c.discussionId !== undefined);

  if (commentData.length > 0) {
    await db.insert(commentsTable).values(commentData as any).onConflictDoNothing();
  }
  console.log(`  ✓ ${commentData.length} comments seeded`);

  // 5. Seed polls for upcoming matches
  console.log("Seeding match polls...");
  const upcomingMatches = await db
    .select({ id: matchesTable.id, homeNationCode: matchesTable.homeNationCode, awayNationCode: matchesTable.awayNationCode })
    .from(matchesTable)
    .then((rows) => rows.slice(0, 6));

  const pollTemplates = buildPolls(upcomingMatches);
  let pollCount = 0;
  let optionCount = 0;
  for (const pt of pollTemplates) {
    const [poll] = await db
      .insert(pollsTable)
      .values({ matchId: pt.matchId, question: pt.question, pollType: pt.pollType, closesAt: pt.closesAt })
      .returning({ id: pollsTable.id });
    pollCount++;

    for (const opt of pt.options) {
      await db.insert(pollOptionsTable).values({ pollId: poll.id, value: opt.value, label: opt.label, voteCount: opt.voteCount });
      optionCount++;
    }
  }
  console.log(`  ✓ ${pollCount} polls + ${optionCount} options seeded`);

  await pool.end();
  console.log("\n🎉 Sample data seeding complete!");
}

seedSampleData().catch((err) => {
  console.error(err);
  process.exit(1);
});
