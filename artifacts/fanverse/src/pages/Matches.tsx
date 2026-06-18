import { useListMatches } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";

export default function Matches() {
  const { data: upcomingMatches, isLoading: loadingUpcoming } = useListMatches({ status: 'upcoming' });
  const { data: liveMatches, isLoading: loadingLive } = useListMatches({ status: 'live' });
  const { data: completedMatches, isLoading: loadingCompleted } = useListMatches({ status: 'completed' });

  const MatchList = ({ matches, loading }: { matches: any[], loading: boolean }) => {
    if (loading) return <div className="space-y-4"><div className="h-32 bg-muted rounded-xl animate-pulse"></div></div>;
    if (!matches || matches.length === 0) return <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">No matches found.</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.map(match => (
          <Link key={match.id} href={`/matches/${match.id}`}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                    <Shield className="w-3 h-3" /> {match.competition}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${match.status === 'live' ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}>
                    {match.status === 'live' ? 'LIVE' : new Date(match.scheduledAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 w-2/5">
                      <span className="text-4xl">{match.homeNationFlag}</span>
                      <span className="font-heading text-lg font-bold truncate">{match.homeNationName}</span>
                    </div>
                    
                    <div className="w-1/5 flex justify-center">
                      {match.status === 'upcoming' ? (
                        <div className="px-3 py-1 bg-muted rounded font-mono text-sm font-bold text-muted-foreground">VS</div>
                      ) : (
                        <div className="px-4 py-2 bg-primary/10 rounded font-heading text-2xl font-bold text-primary border border-primary/20">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 w-2/5 text-right">
                      <span className="font-heading text-lg font-bold truncate">{match.awayNationName}</span>
                      <span className="text-4xl">{match.awayNationFlag}</span>
                    </div>
                  </div>

                  {/* Confidence Bar (Mocked structure for listing) */}
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                      <span>{match.homeConfidence || 50}%</span>
                      <span className="uppercase tracking-widest text-[10px]">Fan Confidence</span>
                      <span>{match.awayConfidence || 50}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                      <div className="bg-primary h-full" style={{ width: `${match.homeConfidence || 50}%` }} />
                      <div className="bg-white h-full opacity-20" style={{ width: `${match.awayConfidence || 50}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Match Center</h1>
        <p className="text-muted-foreground mt-2">Live scores, upcoming fixtures, and fan confidence tracking.</p>
      </header>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-card border border-border p-1 w-full max-w-md grid grid-cols-3 mb-8">
          <TabsTrigger value="live" className="font-heading uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Live</TabsTrigger>
          <TabsTrigger value="upcoming" className="font-heading uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" className="font-heading uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="live">
          <MatchList matches={liveMatches || []} loading={loadingLive} />
        </TabsContent>
        <TabsContent value="upcoming">
          <MatchList matches={upcomingMatches || []} loading={loadingUpcoming} />
        </TabsContent>
        <TabsContent value="completed">
          <MatchList matches={completedMatches || []} loading={loadingCompleted} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
