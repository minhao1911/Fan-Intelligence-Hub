import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { getBaseUrl } from "@/lib/api";
import {
  Users, Share2, Check, TrendingUp, Trophy, Clock,
  Radio, Zap, ArrowLeft, Target,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MatchInfo {
  id: number;
  homeNationCode: string;
  homeNationName: string;
  homeNationFlag: string;
  awayNationCode: string;
  awayNationName: string;
  awayNationFlag: string;
  stage: string | null;
  scheduledAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}

interface Community {
  total: number;
  homeCount: number;
  drawCount: number;
  awayCount: number;
  homePct: number;
  drawPct: number;
  awayPct: number;
}

interface Scoreline {
  homeScore: number;
  awayScore: number;
  outcome: string;
  count: number;
  pct: number;
}

interface TrendBucket {
  label: string;
  homeCount: number;
  drawCount: number;
  awayCount: number;
  order: number;
}

interface TopPredictor {
  username: string;
  nationCode: string | null;
  reputationTier: string;
  predictedOutcome: string;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  isCorrect: boolean;
  isExact: boolean;
  xpEarned: number;
}

interface StatsResponse {
  match: MatchInfo;
  community: Community;
  topScorelines: Scoreline[];
  trend: TrendBucket[];
  topPredictors: TopPredictor[];
  scoredCount: number;
}

// ── Data fetching ─────────────────────────────────────────────────────────────
function useMatchStats(matchId: string) {
  return useQuery<StatsResponse>({
    queryKey: ["match-prediction-stats", matchId],
    queryFn: async () => {
      const r = await fetch(`${getBaseUrl()}api/matches/${matchId}/predictions/stats`);
      if (!r.ok) throw new Error("Failed to load stats");
      return r.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// ── Outcome config ────────────────────────────────────────────────────────────
const OUTCOME_CONFIG = {
  home: {
    bar: "bg-gradient-to-r from-primary/80 to-primary",
    bg: "bg-primary/10 border-primary/30",
    text: "text-primary",
    label: (m: MatchInfo) => m.homeNationCode,
  },
  draw: {
    bar: "bg-gradient-to-r from-blue-500/80 to-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-400",
    label: () => "Draw",
  },
  away: {
    bar: "bg-gradient-to-r from-purple-500/80 to-purple-500",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-400",
    label: (m: MatchInfo) => m.awayNationCode,
  },
};

// ── Share button ──────────────────────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className="border-border/60 text-muted-foreground hover:text-foreground gap-1.5"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}

// ── Community consensus bars ──────────────────────────────────────────────────
function ConsensusSection({ community, match }: { community: Community; match: MatchInfo }) {
  const outcomes: Array<{ key: "home" | "draw" | "away"; pct: number; count: number }> = [
    { key: "home", pct: community.homePct, count: community.homeCount },
    { key: "draw", pct: community.drawPct, count: community.drawCount },
    { key: "away", pct: community.awayPct, count: community.awayCount },
  ];
  const winner = outcomes.reduce((a, b) => a.pct >= b.pct ? a : b).key;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-heading font-black uppercase tracking-wide text-foreground">Community Consensus</h2>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> {community.total.toLocaleString()} prediction{community.total !== 1 ? "s" : ""}
        </span>
      </div>

      {community.total === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No predictions yet — be the first!</p>
      ) : (
        <div className="space-y-3">
          {outcomes.map(({ key, pct, count }) => {
            const cfg = OUTCOME_CONFIG[key];
            const isLeading = key === winner && pct > 0;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-heading font-black uppercase tracking-widest ${cfg.text}`}>
                      {cfg.label(match)}
                    </span>
                    {isLeading && (
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text}`}>
                        Favourite
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{count.toLocaleString()} fan{count !== 1 ? "s" : ""}</span>
                    <span className={`font-mono font-black text-sm tabular-nums ${cfg.text}`}>{pct}%</span>
                  </div>
                </div>
                <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${cfg.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Top scorelines grid ───────────────────────────────────────────────────────
function ScorelineSection({ scorelines, match, scoredCount }: {
  scorelines: Scoreline[];
  match: MatchInfo;
  scoredCount: number;
}) {
  if (scorelines.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-heading font-black uppercase tracking-wide text-foreground">
          Popular Scorelines
        </h2>
        <span className="ml-auto text-xs text-muted-foreground">{scoredCount} fans guessed a score</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {scorelines.map((s, i) => {
          const cfg = OUTCOME_CONFIG[s.outcome as keyof typeof OUTCOME_CONFIG];
          return (
            <div
              key={`${s.homeScore}-${s.awayScore}`}
              className={`relative rounded-xl border p-3 text-center transition-all ${cfg.bg} ${i === 0 ? "ring-1 " + cfg.text.replace("text-", "ring-") : ""}`}
            >
              {i === 0 && (
                <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest px-2 py-px rounded-full bg-card border ${cfg.text}`}>
                  #1
                </span>
              )}
              <p className={`font-mono font-black text-xl tabular-nums ${cfg.text}`}>
                {s.homeScore}–{s.awayScore}
              </p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                {s.count} fan{s.count !== 1 ? "s" : ""} · {s.pct}%
              </p>
              <p className="text-[8px] text-muted-foreground/60 mt-0.5">
                {match.homeNationCode} win
                {s.outcome === "draw" ? " (draw)" : s.outcome === "away" ? ` · ${match.awayNationCode}` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Prediction trend timeline ─────────────────────────────────────────────────
function TrendSection({ trend }: { trend: TrendBucket[] }) {
  if (trend.length < 2) return null;
  const maxTotal = Math.max(...trend.map((b) => b.homeCount + b.drawCount + b.awayCount), 1);

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-heading font-black uppercase tracking-wide text-foreground">
          Prediction Timeline
        </h2>
        <span className="ml-auto text-xs text-muted-foreground">How fan opinion shifted day by day</span>
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {trend.map((bucket, i) => {
          const total = bucket.homeCount + bucket.drawCount + bucket.awayCount;
          const heightPct = (total / maxTotal) * 100;
          const homePct = total > 0 ? (bucket.homeCount / total) * 100 : 0;
          const drawPct = total > 0 ? (bucket.drawCount / total) * 100 : 0;
          const awayPct = total > 0 ? (bucket.awayCount / total) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-700"
                style={{ height: `${heightPct}%` }}
                title={`${total} predictions on ${bucket.label}`}
              >
                <div className="bg-primary/80" style={{ height: `${homePct}%` }} />
                <div className="bg-blue-500/80" style={{ height: `${drawPct}%` }} />
                <div className="bg-purple-500/80" style={{ height: `${awayPct}%` }} />
              </div>
              <span className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-wide truncate w-full text-center">
                {bucket.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/80" />Home</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/80" />Draw</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-500/80" />Away</span>
      </div>
    </div>
  );
}

// ── Top predictors ────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  legend: "text-yellow-400", elite: "text-purple-400",
  veteran: "text-blue-400", fan: "text-emerald-400", newcomer: "text-muted-foreground",
};

function TopPredictorsSection({ predictors, isCompleted }: { predictors: TopPredictor[]; isCompleted: boolean }) {
  if (predictors.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-heading font-black uppercase tracking-wide text-foreground">
          {isCompleted ? "Top Predictors" : "Early Birds"}
        </h2>
        {isCompleted && (
          <span className="ml-auto text-[10px] text-muted-foreground">Fans who got it right</span>
        )}
      </div>
      <div className="space-y-2">
        {predictors.map((p, i) => {
          const outcomeCfg = OUTCOME_CONFIG[p.predictedOutcome as keyof typeof OUTCOME_CONFIG];
          const tierColor = TIER_COLORS[p.reputationTier] ?? TIER_COLORS.fan;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                p.isExact
                  ? "border-primary/30 bg-primary/8"
                  : p.isCorrect
                  ? "border-emerald-500/20 bg-emerald-950/10"
                  : "border-border/40 bg-muted/10"
              }`}
            >
              <div className="w-5 text-center text-[10px] text-muted-foreground font-mono font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${tierColor}`}>{p.username}</p>
                {p.nationCode && (
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{p.nationCode}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${outcomeCfg.bg} ${outcomeCfg.text}`}>
                  {p.predictedOutcome}
                </span>
                {p.predictedHomeScore != null && p.predictedAwayScore != null && (
                  <span className={`font-mono text-xs font-bold ${p.isExact ? "text-primary" : "text-muted-foreground"}`}>
                    {p.predictedHomeScore}–{p.predictedAwayScore}
                  </span>
                )}
                {isCompleted && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary">
                    <Zap className="h-2.5 w-2.5" />{p.xpEarned}
                  </span>
                )}
                {p.isExact && (
                  <span className="text-[8px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full">
                    Exact!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MatchPredictionStats() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId ?? "";
  const { data, isLoading, error } = useMatchStats(matchId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-full max-w-lg px-4 animate-pulse">
          <div className="h-40 bg-muted/40 rounded-2xl" />
          <div className="h-48 bg-muted/40 rounded-2xl" />
          <div className="h-32 bg-muted/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
        <div>
          <p className="text-muted-foreground mb-4">Match not found or stats unavailable.</p>
          <Link href="/predictions">
            <Button variant="outline" size="sm">← Back to Predictions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { match, community, topScorelines, trend, topPredictors, scoredCount } = data;
  const scheduledDate = new Date(match.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const isCompleted = match.status === "completed";
  const isLive = match.status === "live";

  const actualOutcome = isCompleted && match.homeScore != null && match.awayScore != null
    ? match.homeScore > match.awayScore ? "home"
    : match.homeScore < match.awayScore ? "away"
    : "draw"
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Back link */}
        <Link href="/predictions">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Predictions Hub
          </button>
        </Link>

        {/* Match card header */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
          <div className="p-5 space-y-4">
            {/* Stage + status */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                {match.stage ?? "Group Stage"}
              </span>
              <div className="flex items-center gap-2">
                {isLive && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    <Radio className="h-3 w-3 text-red-400" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">Live</span>
                  </div>
                )}
                {isCompleted && (
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    Full Time
                  </span>
                )}
                {!isLive && !isCompleted && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />{dateStr} · {timeStr}
                  </span>
                )}
                <ShareButton />
              </div>
            </div>

            {/* Teams */}
            <div className="flex items-center gap-4">
              <div className="flex-1 flex flex-col items-center text-center gap-2">
                <span className="text-5xl filter drop-shadow-sm">{match.homeNationFlag}</span>
                <span className="text-sm font-heading font-black uppercase tracking-wide">{match.homeNationName}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{match.homeNationCode}</span>
              </div>

              <div className="flex flex-col items-center gap-2 px-4">
                {isCompleted && match.homeScore != null ? (
                  <div className="text-center">
                    <p className="font-mono font-black text-3xl text-foreground tracking-tight">
                      {match.homeScore}<span className="text-muted-foreground/60 mx-1">–</span>{match.awayScore}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                      actualOutcome === "home" ? "text-primary"
                      : actualOutcome === "away" ? "text-purple-400"
                      : "text-blue-400"
                    }`}>
                      {actualOutcome === "home" ? match.homeNationCode
                       : actualOutcome === "away" ? match.awayNationCode
                       : "Draw"}
                    </p>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-muted/60 border border-border/50">
                    <span className="text-sm font-heading font-black text-muted-foreground tracking-widest">VS</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center text-center gap-2">
                <span className="text-5xl filter drop-shadow-sm">{match.awayNationFlag}</span>
                <span className="text-sm font-heading font-black uppercase tracking-wide">{match.awayNationName}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{match.awayNationCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Community consensus */}
        <ConsensusSection community={community} match={match} />

        {/* Scorelines */}
        <ScorelineSection scorelines={topScorelines} match={match} scoredCount={scoredCount} />

        {/* Trend */}
        <TrendSection trend={trend} />

        {/* Top predictors / early birds */}
        <TopPredictorsSection predictors={topPredictors} isCompleted={isCompleted} />

        {/* CTA for upcoming matches */}
        {!isCompleted && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-foreground">Make your prediction</p>
              <p className="text-xs text-muted-foreground">Earn +5 XP now, +10 XP if correct, +30 XP for exact score</p>
            </div>
            <Link href="/predictions">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading uppercase tracking-wide shrink-0">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Predict
              </Button>
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground pb-2">
          FanVerse · World Cup 2026 Fan Intelligence · Stats refresh every 30s
        </p>
      </div>
    </div>
  );
}
