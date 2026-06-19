import { useMemo } from "react";
import { Link } from "wouter";
import { useListMatches, useGetLeaderboard } from "@workspace/api-client-react";
import { Crown, Star, Shirt, Zap, ChevronRight, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FanPhoto } from "./FanPhotoComposer";

interface Props {
  fanPhotos: FanPhoto[];
}

const TIER_META: Record<string, { label: string; color: string }> = {
  legend:   { label: "Legend",   color: "text-yellow-400" },
  elite:    { label: "Elite",    color: "text-purple-400" },
  veteran:  { label: "Veteran",  color: "text-blue-400"   },
  fan:      { label: "Fan",      color: "text-emerald-400" },
  newcomer: { label: "Newcomer", color: "text-muted-foreground" },
};

function tier(pts: number): string {
  if (pts >= 5000) return "legend";
  if (pts >= 2000) return "elite";
  if (pts >= 800)  return "veteran";
  if (pts >= 200)  return "fan";
  return "newcomer";
}

export default function FanOfTheMatch({ fanPhotos }: Props) {
  const { data: completed } = useListMatches({ status: "completed", limit: 5 });
  const { data: upcoming }  = useListMatches({ status: "upcoming",  limit: 1 });
  const { data: leaderboard } = useGetLeaderboard({ limit: 20 });

  const jerseyByUser: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of fanPhotos) {
      if (p.tag === "jersey") map[p.username] = (map[p.username] ?? 0) + 1;
    }
    return map;
  }, [fanPhotos]);

  const topFan = useMemo(() => {
    if (!leaderboard?.length) return null;
    return [...leaderboard]
      .map((e) => ({
        ...e,
        score: e.user.reputationPoints + (jerseyByUser[e.user.username] ?? 0) * 500,
        jerseyCount: jerseyByUser[e.user.username] ?? 0,
      }))
      .sort((a, b) => b.score - a.score)[0];
  }, [leaderboard, jerseyByUser]);

  const spotlight = completed?.[0] ?? upcoming?.[0] ?? null;
  const isCompleted = !!completed?.[0];

  if (!topFan && !spotlight) return null;

  const t = topFan ? tier(topFan.user.reputationPoints) : "fan";
  const tierMeta = TIER_META[t] ?? TIER_META.fan;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-card">
      {/* Glow bg */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(250,204,21,0.08),transparent)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Fan of the Match</p>
              {spotlight && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isCompleted ? "✅ Final · " : "⏳ Next · "}
                  <span className="font-semibold">
                    {spotlight.homeNationFlag} {spotlight.homeNationName} vs {spotlight.awayNationName} {spotlight.awayNationFlag}
                  </span>
                </p>
              )}
            </div>
          </div>
          {isCompleted && spotlight && (
            <div className="text-center">
              <span className="text-xl font-heading font-black text-primary tabular-nums">
                {spotlight.homeScore ?? 0} – {spotlight.awayScore ?? 0}
              </span>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-bold">FT</p>
            </div>
          )}
        </div>

        {topFan ? (
          <>
            {/* Fan card */}
            <div className="flex items-center gap-4 bg-secondary/40 rounded-xl px-4 py-4 border border-border/60">
              <div className="relative shrink-0">
                <Avatar className="h-14 w-14 border-2 border-primary shadow-[0_0_16px_rgba(250,204,21,0.25)]">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-heading text-lg font-bold">
                    {topFan.user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Crown className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-bold text-foreground text-base truncate">
                    {topFan.user.username}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wide ${tierMeta.color}`}>
                    {tierMeta.label}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs font-bold text-primary">
                    <Zap className="h-3 w-3" />
                    {topFan.user.reputationPoints.toLocaleString()} XP
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    Rank #{topFan.rank}
                  </span>
                  {topFan.jerseyCount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
                      <Shirt className="h-3 w-3" />
                      {topFan.jerseyCount} jersey {topFan.jerseyCount === 1 ? "post" : "posts"}
                    </span>
                  )}
                </div>

                {/* Fan score bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-bold">Fan Score</span>
                    <span className="text-[9px] font-bold font-mono text-primary">{topFan.score.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-yellow-300 transition-all duration-700"
                      style={{ width: `${Math.min(100, (topFan.score / 10000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scoring formula */}
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 text-primary" /> XP × 1
              </span>
              <span className="text-border">+</span>
              <span className="flex items-center gap-1">
                <Shirt className="h-2.5 w-2.5 text-blue-400" /> Jersey Post × 500
              </span>
              <span className="text-border">=</span>
              <span className="flex items-center gap-1 font-bold text-primary">
                <Star className="h-2.5 w-2.5" /> Fan Score
              </span>
            </div>
          </>
        ) : (
          /* No leaderboard data yet */
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
            <Crown className="h-10 w-10 text-primary/30" />
            <p className="text-sm font-bold text-foreground">No spotlight yet</p>
            <p className="text-xs text-muted-foreground max-w-[220px]">
              Post a jersey photo or make predictions to earn Fan of the Match honours.
            </p>
            <div className="flex gap-2 mt-1">
              <Link href="/predictions">
                <button type="button" className="text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  Make Prediction
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* View leaderboard */}
        <Link href="/leaderboard" className="block mt-3">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            Full Leaderboard <ChevronRight className="h-3 w-3" />
          </div>
        </Link>
      </div>
    </div>
  );
}
