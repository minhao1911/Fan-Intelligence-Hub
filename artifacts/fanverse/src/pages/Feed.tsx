import { useListMatches, useGetGlobalStats, useListNations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, TrendingUp, Globe } from "lucide-react";

export default function Feed() {
  const { data: matches, isLoading: matchesLoading } = useListMatches({ status: "upcoming", limit: 5 });
  const { data: liveMatches } = useListMatches({ status: "live", limit: 3 });
  const { data: stats } = useGetGlobalStats();
  const { data: nations } = useListNations({});

  const topNations = nations
    ? [...nations].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0)).slice(0, 6)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Global Feed</h1>
        <p className="text-muted-foreground mt-1">Live intel and upcoming fixtures from across the globe.</p>
      </header>

      {/* Live Pulse Hero */}
      <section className="bg-card border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-primary/5">
        <div className="absolute -right-16 -top-16 opacity-5">
          <Activity className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-primary font-heading uppercase tracking-widest text-xs mb-1">Live Pulse</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-heading font-bold text-foreground">
                {stats?.totalVotesCast?.toLocaleString() ?? "—"}
              </span>
              <span className="text-lg text-muted-foreground pb-1">votes cast</span>
            </div>
            <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
              <span><strong className="text-foreground">{stats?.totalFans?.toLocaleString() ?? "—"}</strong> analysts</span>
              <span><strong className="text-foreground">{stats?.totalNationsActive?.toLocaleString() ?? "—"}</strong> nations active</span>
            </div>
          </div>
          <Link href="/pulse">
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 shrink-0">
              Nation Pulse Analytics →
            </Button>
          </Link>
        </div>
      </section>

      {/* Live Matches (if any) */}
      {liveMatches && liveMatches.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-heading font-bold uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Now
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="bg-card border-red-500/20 hover:border-red-500/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{match.homeNationFlag}</span>
                      <span className="font-heading font-bold text-sm truncate">{match.homeNationName}</span>
                    </div>
                    <div className="font-heading text-xl font-bold text-red-500 shrink-0">
                      {match.homeScore} – {match.awayScore}
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                      <span className="font-heading font-bold text-sm truncate text-right">{match.awayNationName}</span>
                      <span className="text-2xl">{match.awayNationFlag}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Fixtures */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Upcoming Fixtures
            </h3>
            <Link href="/matches" className="text-sm font-medium text-primary hover:underline">
              View All →
            </Link>
          </div>

          {matchesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : !matches?.length ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No upcoming matches scheduled.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer group">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/20">
                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          {match.competition}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(match.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{match.homeNationFlag}</span>
                          <span className="font-heading font-bold truncate">{match.homeNationName}</span>
                        </div>
                        <div className="px-3 py-1 bg-muted rounded font-mono text-xs font-bold text-muted-foreground shrink-0">
                          VS
                        </div>
                        <div className="flex items-center justify-end gap-3 flex-1">
                          <span className="font-heading font-bold truncate text-right">{match.awayNationName}</span>
                          <span className="text-2xl">{match.awayNationFlag}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Trending Nations */}
        <div className="space-y-4">
          <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Top Confidence
          </h3>
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              {topNations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
              ) : (
                topNations.map((nation, idx) => (
                  <Link key={nation.code} href={`/nations/${nation.code}`}>
                    <div className="flex items-center gap-3 py-2 hover:opacity-80 transition-opacity cursor-pointer">
                      <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                      <span className="text-xl leading-none">{nation.flagEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{nation.name}</p>
                        <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-primary/70 rounded-full"
                            style={{ width: `${nation.confidenceScore ?? 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-primary shrink-0">
                        {nation.confidenceScore ?? 0}%
                      </span>
                    </div>
                  </Link>
                ))
              )}
              <div className="pt-2 border-t border-border/50">
                <Link href="/nations">
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary gap-2 h-8">
                    <Globe className="w-3.5 h-3.5" /> View All Nations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Links</p>
              {[
                { href: "/leaderboard", label: "Fan Leaderboard" },
                { href: "/discussions", label: "Discussions" },
                { href: "/profile", label: "My Reputation" },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-1.5 flex items-center justify-between group">
                    {link.label}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
