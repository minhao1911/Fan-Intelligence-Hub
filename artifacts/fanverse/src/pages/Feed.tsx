import { useListMatches, useGetGlobalStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, TrendingUp } from "lucide-react";

export default function Feed() {
  const { data: matches, isLoading: matchesLoading } = useListMatches({ status: 'upcoming', limit: 5 });
  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Global Feed</h1>
        <p className="text-muted-foreground mt-2">Live intel and upcoming fixtures across the globe.</p>
      </header>

      {/* Hero Pulse Card */}
      <section className="bg-card border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl shadow-primary/5">
        <div className="absolute -right-20 -top-20 opacity-10">
          <Activity className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10">
          <h2 className="text-primary font-heading uppercase tracking-widest text-sm mb-2">Live Pulse</h2>
          <div className="text-5xl font-heading font-bold text-white mb-4">
            {statsLoading ? "..." : stats?.totalVotesCast?.toLocaleString()} <span className="text-xl text-muted-foreground font-sans font-normal lowercase tracking-normal">votes cast</span>
          </div>
          <Link href="/pulse">
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              View Global Pulse Analytics
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upcoming Matches */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-heading font-bold uppercase flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> Upcoming Fixtures
            </h3>
            <Link href="/matches" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {matchesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : matches?.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming matches scheduled.
                </CardContent>
              </Card>
            ) : (
              matches?.map(match => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{match.competition}</span>
                        <span className="text-xs text-muted-foreground">{new Date(match.scheduledAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-3xl">{match.homeNationFlag}</span>
                          <span className="font-heading text-xl font-bold">{match.homeNationName}</span>
                        </div>
                        <div className="px-4 py-1 bg-muted rounded font-mono text-sm font-bold text-muted-foreground">VS</div>
                        <div className="flex items-center justify-end gap-4 flex-1">
                          <span className="font-heading text-xl font-bold">{match.awayNationName}</span>
                          <span className="text-3xl">{match.awayNationFlag}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Trending */}
        <div className="space-y-6">
          <h3 className="text-2xl font-heading font-bold uppercase flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Trending
          </h3>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-heading uppercase text-lg">Top Active Nations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                {stats?.mostActivatedNation ? (
                  <div>
                    <div className="text-4xl font-heading text-primary mb-2">{stats.mostActivatedNation}</div>
                    <div className="text-sm uppercase tracking-wider">Most activated community</div>
                  </div>
                ) : "Data gathering..."}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
