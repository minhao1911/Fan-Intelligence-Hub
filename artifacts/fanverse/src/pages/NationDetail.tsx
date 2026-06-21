import { useParams, Link } from "wouter";
import { useGetNation, useJoinNation, useLeaveNation, getGetNationQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import { ArrowLeft, Users, Shield, TrendingUp, TrendingDown, Minus, Star, Lock, Zap } from "lucide-react";
import { useAuth } from "@clerk/react";
import { getBaseUrl } from "@/lib/api";

export default function NationDetail() {
  const { code } = useParams();
  const queryClient = useQueryClient();
  const { data: nation, isLoading } = useGetNation(code as string, {
    query: { enabled: !!code, queryKey: getGetNationQueryKey(code as string) },
  });
  const { getToken, isSignedIn } = useAuth();
  const { data: pulse, error: pulseError } = useQuery({
    queryKey: ["nation-pulse", code],
    enabled: !!code && isSignedIn === true,
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}api/nations/${code}/pulse`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 402) {
        const err = new Error("premium_required");
        (err as any).isPremiumRequired = true;
        throw err;
      }
      if (!res.ok) throw new Error("Failed to fetch pulse");
      return res.json();
    },
  });
  const isPremiumRequired = (pulseError as any)?.isPremiumRequired === true;

  const joinNation = useJoinNation();
  const leaveNation = useLeaveNation();

  const toggleMembership = () => {
    if (!nation) return;
    if (nation.isUserMember) {
      leaveNation.mutate({ code: nation.code }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNationQueryKey(nation.code) }),
      });
    } else {
      joinNation.mutate({ code: nation.code }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNationQueryKey(nation.code) }),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-card rounded-2xl" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 bg-card rounded-xl" />
        </div>
      </div>
    );
  }

  if (!nation) return <div className="text-center py-20 text-muted-foreground">Nation not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/nations" className="text-muted-foreground hover:text-primary flex items-center gap-2 w-fit text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Nations
      </Link>

      {/* Hero Card */}
      <Card className="bg-card border-border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="text-9xl leading-none select-none">{nation.flagEmoji}</div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
              <span className="flex items-center justify-center md:justify-start gap-2">
                <Shield className="w-3 h-3" /> {nation.confederation}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-heading font-bold uppercase tracking-tight text-foreground">
              {nation.name}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium text-sm">
                <Users className="h-4 w-4" /> {nation.memberCount.toLocaleString()} Fans
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
            {nation.confidenceScore != null && (
              <div className="text-center md:text-right">
                <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">Fan Confidence</span>
                <span className="text-4xl font-mono font-bold text-primary">{nation.confidenceScore}%</span>
              </div>
            )}
            <Button
              onClick={toggleMembership}
              disabled={joinNation.isPending || leaveNation.isPending}
              variant={nation.isUserMember ? "outline" : "default"}
              className={`font-heading uppercase tracking-widest ${
                nation.isUserMember
                  ? "border-primary/50 text-primary hover:bg-primary/10"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {nation.isUserMember ? "Leave Community" : (
                <span className="flex items-center gap-2">
                  Join Fanbase
                  <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded font-mono">+10 pts</span>
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Matches */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-heading font-bold uppercase border-b border-border/50 pb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Upcoming Fixtures
          </h2>
          {nation.upcomingMatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl text-sm">
              No upcoming matches scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {nation.upcomingMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
                        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                          {match.competition}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(match.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-3xl">{match.homeNationFlag}</span>
                          <span className="font-heading text-lg font-bold truncate">{match.homeNationName}</span>
                        </div>
                        <div className="px-3 py-1 bg-muted rounded font-mono text-xs font-bold text-muted-foreground">VS</div>
                        <div className="flex items-center justify-end gap-3 flex-1">
                          <span className="font-heading text-lg font-bold truncate text-right">{match.awayNationName}</span>
                          <span className="text-3xl">{match.awayNationFlag}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Recent Results */}
          {nation.recentMatches?.length > 0 && (
            <>
              <h2 className="text-xl font-heading font-bold uppercase border-b border-border/50 pb-2 pt-4">
                Recent Results
              </h2>
              <div className="space-y-3">
                {nation.recentMatches.map((match) => (
                  <Link key={match.id} href={`/matches/${match.id}`}>
                    <Card className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
                          <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            {match.competition}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground uppercase">FT</span>
                        </div>
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-3xl">{match.homeNationFlag}</span>
                            <span className="font-heading text-lg font-bold truncate">{match.homeNationName}</span>
                          </div>
                          <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded font-heading text-xl font-bold text-primary">
                            {match.homeScore} – {match.awayScore}
                          </div>
                          <div className="flex items-center justify-end gap-3 flex-1">
                            <span className="font-heading text-lg font-bold truncate text-right">{match.awayNationName}</span>
                            <span className="text-3xl">{match.awayNationFlag}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Pulse */}
          <h2 className="text-xl font-heading font-bold uppercase border-b border-border/50 pb-2">Pulse</h2>
          <Card className={`border-border overflow-hidden ${isPremiumRequired ? "bg-card/50" : "bg-card"}`}>
            <CardContent className="p-5 space-y-5">
              {isPremiumRequired ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">Premium Analytics</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-[200px]">
                      Advanced Nation Pulse — win confidence, fan mood, top contributors — requires Premium.
                    </p>
                  </div>
                  <Button asChild size="sm" className="font-heading uppercase tracking-widest text-xs w-full bg-primary hover:bg-primary/90">
                    <Link href="/store">
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      Unlock for ₹99/mo
                    </Link>
                  </Button>
                </div>
              ) : pulse ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trend</span>
                    {pulse.recentTrend === "rising" ? (
                      <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold"><TrendingUp className="w-4 h-4" /> Rising</div>
                    ) : pulse.recentTrend === "falling" ? (
                      <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold"><TrendingDown className="w-4 h-4" /> Falling</div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold"><Minus className="w-4 h-4" /> Stable</div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold uppercase tracking-widest text-muted-foreground">Win Confidence</span>
                      <span className="font-mono font-bold text-primary">{pulse.winConfidence}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pulse.winConfidence}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold uppercase tracking-widest text-muted-foreground">Draw</span>
                      <span className="font-mono font-bold text-muted-foreground">{pulse.drawConfidence}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="bg-muted-foreground/40 h-full rounded-full" style={{ width: `${pulse.drawConfidence}%` }} />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full text-xs font-heading uppercase tracking-widest border-border hover:bg-muted/50" asChild>
                    <Link href={`/discussions?nationCode=${nation.code}`}>View Discussions</Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  {isSignedIn ? "Gathering pulse data..." : "Sign in to view pulse analytics"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Contributors — only shown for premium users with data */}
          {!isPremiumRequired && pulse?.topContributors?.length > 0 && (
            <>
              <h2 className="text-xl font-heading font-bold uppercase border-b border-border/50 pb-2">Top Fans</h2>
              <div className="space-y-2">
                {pulse.topContributors.map((fan: any, idx: number) => (
                  <div key={fan.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <span className="font-mono text-xs text-muted-foreground w-4 shrink-0 text-center">
                      {idx + 1}
                    </span>
                    <Avatar className="h-7 w-7 border border-border shrink-0">
                      <AvatarImage src={fan.avatarUrl || undefined} />
                      <AvatarFallback className="bg-muted text-[10px] font-heading">
                        {fan.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{fan.username}</p>
                      <ReputationBadge tier={fan.reputationTier} size="sm" className="mt-0.5" />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 text-primary" />
                      <span className="text-xs font-mono font-bold text-primary">{fan.reputationPoints}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
