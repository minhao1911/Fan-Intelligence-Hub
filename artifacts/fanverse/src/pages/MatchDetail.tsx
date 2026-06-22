import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetMatch,
  useListMatchPolls,
  useGetReactionSummary,
  getGetMatchQueryKey,
  getListMatchPollsQueryKey,
  getGetReactionSummaryQueryKey,
  useCastPollVote,
  useSubmitReaction,
  ReactionInputReactionType,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/api";
import {
  ArrowLeft, Clock, MessageSquare, Activity, Shield, CheckCircle2,
  Target, TrendingUp, Zap, BarChart2, ChevronRight,
} from "lucide-react";

type Outcome = "home" | "draw" | "away";

const OUTCOME_LABELS: Record<Outcome, string> = { home: "Home Win", draw: "Draw", away: "Away Win" };
const OUTCOME_COLORS: Record<Outcome, string> = {
  home: "border-primary/60 bg-primary/10 text-primary",
  draw: "border-blue-500/60 bg-blue-500/10 text-blue-400",
  away: "border-purple-500/60 bg-purple-500/10 text-purple-400",
};
const OUTCOME_BAR: Record<Outcome, string> = {
  home: "bg-gradient-to-r from-primary/80 to-primary",
  draw: "bg-gradient-to-r from-blue-500/80 to-blue-500",
  away: "bg-gradient-to-r from-purple-500/80 to-purple-500",
};
const OUTCOME_BTN_IDLE = "border-border hover:border-primary/40 hover:bg-muted/40";

const REACTIONS = [
  { type: "ecstatic", emoji: "🤩", label: "Ecstatic" },
  { type: "satisfied", emoji: "😊", label: "Satisfied" },
  { type: "neutral", emoji: "😐", label: "Neutral" },
  { type: "disappointed", emoji: "😞", label: "Disappointed" },
  { type: "devastated", emoji: "😢", label: "Devastated" },
];

const SENTIMENT_EMOJI: Record<string, string> = {
  ecstatic: "🤩", satisfied: "😊", neutral: "😐", disappointed: "😞", devastated: "😢",
};

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
    staleTime: 20_000,
    refetchInterval: 30_000,
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

