import { useListMatches } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CalendarDays, Trophy, Radio } from "lucide-react";

function MatchSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
        <div className="h-3 w-32 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="h-8 w-16 bg-muted rounded shrink-0" />
        <div className="flex items-center justify-end gap-3 flex-1">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="h-1.5 w-full bg-muted rounded-full" />
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  const config = {
    live:      { icon: "📡", title: "No Live Matches", desc: "Check back when the next game kicks off." },
    upcoming:  { icon: "🗓️", title: "No Upcoming Fixtures", desc: "The schedule will appear here once matches are confirmed." },
    completed: { icon: "🏆", title: "No Completed Matches", desc: "Results will appear here after matches finish." },
  }[tab] ?? { icon: "⚽", title: "No Matches", desc: "Check back later." };

  return (
    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/60 rounded-2xl text-center gap-3">
      <span className="text-5xl">{config.icon}</span>
      <div>
        <p className="font-heading font-bold uppercase text-foreground tracking-wide">{config.title}</p>
        <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>
      </div>
    </div>
  );
}

export default function Matches() {
  const { data: upcomingMatches, isLoading: loadingUpcoming } = useListMatches({ status: "upcoming" });
  const { data: liveMatches,    isLoading: loadingLive }      = useListMatches({ status: "live" });
  const { data: completedMatches, isLoading: loadingCompleted } = useListMatches({ status: "completed" });

  const hasLive = (liveMatches?.length ?? 0) > 0;

  const MatchList = ({ matches, loading, tab }: { matches: any[]; loading: boolean; tab: string }) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <MatchSkeleton key={i} />)}
        </div>
      );
    }
    if (!matches || matches.length === 0) return <EmptyState tab={tab} />;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <Link key={match.id} href={`/matches/${match.id}`}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200 cursor-pointer group hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Header strip */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
                  <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                    <Shield className="w-3 h-3 shrink-0" /> {match.competition}
                  </span>
                  {match.status === "live" ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                      </span>
                      Live
                    </span>
                  ) : match.status === "completed" ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> FT
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(match.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Teams & score */}
                <div className="px-5 py-4 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="text-3xl sm:text-4xl shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform duration-200">{match.homeNationFlag}</span>
                      <span className="font-heading text-sm sm:text-base font-bold truncate text-foreground">{match.homeNationName}</span>
                    </div>

                    <div className="shrink-0 flex justify-center w-16 sm:w-20">
                      {match.status === "upcoming" ? (
                        <div className="px-3 py-1.5 bg-muted/60 rounded-lg font-mono text-xs font-bold text-muted-foreground border border-border/50">VS</div>
                      ) : (
                        <div className={`px-3 py-1.5 rounded-lg font-heading text-lg sm:text-xl font-black border whitespace-nowrap tabular-nums ${
                          match.status === "live"
                            ? "bg-red-500/10 text-red-400 border-red-500/25"
                            : "bg-primary/8 text-primary border-primary/20"
                        }`}>
                          {match.homeScore} – {match.awayScore}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                      <span className="font-heading text-sm sm:text-base font-bold truncate text-foreground">{match.awayNationName}</span>
                      <span className="text-3xl sm:text-4xl shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform duration-200">{match.awayNationFlag}</span>
                    </div>
                  </div>

                  {/* Fan confidence bar */}
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
                      <span className="font-bold text-primary">{match.homeConfidence || 50}%</span>
                      <span className="uppercase tracking-widest">Fan Confidence</span>
                      <span className="font-bold text-primary">{match.awayConfidence || 50}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden flex">
                      <div className="bg-primary h-full rounded-l-full transition-all duration-500" style={{ width: `${match.homeConfidence || 50}%` }} />
                      <div className="bg-muted-foreground/20 h-full rounded-r-full flex-1" />
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
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-black uppercase text-foreground tracking-tight">Match Center</h1>
          {hasLive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-widest">
              <Radio className="w-3 h-3" /> Live
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-1 ml-[52px]">Live scores, upcoming fixtures, and fan confidence tracking.</p>
      </header>

      <Tabs defaultValue={hasLive ? "live" : "upcoming"} className="w-full">
        <TabsList className="bg-card border border-border p-1 w-full max-w-sm grid grid-cols-3 mb-6">
          <TabsTrigger
            value="live"
            className="font-heading uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
          >
            Live
            {hasLive && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming"  className="font-heading uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" className="font-heading uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <MatchList matches={liveMatches || []} loading={loadingLive} tab="live" />
        </TabsContent>
        <TabsContent value="upcoming">
          <MatchList matches={upcomingMatches || []} loading={loadingUpcoming} tab="upcoming" />
        </TabsContent>
        <TabsContent value="completed">
          <MatchList matches={completedMatches || []} loading={loadingCompleted} tab="completed" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
