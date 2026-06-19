import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/api";
import { Zap, Target, CheckCircle2, Clock, Lock, TrendingUp } from "lucide-react";

type Outcome = "home" | "draw" | "away";

interface UpcomingMatch {
  id: number;
  homeNationCode: string;
  homeNationName: string;
  homeNationFlag: string;
  awayNationCode: string;
  awayNationName: string;
  awayNationFlag: string;
  stage: string;
  scheduledAt: string;
  status: string;
}

interface MyPrediction {
  matchId: number;
  predictedOutcome: Outcome;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  xpEarned: number;
}

interface PredictionSummary {
  matchId: number;
  total: number;
  homePct: number;
  drawPct: number;
  awayPct: number;
}

const OUTCOME_LABELS: Record<Outcome, string> = { home: "Home Win", draw: "Draw", away: "Away Win" };
const OUTCOME_COLORS: Record<Outcome, string> = {
  home: "border-primary/60 bg-primary/10 text-primary shadow-[0_0_16px_rgba(251,191,36,0.12)]",
  draw: "border-blue-500/60 bg-blue-500/10 text-blue-400",
  away: "border-purple-500/60 bg-purple-500/10 text-purple-400",
};
const OUTCOME_BAR: Record<Outcome, string> = {
  home: "bg-gradient-to-r from-primary/80 to-primary",
  draw: "bg-gradient-to-r from-blue-500/80 to-blue-500",
  away: "bg-gradient-to-r from-purple-500/80 to-purple-500",
};
const OUTCOME_BTN_ACTIVE: Record<Outcome, string> = {
  home: "border-primary/60 bg-primary/10 text-primary shadow-[0_0_12px_rgba(251,191,36,0.15)]",
  draw: "border-blue-500/60 bg-blue-500/10 text-blue-400",
  away: "border-purple-500/60 bg-purple-500/10 text-purple-400",
};

function useUpcomingMatches() {
  return useQuery<UpcomingMatch[]>({
    queryKey: ["predictions-upcoming-matches"],
    queryFn: async () => {
      const r = await fetch(`${getBaseUrl()}api/matches?status=upcoming&limit=48`);
      if (!r.ok) throw new Error("Failed to fetch matches");
      return r.json();
    },
  });
}