function ScorePredictionCard({
  matchId,
  homeNationCode,
  awayNationCode,
  homeNationName,
  awayNationName,
  matchStatus,
}: {
  matchId: number;
  homeNationCode: string;
  awayNationCode: string;
  homeNationName: string;
  awayNationName: string;
  matchStatus: string;
}) {
  const { isSignedIn } = useAuth();
  const { data: myPrediction, isLoading: loadingMine } = useMyPrediction(matchId);
  const { data: summary } = usePredictionSummary(matchId);
  const submit = useSubmitPrediction(matchId);

  const [selected, setSelected] = useState<Outcome | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const hasPredicted = !!myPrediction || submitted;
  const displayOutcome: Outcome | null = myPrediction?.predictedOutcome ?? selected ?? null;
  const canSubmit = !!(selected) && !submit.isPending;

  const handleSubmit = () => {
    if (!selected) return;
    const hs = parseInt(homeScore, 10);
    const as_ = parseInt(awayScore, 10);
    submit.mutate(
      {
        predictedOutcome: selected,
        predictedHomeScore: !isNaN(hs) && hs >= 0 ? hs : undefined,
        predictedAwayScore: !isNaN(as_) && as_ >= 0 ? as_ : undefined,
      },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
        <CardTitle className="font-heading text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Score Prediction
        </CardTitle>
        <div className="text-xs text-muted-foreground uppercase tracking-widest">
          {summary?.total ?? 0} fan prediction{(summary?.total ?? 0) !== 1 ? "s" : ""} · +5 pts
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {!isSignedIn ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">Sign in to submit your score prediction</p>
            <Button size="sm" variant="outline" className="font-heading uppercase tracking-widest text-xs" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        ) : loadingMine ? (
          <div className="h-24 bg-muted/40 rounded-xl animate-pulse" />
        ) : hasPredicted ? (
          <div className="space-y-2">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-heading font-bold uppercase tracking-wide text-xs ${displayOutcome ? OUTCOME_COLORS[displayOutcome] : ""}`}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{displayOutcome ? OUTCOME_LABELS[displayOutcome] : ""}</span>
              {myPrediction?.predictedHomeScore != null && myPrediction?.predictedAwayScore != null && (
                <span className="ml-auto font-mono text-[11px] opacity-70">
                  {myPrediction.predictedHomeScore}–{myPrediction.predictedAwayScore}
                </span>
              )}
              {myPrediction?.xpEarned ? (
                <span className="ml-auto flex items-center gap-1 text-primary text-xs">
                  <Zap className="h-3 w-3" />+{myPrediction.xpEarned} XP
                </span>
              ) : null}
            </div>
          </div>
        ) : matchStatus !== "upcoming" ? (
          <p className="text-xs text-muted-foreground text-center py-3">Predictions closed — match has started</p>
        ) : (
          <div className="space-y-4">
            {/* Outcome picker */}
            <div className="grid grid-cols-3 gap-2">
              {(["home", "draw", "away"] as Outcome[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setSelected(o)}
                  className={`py-2.5 px-1 rounded-lg border text-center text-[10px] font-heading font-bold uppercase tracking-widest transition-all ${
                    selected === o ? OUTCOME_COLORS[o] : OUTCOME_BTN_IDLE
                  }`}
                >
                  <div className="text-base mb-1">
                    {o === "home" ? "🏠" : o === "draw" ? "🤝" : "✈️"}
                  </div>
                  {o === "home" ? homeNationCode : o === "away" ? awayNationCode : "Draw"}
                </button>
              ))}
            </div>

            {/* Score inputs */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Exact score <span className="normal-case font-normal">(optional · bonus XP)</span>
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{homeNationName}</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 text-center text-lg font-mono font-bold bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary/60 focus:bg-muted/60 transition-colors"
                  />
                </div>
                <span className="text-muted-foreground font-bold text-lg pt-4">–</span>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{awayNationName}</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 text-center text-lg font-mono font-bold bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary/60 focus:bg-muted/60 transition-colors"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full font-heading uppercase tracking-widest h-10 text-xs"
            >
              {submit.isPending ? "Submitting…" : "Lock In Prediction"}
            </Button>
          </div>
        )}

        {/* Community distribution */}
        {summary && summary.total > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Community Split
            </p>
            {(["home", "draw", "away"] as Outcome[]).map((o) => {
              const pct = o === "home" ? summary.homePct : o === "draw" ? summary.drawPct : summary.awayPct;
              return (
                <div key={o} className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-muted-foreground text-[10px] font-bold uppercase tracking-wide truncate">
                    {o === "home" ? homeNationCode : o === "away" ? awayNationCode : "Draw"}
                  </span>
                  <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${OUTCOME_BAR[o]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono font-bold text-[11px] w-7 text-right tabular-nums">{pct}%</span>
                </div>
              );
            })}
            <Link
              href={`/match-stats/${matchId}`}
              className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary font-bold uppercase tracking-widest pt-1 transition-colors"
            >
              <BarChart2 className="h-3 w-3" /> Full prediction stats <ChevronRight className="h-3 w-3 ml-auto" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MatchDetail() {
  const { id } = useParams();
  const matchId = parseInt(id as string, 10);
  const queryClient = useQueryClient();
  const [myReaction, setMyReaction] = useState<string | null>(null);

  const { data: match, isLoading: matchLoading } = useGetMatch(matchId, {
    query: { enabled: !!matchId, queryKey: getGetMatchQueryKey(matchId) },
  });
  const { data: polls } = useListMatchPolls(matchId, { query: { queryKey: getListMatchPollsQueryKey(matchId), enabled: !!matchId } });
  const { data: reactionSummary } = useGetReactionSummary(matchId, { query: { queryKey: getGetReactionSummaryQueryKey(matchId), enabled: !!matchId } });

  const castVote = useCastPollVote();
  const submitReaction = useSubmitReaction();

  const handleVote = (pollId: number, optionValue: string) => {
    castVote.mutate(
      { matchId, pollId, data: { optionValue } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMatchPollsQueryKey(matchId) });
          queryClient.invalidateQueries({ queryKey: getGetMatchQueryKey(matchId) });
        },
      },
    );
  };

  const handleReaction = (reactionType: string) => {
    if (myReaction) return;
    setMyReaction(reactionType);
    submitReaction.mutate(
      { matchId, data: { reactionType: reactionType as ReactionInputReactionType } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetReactionSummaryQueryKey(matchId) });
        },
        onError: () => setMyReaction(null),
      },
    );
  };

  if (matchLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-card rounded-2xl" />
      </div>
    );
  }

  if (!match) return <div className="text-center py-20 text-muted-foreground">Match not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/matches" className="text-muted-foreground hover:text-primary flex items-center gap-2 w-fit text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Matches
      </Link>

      {/* Head to Head */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="bg-muted/20 border-b border-border/50 px-4 py-3 text-center relative">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5" /> {match.competition}
            {match.stage && ` · ${match.stage}`}
          </span>
          {match.status === "live" && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded animate-pulse">
              Live
            </span>
          )}
        </div>
        <CardContent className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
              <span className="text-7xl md:text-9xl mb-4 leading-none">{match.homeNationFlag}</span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">{match.homeNationName}</h2>
            </div>

            <div className="flex flex-col items-center gap-2">
              {match.status === "upcoming" ? (
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex flex-col items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>
                    {new Date(match.scheduledAt).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              ) : (
                <div className="text-5xl md:text-7xl font-heading font-bold text-primary bg-primary/5 px-8 py-4 rounded-xl border border-primary/20">
                  {match.homeScore} – {match.awayScore}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center md:items-end text-center md:text-right flex-1">
              <span className="text-7xl md:text-9xl mb-4 leading-none">{match.awayNationFlag}</span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">{match.awayNationName}</h2>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Polls */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2 border-b border-border/50 pb-2">
            <Activity className="w-5 h-5 text-primary" /> Active Polls
          </h3>

          {!polls?.length ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl text-sm">
              No active polls for this match.
            </div>
          ) : (
            <div className="space-y-5">
              {polls.map((poll: any) => (
                <Card key={poll.id} className="bg-card border-border">
                  <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                    <CardTitle className="font-heading text-lg">{poll.question}</CardTitle>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">
                      {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""} cast · +5 pts per vote
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {poll.options.map((option: any) => (
                      <div key={option.value} className="relative">
                        <button
                          onClick={() => handleVote(poll.id, option.value)}
                          disabled={!!poll.userVote || castVote.isPending}
                          className={`w-full h-11 px-4 rounded-md border text-left text-sm font-bold relative overflow-hidden transition-colors ${
                            poll.userVote === option.value
                              ? "border-primary text-primary bg-primary/10"
                              : poll.userVote
                              ? "border-border text-muted-foreground cursor-not-allowed"
                              : "border-border bg-transparent hover:border-primary/50 hover:bg-muted/30"
                          }`}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-700"
                            style={{ width: `${option.percentage}%` }}
                          />
                          <span className="relative z-10 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              {poll.userVote === option.value && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                              {option.label}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">{option.percentage}%</span>
                          </span>
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button className="w-full font-heading uppercase tracking-widest h-12" variant="outline" asChild>
            <Link href={`/discussions?matchId=${matchId}`}>
              Join Match Discussion <MessageSquare className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Right: Prediction + Sentiment */}
        <div className="space-y-6">
          {/* Score Prediction */}
          <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2 border-b border-border/50 pb-2">
            <Target className="w-5 h-5 text-primary" /> Predict
          </h3>
          <ScorePredictionCard
            matchId={matchId}
            homeNationCode={match.homeNationCode}
            awayNationCode={match.awayNationCode}
            homeNationName={match.homeNationName}
            awayNationName={match.awayNationName}
            matchStatus={match.status}
          />

          {/* Fan Mood */}
          <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2 border-b border-border/50 pb-2">
            Fan Mood
          </h3>

          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {myReaction ? "Reaction logged · +3 pts" : "How do you feel? · +3 pts"}
              </p>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleReaction(r.type)}
                    disabled={!!myReaction}
                    title={r.label}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all ${
                      myReaction === r.type
                        ? "border-primary bg-primary/10 scale-110"
                        : myReaction
                        ? "border-border/30 opacity-40"
                        : "border-border hover:border-primary/50 hover:bg-muted/50 hover:scale-105"
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{r.emoji}</span>
                    <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-tight text-center">
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {reactionSummary && reactionSummary.total > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-4">
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Dominant Mood
                  </div>
                  <div className="text-4xl mb-1">
                    {(reactionSummary.dominantReaction ? SENTIMENT_EMOJI[reactionSummary.dominantReaction] : null) || "😐"}
                  </div>
                  <div className="text-lg font-heading font-bold text-primary capitalize">
                    {reactionSummary.dominantReaction || "Neutral"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {reactionSummary.total} reaction{reactionSummary.total !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  {REACTIONS.map((r) => {
                    const count = (reactionSummary as any)[r.type] ?? 0;
                    const pct = reactionSummary.total > 0 ? Math.round((count / reactionSummary.total) * 100) : 0;
                    if (count === 0) return null;
                    return (
                      <div key={r.type} className="flex items-center gap-2">
                        <span className="text-base w-5">{r.emoji}</span>
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
