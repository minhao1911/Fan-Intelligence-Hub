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

router.get("/stats/prediction-leaderboard", async (_req, res): Promise<void> => {
  const data = await withCache("stats:prediction-leaderboard", TTL.LEADERBOARD, async () => {
    const result = await db.execute(sql`
      WITH resolved AS (
        SELECT
          mp.user_id,
          mp.predicted_outcome,
          mp.predicted_home_score,
          mp.predicted_away_score,
          m.home_score,
          m.away_score,
          CASE
            WHEN m.home_score > m.away_score THEN 'home'
            WHEN m.home_score < m.away_score THEN 'away'
            ELSE 'draw'
          END AS actual_outcome
        FROM match_predictions mp
        JOIN matches m ON m.id = mp.match_id
        WHERE m.status = 'completed'
          AND m.home_score IS NOT NULL
          AND m.away_score IS NOT NULL
      ),
      user_stats AS (
        SELECT
          r.user_id,
          COUNT(*)::int                                                        AS total_predictions,
          COUNT(*) FILTER (WHERE r.predicted_outcome = r.actual_outcome)::int  AS correct_outcomes,
          COUNT(*) FILTER (
            WHERE r.predicted_home_score IS NOT NULL
              AND r.predicted_away_score IS NOT NULL
              AND r.predicted_home_score = r.home_score
              AND r.predicted_away_score = r.away_score
          )::int                                                               AS exact_scores
        FROM resolved r
        GROUP BY r.user_id
        HAVING COUNT(*) >= 1
      )
      SELECT
        us.user_id                                                             AS id,
        u.username,
        u.avatar_url,
        u.nation_code,
        u.reputation_points,
        n.flag_emoji,
        us.total_predictions,
        us.correct_outcomes,
        us.exact_scores
      FROM user_stats us
      JOIN users u ON u.id = us.user_id
      LEFT JOIN nations n ON n.code = u.nation_code
      ORDER BY us.exact_scores DESC, us.correct_outcomes DESC, us.total_predictions DESC
      LIMIT 50
    `);

    return (result.rows as Array<Record<string, unknown>>).map((row, idx) => {
      const total = Number(row.total_predictions) || 0;
      const correct = Number(row.correct_outcomes) || 0;
      const exact = Number(row.exact_scores) || 0;
      return {
        rank: idx + 1,
        user: {
          id: Number(row.id),
          username: String(row.username),
          avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
          nationCode: row.nation_code ? String(row.nation_code) : null,
          nationFlag: row.flag_emoji ? String(row.flag_emoji) : null,
          reputationPoints: Number(row.reputation_points) || 0,
        },
        totalPredictions: total,
        correctOutcomes: correct,
        exactScores: exact,
        outcomeAccuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        exactAccuracy: total > 0 ? Math.round((exact / total) * 100) : 0,
      };
    });
  });

  res.json(data);
});

export default router;