function useMyPrediction(matchId: number) {
  const { getToken } = useAuth();
  return useQuery<MyPrediction | null>({
    queryKey: ["my-prediction", matchId],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/matches/${matchId}/my-prediction`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 30_000,
  });
}

function usePredictionSummary(matchId: number) {
  return useQuery<PredictionSummary>({
    queryKey: ["prediction-summary", matchId],
    queryFn: async () => {
      const r = await fetch(`${getBaseUrl()}api/matches/${matchId}/predictions/summary`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 30_000,
  });
}

function useSubmitPrediction(matchId: number) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { predictedOutcome: Outcome; predictedHomeScore?: number; predictedAwayScore?: number }) => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/matches/${matchId}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-prediction", matchId] });
      qc.invalidateQueries({ queryKey: ["prediction-summary", matchId] });
    },
  });
}

function MatchPredictionCard({ match }: { match: UpcomingMatch }) {
  const { data: myPrediction, isLoading: loadingMine } = useMyPrediction(match.id);
  const { data: summary } = usePredictionSummary(match.id);
  const submit = useSubmitPrediction(match.id);

  const [selected, setSelected] = useState<Outcome | null>(null);
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const scheduledDate = new Date(match.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const existing = myPrediction ?? null;
  const hasPredicted = !!existing || submitted;

  const handleSubmit = () => {
    if (!selected) return;
    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    submit.mutate(
      {
        predictedOutcome: selected,
        predictedHomeScore: !isNaN(hs) ? hs : undefined,
        predictedAwayScore: !isNaN(as_) ? as_ : undefined,
      },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  const displayOutcome: Outcome | null = existing?.predictedOutcome ?? selected ?? null;

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      {/* Top glow bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />

      {/* Match header */}
      <div className="relative px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {match.stage ?? "Group Stage"}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {dateStr} · {timeStr}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div className="text-4xl leading-none filter drop-shadow-sm">{match.homeNationFlag}</div>
            <span className="text-[11px] font-heading font-bold uppercase tracking-wide text-foreground leading-tight">{match.homeNationName}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border/50">
              <span className="text-xs font-heading font-black text-muted-foreground tracking-widest">VS</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div className="text-4xl leading-none filter drop-shadow-sm">{match.awayNationFlag}</div>
            <span className="text-[11px] font-heading font-bold uppercase tracking-wide text-foreground leading-tight">{match.awayNationName}</span>
          </div>
        </div>
      </div>

      {/* Prediction area */}
      <div className="relative px-4 py-4 space-y-4">
        {loadingMine ? (
          <div className="h-16 bg-muted/40 rounded-xl animate-pulse" />
        ) : hasPredicted ? (
          <div className="space-y-3">
            {/* Your pick badge */}
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-heading font-bold uppercase tracking-wide text-sm ${displayOutcome ? OUTCOME_COLORS[displayOutcome] : ""}`}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-xs">{displayOutcome ? OUTCOME_LABELS[displayOutcome] : ""}</span>
              {(existing?.predictedHomeScore != null && existing?.predictedAwayScore != null) && (
                <span className="ml-auto font-mono text-[11px] opacity-70">
                  {existing.predictedHomeScore}–{existing.predictedAwayScore}
                </span>
              )}
              {existing?.xpEarned ? (
                <span className="ml-auto flex items-center gap-1 text-primary text-xs">
                  <Zap className="h-3 w-3" />+{existing.xpEarned} XP
                </span>
              ) : null}
            </div>

            {/* Community vote bars */}
            {summary && summary.total > 0 && (
              <div className="space-y-2 bg-muted/20 rounded-xl p-3 border border-border/40">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> {summary.total} fan predictions
                </p>
                {(["home", "draw", "away"] as Outcome[]).map((o) => (
                  <div key={o} className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-muted-foreground text-[10px] font-bold uppercase tracking-wide">{o === "home" ? match.homeNationCode : o === "away" ? match.awayNationCode : "Draw"}</span>
                    <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${OUTCOME_BAR[o]}`}
                        style={{ width: `${summary[`${o}Pct` as keyof PredictionSummary]}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-muted-foreground text-[10px] font-bold">
                      {summary[`${o}Pct` as keyof PredictionSummary]}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pick label */}
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
              <Target className="h-3 w-3 text-primary" /> Pick your prediction
            </p>

            {/* Outcome buttons */}
            <div className="grid grid-cols-3 gap-2">
              {(["home", "draw", "away"] as Outcome[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setSelected(o)}
                  className={`py-2.5 px-1 rounded-xl border text-[11px] font-heading font-bold uppercase tracking-wide transition-all duration-150 ${
                    selected === o ? OUTCOME_BTN_ACTIVE[o] : "border-border/60 text-muted-foreground hover:border-muted-foreground hover:text-foreground bg-muted/20"
                  }`}
                >
                  <div className="text-base mb-0.5">
                    {o === "home" ? match.homeNationFlag : o === "away" ? match.awayNationFlag : "🤝"}
                  </div>
                  {o === "home" ? match.homeNationCode : o === "away" ? match.awayNationCode : "Draw"}
                </button>
              ))}
            </div>

            {/* Score input (appears after selecting outcome) */}
            {selected && (
              <div className="space-y-2 bg-muted/20 rounded-xl p-3 border border-border/40 animate-in slide-in-from-top-1 duration-200">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Score prediction <span className="text-primary">(optional · +bonus XP)</span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-sm shrink-0">{match.homeNationFlag}</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      placeholder="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-input text-foreground text-center text-sm py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <span className="text-muted-foreground font-bold text-sm">–</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      placeholder="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-input text-foreground text-center text-sm py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-sm shrink-0">{match.awayNationFlag}</span>
                  </div>
                </div>
              </div>
            )}

            {/* XP info + submit */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary shrink-0" />
                <span><span className="text-primary font-bold">+5</span> · <span className="text-emerald-400 font-bold">+15</span> correct · <span className="text-orange-400 font-bold">+35</span> exact</span>
              </div>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground font-heading uppercase tracking-wide text-[11px] rounded-lg shrink-0 shadow-[0_0_14px_rgba(251,191,36,0.2)] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-shadow"
                onClick={handleSubmit}
                disabled={!selected || submit.isPending}
              >
                {submit.isPending ? "Saving…" : "Lock In 🔒"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Predictions() {
  const { data: matches, isLoading } = useUpcomingMatches();

  const upcoming = matches?.filter((m) => m.status === "upcoming") ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Hero Header ─────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-orange-500/5 pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-primary/6 blur-3xl pointer-events-none" />
        <div className="relative px-6 py-7">
          <div className="flex items-center gap-3 mb-1">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-heading font-bold uppercase text-foreground tracking-tight">Predictions</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Predict match outcomes, earn XP, and climb the leaderboard.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-primary font-bold">+5 XP</span>
              <span className="text-muted-foreground">any prediction</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">+15 XP</span>
              <span className="text-muted-foreground">correct outcome</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/8 border border-orange-500/20">
              <Target className="h-3 w-3 text-orange-400" />
              <span className="text-orange-400 font-bold">+35 XP</span>
              <span className="text-muted-foreground">exact score</span>
            </div>
            {upcoming.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border ml-auto">
                <span className="text-foreground font-bold">{upcoming.length}</span>
                <span className="text-muted-foreground">matches open</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Prediction Cards ─────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 bg-muted/40 rounded-2xl animate-pulse" />)}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border/50 rounded-2xl">
          <div className="text-5xl mb-3">⏳</div>
          <p className="text-muted-foreground font-medium">No upcoming matches to predict.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((m) => <MatchPredictionCard key={m.id} match={m} />)}
        </div>
      )}

      {!isLoading && upcoming.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pb-2">
          <Lock className="h-3 w-3" />
          Predictions lock when the match kicks off. Correct calls earn bonus XP.
        </div>
      )}
    </div>
  );
}
