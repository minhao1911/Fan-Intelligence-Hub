import { useParams, Link } from "wouter";
import { useGetMatch, useListMatchPolls, useListMatchReactions, useGetReactionSummary, getGetMatchQueryKey, useCastPollVote } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MessageSquare, Activity, Shield } from "lucide-react";

export default function MatchDetail() {
  const { id } = useParams();
  const matchId = parseInt(id as string, 10);
  const queryClient = useQueryClient();

  const { data: match, isLoading: matchLoading } = useGetMatch(matchId, { query: { enabled: !!matchId, queryKey: getGetMatchQueryKey(matchId) } });
  const { data: polls } = useListMatchPolls(matchId, { query: { enabled: !!matchId } });
  const { data: reactionSummary } = useGetReactionSummary(matchId, { query: { enabled: !!matchId } });

  const castVote = useCastPollVote();

  if (matchLoading) {
    return <div className="space-y-8 animate-pulse"><div className="h-64 bg-card rounded-2xl"></div></div>;
  }

  if (!match) return <div className="text-center py-20">Match not found</div>;

  const handleVote = (pollId: number, optionValue: string) => {
    castVote.mutate({ matchId, pollId, data: { optionValue } }, {
      onSuccess: () => {
        // Assume invalidation logic or state patch
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/matches" className="text-muted-foreground hover:text-primary flex items-center gap-2 w-fit mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Matches
      </Link>

      {/* Head to Head Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="bg-muted/20 border-b border-border/50 p-4 text-center">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> {match.competition}
            {match.stage && ` • ${match.stage}`}
          </span>
        </div>
        <CardContent className="p-8 md:p-12 relative">
           {match.status === 'live' && (
             <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest rounded animate-pulse">Live</div>
           )}
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
              <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
                <span className="text-7xl md:text-9xl mb-4">{match.homeNationFlag}</span>
                <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">{match.homeNationName}</h2>
              </div>

              <div className="flex flex-col items-center justify-center">
                {match.status === 'upcoming' ? (
                  <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex flex-col items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{new Date(match.scheduledAt).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="text-5xl md:text-7xl font-heading font-bold text-primary bg-primary/5 px-8 py-4 rounded-xl border border-primary/20">
                    {match.homeScore} - {match.awayScore}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center md:items-end text-center md:text-right flex-1">
                <span className="text-7xl md:text-9xl mb-4">{match.awayNationFlag}</span>
                <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">{match.awayNationName}</h2>
              </div>
           </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Polls & Discussions */}
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-2xl font-heading font-bold uppercase flex items-center gap-2 border-b border-border/50 pb-2">
            <Activity className="w-6 h-6 text-primary" /> Active Polls
          </h3>
          
          <div className="space-y-6">
            {polls?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">No active polls for this match.</div>
            ) : (
              polls?.map(poll => (
                <Card key={poll.id} className="bg-card border-border">
                  <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                    <CardTitle className="font-heading text-xl">{poll.question}</CardTitle>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">{poll.totalVotes} Votes Cast</div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {poll.options.map(option => (
                      <div key={option.value} className="relative">
                        <Button
                          variant="outline"
                          onClick={() => handleVote(poll.id, option.value)}
                          disabled={!!poll.userVote || castVote.isPending}
                          className={`w-full justify-start h-12 relative overflow-hidden z-10 border-border bg-transparent hover:bg-muted/50 ${poll.userVote === option.value ? 'border-primary text-primary' : ''}`}
                        >
                          <span className="relative z-20 font-bold">{option.label}</span>
                          <span className="absolute right-4 z-20 font-mono text-muted-foreground">{option.percentage}%</span>
                          {/* Fill Bar */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-primary/10 -z-10 transition-all duration-1000 ease-out"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="pt-8">
             <Button className="w-full font-heading uppercase tracking-widest h-14 text-lg" variant="outline" asChild>
                <Link href={`/discussions?matchId=${matchId}`}>Join Match Discussion <MessageSquare className="ml-2 w-5 h-5" /></Link>
             </Button>
          </div>
        </div>

        {/* Right Column: Sentiment & Pulse */}
        <div className="space-y-8">
           <h3 className="text-2xl font-heading font-bold uppercase flex items-center gap-2 border-b border-border/50 pb-2">
            Sentiment
          </h3>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              {reactionSummary ? (
                <div>
                   <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Dominant Emotion</div>
                   <div className="text-4xl font-heading font-bold text-primary mb-2 capitalize">{reactionSummary.dominantReaction || "Neutral"}</div>
                   <div className="text-xs text-muted-foreground">{reactionSummary.total} Reactions Logged</div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">Gathering sentiment data...</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
