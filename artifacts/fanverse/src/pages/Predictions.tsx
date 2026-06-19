import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/api";
import { Zap, Target, CheckCircle2, Clock, Lock } from "lucide-react";

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
  home: "border-primary/60 bg-primary/10 text-primary",
  draw: "border-blue-500/60 bg-blue-500/10 text-blue-400",
  away: "border-purple-500/60 bg-purple-500/10 text-purple-400",
};
const OUTCOME_BAR: Record<Outcome, string> = {
  home: "bg-primary/70",
  draw: "bg-blue-500/70",
  away: "bg-purple-500/70",
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
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{match.stage?.replace("Group ", "Group ") ?? "Group Stage"}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {dateStr} · {timeStr}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex flex-col items-center text-center gap-1">
              <span className="text-4xl leading-none">{match.homeNationFlag}</span>
              <span className="text-xs font-heading font-bold uppercase tracking-wide mt-1 leading-tight">{match.homeNationName}</span>
            </div>
            <div className="text-lg font-heading font-bold text-muted-foreground">VS</div>
            <div className="flex-1 flex flex-col items-center text-center gap-1">
              <span className="text-4xl leading-none">{match.awayNationFlag}</span>
              <span className="text-xs font-heading font-bold uppercase tracking-wide mt-1 leading-tight">{match.awayNationName}</span>
            </div>
          </div>
        </div>

        {/* Prediction area */}
        <div className="px-5 py-4 space-y-4">
          {loadingMine ? (
            <div className="h-16 bg-muted/40 rounded-lg animate-pulse" />
          ) : hasPredicted ? (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-heading font-bold uppercase tracking-wide text-sm ${displayOutcome ? OUTCOME_COLORS[displayOutcome] : ""}`}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Predicted: {displayOutcome ? OUTCOME_LABELS[displayOutcome] : ""}</span>
                {(existing?.predictedHomeScore != null && existing?.predictedAwayScore != null) && (
                  <span className="ml-auto font-mono text-xs opacity-70">{existing.predictedHomeScore}–{existing.predictedAwayScore}</span>
                )}
                {existing?.xpEarned ? (
                  <span className="ml-auto flex items-center gap-1 text-primary text-xs">
                    <Zap className="h-3 w-3" />+{existing.xpEarned} XP
                  </span>
                ) : null}
              </div>
              {summary && summary.total > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fan vote · {summary.total} predictions</p>
                  {(["home", "draw", "away"] as Outcome[]).map((o) => (
                    <div key={o} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-muted-foreground">{OUTCOME_LABELS[o]}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${OUTCOME_BAR[o]}`} style={{ width: `${summary[`${o}Pct` as keyof PredictionSummary]}%` }} />
                      </div>
                      <span className="w-8 text-right font-mono text-muted-foreground">{summary[`${o}Pct` as keyof PredictionSummary]}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3 w-3" /> Pick your prediction
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["home", "draw", "away"] as Outcome[]).map((o) => (
                  <button
                    key={o}
                    onClick={() => setSelected(o)}
                    className={`py-2 px-1 rounded-lg border text-xs font-heading font-bold uppercase tracking-wide transition-all ${
                      selected === o ? OUTCOME_COLORS[o] : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {o === "home" ? match.homeNationCode : o === "away" ? match.awayNationCode : "Draw"}
                  </button>
                ))}
              </div>

              {selected && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Score prediction (optional · +bonus XP)</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm">{match.homeNationFlag}</span>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        placeholder="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        className="w-full rounded-md border border-border bg-input text-foreground text-center text-sm py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <span className="text-muted-foreground font-bold">–</span>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        placeholder="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        className="w-full rounded-md border border-border bg-input text-foreground text-center text-sm py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-sm">{match.awayNationFlag}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" />
                  <span><span className="text-primary font-bold">+5 XP</span> to predict · <span className="text-primary font-bold">+15</span> correct · <span className="text-primary font-bold">+35</span> exact score</span>
                </div>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground font-heading uppercase tracking-wide text-xs shrink-0"
                  onClick={handleSubmit}
                  disabled={!selected || submit.isPending}
                >
                  {submit.isPending ? "Saving…" : "Lock In"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Predictions() {
  const { data: matches, isLoading } = useUpcomingMatches();

  const upcoming = matches?.filter((m) => m.status === "upcoming") ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          Predictions
        </h1>
        <p className="text-muted-foreground mt-1">Predict match outcomes, earn XP, and climb the leaderboard.</p>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-primary font-bold">+5 XP</span>
            <span className="text-muted-foreground">any prediction</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400 font-bold">+15 XP</span>
            <span className="text-muted-foreground">correct outcome</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border">
            <Target className="h-3 w-3 text-orange-400" />
            <span className="text-orange-400 font-bold">+35 XP</span>
            <span className="text-muted-foreground">exact score</span>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <div className="text-5xl mb-3">⏳</div>
          <p className="text-muted-foreground font-medium">No upcoming matches to predict.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((m) => <MatchPredictionCard key={m.id} match={m} />)}
        </div>
      )}

      {!isLoading && upcoming.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Predictions lock when the match kicks off.
        </div>
      )}
    </div>
  );
}
