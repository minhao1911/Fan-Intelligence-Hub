import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable, matchesTable, discussionsTable, nationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/global", async (_req, res): Promise<void> => {
  const [fans] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [matches] = await db.select({ count: sql<number>`count(*)::int` }).from(matchesTable);
  const [live] = await db.select({ count: sql<number>`count(*)::int` }).from(matchesTable).where(sql`${matchesTable.status} = 'live'`);
  const [discussions] = await db.select({ count: sql<number>`count(*)::int` }).from(discussionsTable);

  const activeNations = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(nationsTable)
    .where(sql`${nationsTable.memberCount} > 0`);

  const topNation = await db
    .select({ code: nationsTable.code, count: nationsTable.memberCount })
    .from(nationsTable)
    .orderBy(nationsTable.memberCount)
    .limit(1);

  const [votes] = await db.select({ total: sql<number>`sum(total_votes)::int` }).from(usersTable);

  res.json({
    totalFans: fans.count,
    totalVotesCast: votes.total ?? 0,
    totalNationsActive: activeNations[0]?.count ?? 0,
    totalMatchesCovered: matches.count,
    totalDiscussions: discussions.count,
    mostActivatedNation: topNation[0]?.code ?? null,
    liveMatchCount: live.count,
  });
});

export default router;
