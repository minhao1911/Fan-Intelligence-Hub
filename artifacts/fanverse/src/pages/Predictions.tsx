import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/api";
import {
  Zap, Target, CheckCircle2, Clock, Lock, TrendingUp,
  XCircle, Trophy, History, LayoutGrid, AlertCircle,
} from "lucide-react";

type Outcome = "home" | "draw" | "away";
type Tab = "predict" | "history";

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
  isResolved?: number;
}

interface PredictionSummary {
  matchId: number;
  total: number;
  homePct: number;
  drawPct: number;
  awayPct: number;
}

interface PredictionHistoryEntry {
  matchId: number;
  predictedOutcome: Outcome;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  isResolved: number; // 0=pending, 1=correct, 2=wrong
  xpEarned: number;
  createdAt: string;
  match: {
    homeNationCode: string;
    homeNationName: string;
    homeNationFlag: string;
    awayNationCode: string;
    awayNationName: string;
    awayNationFlag: string;
    stage: string | null;
    status: string;
    scheduledAt: string;
    homeScore: number | null;
    awayScore: number | null;
  };
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
      qc.invalidateQueries({ queryKey: ["my-predictions-history"] });
    },
  });
}

function usePredictionHistory() {
  const { getToken } = useAuth();
  return useQuery<PredictionHistoryEntry[]>({
    queryKey: ["my-predictions-history"],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/me/predictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 30_000,
  });
}

