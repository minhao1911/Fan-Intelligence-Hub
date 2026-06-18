import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetMatch,
  useListMatchPolls,
  useGetReactionSummary,
  getGetMatchQueryKey,
  getListMatchPollsQueryKey,
  getGetReactionSummaryQueryKey,
  useCastPollVote,
  useSubmitReaction,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MessageSquare, Activity, Shield, CheckCircle2 } from "lucide-react";

const REACTIONS = [
  { type: "ecstatic", emoji: "🤩", label: "Ecstatic" },
  { type: "satisfied", emoji: "😊", label: "Satisfied" },
  { type: "neutral", emoji: "😐", label: "Neutral" },
  { type: "disappointed", emoji: "😞", label: "Disappointed" },
  { type: "devastated", emoji: "😢", label: "Devastated" },
];

const SENTIMENT_EMOJI: Record<string, string> = {
  ecstatic: "🤩",
  satisfied: "😊",
  neutral: "😐",
  disappointed: "😞",
  devastated: "😢",
};

export default function MatchDetail() {
  const { id } = useParams();
  const matchId = parseInt(id as string, 10);
  const queryClient = useQueryClient();
  const [myReaction, setMyReaction] = useState<string | null>(null);

  const { data: match, isLoading: matchLoading } = useGetMatch(matchId, {
    query: { enabled: !!matchId, queryKey: getGetMatchQueryKey(matchId) },
  });
  const { data: polls } = useListMatchPolls(matchId, { query: { enabled: !!matchId } });
  const { data: reactionSummary } = useGetReactionSummary(matchId, { query: { enabled: !!matchId } });

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
      { matchId, data: { reactionType } },
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

        {/* Right: Sentiment */}
        <div className="space-y-6">
          <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2 border-b border-border/50 pb-2">
            Fan Mood
          </h3>

          {/* Reaction Buttons */}
          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {myReaction ? "Reaction logged · +3 pts" : "How do you feel? · +3 pts"}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleReaction(r.type)}
                    disabled={!!myReaction}
                    title={r.label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      myReaction === r.type
                        ? "border-primary bg-primary/10 scale-110"
                        : myReaction
                        ? "border-border/30 opacity-40"
                        : "border-border hover:border-primary/50 hover:bg-muted/50 hover:scale-105"
                    }`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Summary */}
          {reactionSummary && reactionSummary.total > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-4">
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Dominant Mood
                  </div>
                  <div className="text-4xl mb-1">
                    {SENTIMENT_EMOJI[reactionSummary.dominantReaction] || "😐"}
                  </div>
                  <div className="text-lg font-heading font-bold text-primary capitalize">
                    {reactionSummary.dominantReaction || "Neutral"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {reactionSummary.total} reaction{reactionSummary.total !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Reaction Breakdown */}
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
