import { useListMatches, useGetGlobalStats, useListNations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, TrendingUp, Globe, Zap, Target, MessageSquare, Users } from "lucide-react";

export default function Feed() {
  const { data: matches, isLoading: matchesLoading } = useListMatches({ status: "upcoming", limit: 5 });
  const { data: liveMatches } = useListMatches({ status: "live", limit: 3 });
  const { data: stats } = useGetGlobalStats();
  const { data: nations } = useListNations({});

  const topNations = nations
    ? [...nations].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0)).slice(0, 6)
    : [];

  return (
    <div className="flex gap-6 animate-in fade-in duration-500">

      {/* ── LEFT PANEL ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col gap-4 w-72 xl:w-80 shrink-0">

        {/* Nation Pulse Card */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Nation Pulse
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Votes Cast", value: stats?.totalVotesCast?.toLocaleString() ?? "—", icon: Zap },
                { label: "Fan Analysts", value: stats?.totalFans?.toLocaleString() ?? "—", icon: Users },
                { label: "Nations Active", value: stats?.totalNationsActive?.toLocaleString() ?? "—", icon: Globe },
                { label: "Live Matches", value: (liveMatches?.length ?? 0).toString(), icon: Activity },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-muted/40 rounded-xl p-3 border border-border/50">
                  <Icon className="h-3.5 w-3.5 text-primary mb-1.5" />
                  <p className="text-lg font-heading font-bold text-foreground leading-none">{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
            <Link href="/pulse" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full border-primary/40 text-primary hover:bg-primary/10 text-xs font-heading uppercase tracking-wide">
                Full Analytics →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Actions</p>
            <div className="space-y-1.5">
              {[
                { href: "/discussions", icon: MessageSquare, label: "Start Discussion", color: "text-blue-400" },
                { href: "/matches",     icon: Activity,      label: "Match Reactions", color: "text-red-400" },
                { href: "/nations",     icon: Globe,         label: "Confidence Poll", color: "text-emerald-400" },
                { href: "/predictions", icon: Target,        label: "Predict a Match", color: "text-primary" },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link key={href} href={href}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group cursor-pointer`}>
                    <Icon className={`h-4 w-4 ${color} shrink-0`} />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming fixtures teaser on left for desktop-only */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Quick Links
            </p>
            <div className="space-y-1">
              {[
                { href: "/leaderboard", label: "Fan Leaderboard" },
                { href: "/groups",      label: "Fan Groups" },
                { href: "/fixtures",    label: "All Fixtures" },
                { href: "/profile",     label: "My Reputation" },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <div className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-1.5 flex items-center justify-between group">
                    {label}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-xs">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* ── CENTER FEED ─────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Live Pulse Hero */}
        <section className="bg-card border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-primary/5">
          <div className="absolute -right-16 -top-16 opacity-5 pointer-events-none">
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

        {/* Mobile-only quick actions row */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden no-scrollbar">
          {[
            { href: "/discussions", icon: MessageSquare, label: "Discuss" },
            { href: "/matches",     icon: Activity,      label: "Reactions" },
            { href: "/predictions", icon: Target,        label: "Predict" },
            { href: "/nations",     icon: Globe,         label: "Nations" },
            { href: "/leaderboard", icon: TrendingUp,    label: "Leaders" },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-1.5 px-4 py-3 bg-card border border-border rounded-xl shrink-0 hover:border-primary/40 transition-colors">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Live Matches */}
        {liveMatches && liveMatches.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-heading font-bold uppercase flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              Live Now
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* Upcoming Fixtures */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-bold uppercase flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-primary" /> Upcoming Fixtures
            </h3>
            <Link href="/matches" className="text-xs font-bold text-primary hover:underline uppercase tracking-wide">
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
                  <Card className="bg-card border-border hover:border-primary/40 transition-all duration-200 cursor-pointer group">
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
        </section>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────── */}
      <aside className="hidden xl:flex flex-col gap-4 w-72 shrink-0">

        {/* Top Confidence */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-primary" /> Top Confidence
            </h3>
            <div className="space-y-3">
              {topNations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
              ) : (
                topNations.map((nation, idx) => (
                  <Link key={nation.code} href={`/nations/${nation.code}`}>
                    <div className="flex items-center gap-3 py-1.5 hover:opacity-80 transition-opacity cursor-pointer">
                      <span className="font-mono text-xs text-muted-foreground w-4 shrink-0 text-center">{idx + 1}</span>
                      <span className="text-xl leading-none">{nation.flagEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{nation.name}</p>
                        <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-primary/70 rounded-full transition-all duration-500"
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
            </div>
            <div className="pt-3 mt-1 border-t border-border/50">
              <Link href="/nations">
                <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-primary gap-2 h-8">
                  <Globe className="w-3.5 h-3.5" /> View All Nations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Trending / Quick Links */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Explore</p>
            <div className="space-y-1">
              {[
                { href: "/leaderboard", label: "Fan Leaderboard" },
                { href: "/discussions", label: "Discussions" },
                { href: "/groups",      label: "Fan Groups" },
                { href: "/profile",     label: "My Reputation" },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <div className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-1.5 flex items-center justify-between group">
                    {label}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-xs">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming fixture count teaser */}
        {matches && matches.length > 0 && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-5 text-center">
              <div className="text-4xl font-heading font-bold text-primary">{matches.length}</div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Upcoming Fixtures</p>
              <Link href="/fixtures" className="block mt-3">
                <Button size="sm" className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wide text-xs">
                  View Fixtures
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}