// ── Prediction card (upcoming match) ─────────────────────────────────────────
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
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
              <Target className="h-3 w-3 text-primary" /> Pick your prediction
            </p>
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
            {selected && (
              <div className="space-y-2 bg-muted/20 rounded-xl p-3 border border-border/40 animate-in slide-in-from-top-1 duration-200">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Score prediction <span className="text-primary">(optional · +bonus XP)</span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-sm shrink-0">{match.homeNationFlag}</span>
                    <input
                      type="number" min={0} max={20} placeholder="0"
                      value={homeScore} onChange={(e) => setHomeScore(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-input text-foreground text-center text-sm py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <span className="text-muted-foreground font-bold text-sm">–</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="number" min={0} max={20} placeholder="0"
                      value={awayScore} onChange={(e) => setAwayScore(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-input text-foreground text-center text-sm py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-sm shrink-0">{match.awayNationFlag}</span>
                  </div>
                </div>
              </div>
            )}
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

// ── History row ───────────────────────────────────────────────────────────────
function PredictionHistoryRow({ entry }: { entry: PredictionHistoryEntry }) {
  const { match } = entry;
  const isPending = entry.isResolved === 0 || match.status === "upcoming" || match.status === "live";
  const isCorrect = entry.isResolved === 1;
  const isWrong = entry.isResolved === 2;

  const actualOutcome: Outcome | null =
    match.homeScore != null && match.awayScore != null
      ? match.homeScore > match.awayScore ? "home"
      : match.homeScore < match.awayScore ? "away"
      : "draw"
      : null;

  const scoreExact =
    entry.predictedHomeScore === match.homeScore &&
    entry.predictedAwayScore === match.awayScore &&
    match.homeScore != null;

  return (
    <div className={`relative rounded-xl border overflow-hidden transition-all duration-200 ${
      isPending ? "border-border/50 bg-card"
      : isCorrect ? "border-emerald-500/25 bg-emerald-500/5"
      : "border-red-500/20 bg-red-500/4"
    }`}>
      {/* Slim top accent */}
      <div className={`h-0.5 w-full ${
        isPending ? "bg-muted/40"
        : isCorrect ? "bg-gradient-to-r from-emerald-500/70 to-emerald-500/20"
        : "bg-gradient-to-r from-red-500/50 to-red-500/10"
      }`} />

      <div className="px-4 py-3.5 flex items-center gap-4">
        {/* Status icon */}
        <div className="shrink-0">
          {isPending ? (
            <div className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : isCorrect ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          )}
        </div>

        {/* Match info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg leading-none">{match.homeNationFlag}</span>
            <span className="font-heading font-bold text-sm text-foreground truncate">{match.homeNationCode}</span>
            {match.homeScore != null ? (
              <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                isCorrect ? "text-emerald-400 bg-emerald-500/10" : isWrong ? "text-red-400 bg-red-500/8" : "text-muted-foreground bg-muted/40"
              }`}>{match.homeScore}–{match.awayScore}</span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">vs</span>
            )}
            <span className="font-heading font-bold text-sm text-foreground truncate">{match.awayNationCode}</span>
            <span className="text-lg leading-none">{match.awayNationFlag}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{match.stage ?? "Group Stage"}</span>
            <span className="text-muted-foreground/40 text-[10px]">·</span>
            {/* My pick */}
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${OUTCOME_COLORS[entry.predictedOutcome]}`}>
              My pick: {OUTCOME_LABELS[entry.predictedOutcome]}
            </span>
            {entry.predictedHomeScore != null && (
              <span className="text-[10px] text-muted-foreground font-mono">
                ({entry.predictedHomeScore}–{entry.predictedAwayScore})
              </span>
            )}
            {!isPending && actualOutcome && (
              <>
                <span className="text-muted-foreground/40 text-[10px]">·</span>
                <span className="text-[10px] text-muted-foreground">
                  Result: <span className="font-bold">{OUTCOME_LABELS[actualOutcome]}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* XP badge */}
        <div className="shrink-0 text-right">
          {isPending ? (
            <div className="text-[10px] text-muted-foreground font-bold px-2 py-1 bg-muted/40 rounded-lg border border-border">
              Pending
            </div>
          ) : (
            <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border ${
              isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-muted/40 border-border"
            }`}>
              <div className={`flex items-center gap-1 text-xs font-bold ${isCorrect ? "text-emerald-400" : "text-muted-foreground"}`}>
                <Zap className="h-3 w-3" />
                {isCorrect ? `+${entry.xpEarned} XP` : "0 XP"}
              </div>
              {scoreExact && (
                <div className="text-[9px] font-bold text-orange-400 uppercase tracking-wide">Exact!</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stats strip for history tab ───────────────────────────────────────────────
function HistoryStats({ entries }: { entries: PredictionHistoryEntry[] }) {
  const resolved = entries.filter((e) => e.isResolved !== 0);
  const correct = resolved.filter((e) => e.isResolved === 1).length;
  const exact = entries.filter(
    (e) => e.isResolved === 1 && e.predictedHomeScore === e.match.homeScore && e.predictedAwayScore === e.match.awayScore && e.match.homeScore != null
  ).length;
  const totalXp = entries.reduce((s, e) => s + (e.xpEarned ?? 0), 0);
  const accuracy = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {[
        { label: "Predictions", value: entries.length, icon: Target, color: "text-foreground" },
        { label: "Correct Outcomes", value: correct, icon: CheckCircle2, color: "text-emerald-400" },
        { label: "Exact Scores", value: exact, icon: Trophy, color: "text-orange-400" },
        { label: "Total XP Earned", value: totalXp > 0 ? `+${totalXp}` : totalXp, icon: Zap, color: "text-primary" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
          <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
          <div className={`text-xl font-heading font-bold ${color}`}>{value}</div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5">{label}</div>
          {label === "Correct Outcomes" && accuracy !== null && (
            <div className="text-[10px] text-muted-foreground mt-0.5">{accuracy}% accuracy</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Predictions() {
  const [tab, setTab] = useState<Tab>("predict");
  const { data: matches, isLoading } = useUpcomingMatches();
  const { data: history, isLoading: historyLoading } = usePredictionHistory();

  const upcoming = matches?.filter((m) => m.status === "upcoming") ?? [];
  const historyEntries = history ?? [];

  const pendingCount = historyEntries.filter((e) => e.isResolved === 0 || e.match.status === "upcoming").length;
  const correctCount = historyEntries.filter((e) => e.isResolved === 1).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Hero Header ───────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-orange-500/5 pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-primary/6 blur-3xl pointer-events-none" />
        <div className="relative px-6 py-7">
          <div className="flex items-center gap-3 mb-1">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-heading font-bold uppercase text-foreground tracking-tight">Predictions</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Lock in your scorelines, earn XP when you're right, and climb the leaderboard.
          </p>
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

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-muted/40 border border-border rounded-xl w-fit">
        <button
          onClick={() => setTab("predict")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-bold uppercase tracking-wide transition-all ${
            tab === "predict"
              ? "bg-card border border-border text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Upcoming
          {upcoming.length > 0 && (
            <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-bold uppercase tracking-wide transition-all ${
            tab === "history"
              ? "bg-card border border-border text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          My History
          {historyEntries.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${
              correctCount > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
            }`}>
              {historyEntries.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Upcoming Predictions ─────────────────────────── */}
      {tab === "predict" && (
        <>
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
        </>
      )}

      {/* ── Tab: My History ───────────────────────────────────── */}
      {tab === "history" && (
        <>
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />)}
            </div>
          ) : historyEntries.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border/50 rounded-2xl">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-foreground font-bold mb-1">No predictions yet</p>
              <p className="text-muted-foreground text-sm">Head to the Upcoming tab and lock in your first pick.</p>
              <button
                onClick={() => setTab("predict")}
                className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors"
              >
                Make a Prediction
              </button>
            </div>
          ) : (
            <>
              <HistoryStats entries={historyEntries} />

              {/* Pending notice */}
              {pendingCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-bold">{pendingCount}</span> prediction{pendingCount !== 1 ? "s" : ""} pending — XP will be awarded automatically when the match result is confirmed.
                  </span>
                </div>
              )}

              <div className="space-y-2.5">
                {historyEntries.map((entry) => (
                  <PredictionHistoryRow key={`${entry.matchId}-${entry.createdAt}`} entry={entry} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
