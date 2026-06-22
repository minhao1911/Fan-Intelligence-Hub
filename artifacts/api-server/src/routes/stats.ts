import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable, matchesTable, discussionsTable, nationsTable } from "@workspace/db";
import { withCache, TTL } from "../lib/cache";

const router: IRouter = Router();

router.get("/stats/global", async (_req, res): Promise<void> => {
  const data = await withCache("stats:global", TTL.STATS, async () => {
    const [[fans], [matches], [live], [discussions], [votes], activeNations, topNation] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
        db.select({ count: sql<number>`count(*)::int` }).from(matchesTable),
        db.select({ count: sql<number>`count(*)::int` }).from(matchesTable).where(sql`${matchesTable.status} = 'live'`),
        db.select({ count: sql<number>`count(*)::int` }).from(discussionsTable),
        db.select({ total: sql<number>`sum(total_votes)::int` }).from(usersTable),
        db.select({ count: sql<number>`count(*)::int` }).from(nationsTable).where(sql`${nationsTable.memberCount} > 0`),
        db.select({ code: nationsTable.code }).from(nationsTable).orderBy(sql`${nationsTable.memberCount} DESC`).limit(1),
      ]);
    return {
      totalFans: fans.count,
      totalVotesCast: votes.total ?? 0,
      totalNationsActive: activeNations[0]?.count ?? 0,
      totalMatchesCovered: matches.count,
      totalDiscussions: discussions.count,
      mostActivatedNation: topNation[0]?.code ?? null,
      liveMatchCount: live.count,
    };
  });
  res.json(data);
});

export default router;
