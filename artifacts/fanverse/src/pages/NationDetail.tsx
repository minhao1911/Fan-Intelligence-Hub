import { useParams, Link } from "wouter";
import { useGetNation, useGetNationPulse, useJoinNation, useLeaveNation, getGetNationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function NationDetail() {
  const { code } = useParams();
  const queryClient = useQueryClient();
  const { data: nation, isLoading } = useGetNation(code as string, { query: { enabled: !!code, queryKey: getGetNationQueryKey(code as string) } });
  const { data: pulse } = useGetNationPulse(code as string, { query: { enabled: !!code } });
  
  const joinNation = useJoinNation();
  const leaveNation = useLeaveNation();

  const toggleMembership = () => {
    if (!nation) return;
    if (nation.isUserMember) {
      leaveNation.mutate({ code: nation.code }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNationQueryKey(nation.code) });
        }
      });
    } else {
      joinNation.mutate({ code: nation.code }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNationQueryKey(nation.code) });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-card rounded-2xl"></div>
        <div className="grid grid-cols-3 gap-6"><div className="h-32 bg-card rounded-xl"></div></div>
      </div>
    );
  }

  if (!nation) return <div className="text-center py-20">Nation not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/nations" className="text-muted-foreground hover:text-primary flex items-center gap-2 w-fit mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Nations
      </Link>

      <Card className="bg-card border-border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
        <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="text-9xl leading-none">{nation.flagEmoji}</div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-tight text-foreground">{nation.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
              <span className="text-muted-foreground font-bold tracking-widest uppercase">{nation.confederation}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Users className="h-4 w-4" /> {nation.memberCount.toLocaleString()} Fans
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            {nation.confidenceScore !== null && nation.confidenceScore !== undefined && (
              <div className="text-center md:text-right">
                <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">Fan Confidence</span>
                <span className="text-4xl font-mono font-bold text-primary">{nation.confidenceScore}%</span>
              </div>
            )}
            <Button 
              onClick={toggleMembership} 
              disabled={joinNation.isPending || leaveNation.isPending}
              variant={nation.isUserMember ? "outline" : "default"}
              className={`w-full md:w-auto font-heading uppercase tracking-widest ${nation.isUserMember ? 'border-primary/50 text-primary hover:bg-primary/10' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
            >
              {nation.isUserMember ? "Leave Community" : "Join Fanbase"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-heading font-bold uppercase border-b border-border/50 pb-2">Upcoming Matches</h2>
          {nation.upcomingMatches.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">No upcoming matches.</div>
          ) : (
            <div className="space-y-4">
              {nation.upcomingMatches.map(match => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
                        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                          <Shield className="w-3 h-3" /> {match.competition}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {new Date(match.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-3xl">{match.homeNationFlag}</span>
                          <span className="font-heading text-xl font-bold truncate">{match.homeNationName}</span>
                        </div>
                        <div className="px-4 py-1 bg-muted rounded font-mono text-sm font-bold text-muted-foreground">VS</div>
                        <div className="flex items-center justify-end gap-4 flex-1">
                          <span className="font-heading text-xl font-bold truncate">{match.awayNationName}</span>
                          <span className="text-3xl">{match.awayNationFlag}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-heading font-bold uppercase border-b border-border/50 pb-2">Pulse Overview</h2>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {pulse ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Trend</span>
                      {pulse.recentTrend === 'rising' ? <TrendingUp className="text-emerald-500 w-5 h-5" /> : 
                       pulse.recentTrend === 'falling' ? <TrendingDown className="text-red-500 w-5 h-5" /> :
                       <Minus className="text-gray-500 w-5 h-5" />}
                    </div>
                  </div>
                  <div>
                     <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground block mb-2">Win Confidence</span>
                     <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <div className="bg-primary h-full" style={{ width: `${pulse.winConfidence}%` }}></div>
                     </div>
                     <div className="text-right text-xs font-mono mt-1 text-primary">{pulse.winConfidence}%</div>
                  </div>
                  <Button variant="outline" className="w-full border-border hover:bg-muted/50 asChild">
                    <Link href={`/discussions?nationCode=${nation.code}`}>View Discussions</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">Gathering pulse data...</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
