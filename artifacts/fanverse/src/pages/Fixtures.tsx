import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFixtures, getFixtureStandings, getFixtureDetail, stageName, formatKickoff, type Fixture, type StandingGroup } from "@/lib/fixtures";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Search, Trophy, MapPin, Calendar, Users, Loader2, AlertCircle, X } from "lucide-react";

const STAGE_OPTIONS = [
  { value: "all", label: "All Stages" },
  { value: "GROUP_STAGE", label: "Group Stage" },
  { value: "ROUND_OF_16", label: "Round of 16" },
  { value: "QUARTER_FINALS", label: "Quarter Finals" },
  { value: "SEMI_FINALS", label: "Semi Finals" },
  { value: "THIRD_PLACE", label: "3rd Place" },
  { value: "FINAL", label: "Final" },
];

export default function Fixtures() {
  const [stage, setStage] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["wc-fixtures", stage],
    queryFn: () => getFixtures(stage !== "all" ? { stage } : {}),
    staleTime: 60_000,
  });

  const { data: standings } = useQuery({
    queryKey: ["wc-standings"],
    queryFn: getFixtureStandings,
    staleTime: 5 * 60_000,
  });

  const matches = data?.matches ?? [];
  const filtered = matches.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.homeTeam.name.toLowerCase().includes(q) ||
      m.awayTeam.name.toLowerCase().includes(q) ||
      m.homeTeam.tla.toLowerCase().includes(q) ||
      m.awayTeam.tla.toLowerCase().includes(q)
    );
  });

  const live = filtered.filter((m) => m.status === "live");
  const upcoming = filtered.filter((m) => m.status === "upcoming");
  const completed = filtered.filter((m) => m.status === "completed");
  const groupStandings = (standings?.standings ?? []).filter((s) => s.type === "TOTAL");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Fixtures</h1>
          <p className="text-muted-foreground mt-1">
            Real-time FIFA World Cup 2026 fixtures, scores &amp; standings.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-1 p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-primary" : "text-muted-foreground"}`} />
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {isError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground">Failed to load fixtures</p>
              <p className="text-xs text-muted-foreground mt-0.5">{(error as Error)?.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading World Cup 2026 fixtures…</p>
        </div>
      )}

      {!isLoading && !isError && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-card border border-border p-1 mb-6 flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="all" className="font-heading uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All <span className="ml-1.5 font-mono opacity-70">{filtered.length}</span>
            </TabsTrigger>
            {live.length > 0 && (
              <TabsTrigger value="live" className="font-heading uppercase tracking-widest text-xs data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <span className="mr-1.5 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live <span className="ml-1 font-mono opacity-70">{live.length}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="upcoming" className="font-heading uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Upcoming <span className="ml-1.5 font-mono opacity-70">{upcoming.length}</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="font-heading uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Results <span className="ml-1.5 font-mono opacity-70">{completed.length}</span>
            </TabsTrigger>
            {groupStandings.length > 0 && (
              <TabsTrigger value="standings" className="font-heading uppercase tracking-widest text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Standings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all">
            <MatchList matches={filtered} onSelect={setSelectedId} />
          </TabsContent>
          <TabsContent value="live">
            <MatchList matches={live} onSelect={setSelectedId} />
          </TabsContent>
          <TabsContent value="upcoming">
            <MatchList matches={upcoming} onSelect={setSelectedId} />
          </TabsContent>
          <TabsContent value="results">
            <MatchList matches={completed} onSelect={setSelectedId} />
          </TabsContent>
          <TabsContent value="standings" className="space-y-4">
            {groupStandings.map((g) => (
              <GroupStandingsTable key={g.group ?? g.stage} group={g} />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {selectedId && (
        <FixtureDetailDialog matchId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function MatchList({ matches, onSelect }: { matches: Fixture[]; onSelect: (id: number) => void }) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No matches found</p>
      </div>
    );
  }

  const byDate = matches.reduce<Record<string, Fixture[]>>((acc, m) => {
    const d = new Date(m.utcDate).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
    });
    (acc[d] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(byDate).map(([date, dayMatches]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground font-heading uppercase tracking-widest">{date}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {dayMatches.map((m) => (
              <FixtureCard key={m.id} match={m} onClick={() => onSelect(m.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FixtureCard({ match, onClick }: { match: Fixture; onClick: () => void }) {
  const { homeTeam, awayTeam, score, status, utcDate, stage, group, matchday, minute } = match;
  const isLive = status === "live";
  const isDone = status === "completed";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border hover:border-primary/50 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/20">
        <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground">
          {group ?? stageName(stage)}{matchday ? ` · MD${matchday}` : ""}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live{minute ? ` ${minute}'` : ""}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground font-mono">
            {isDone ? "FT" : formatKickoff(utcDate)}
          </span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="px-4 py-4 flex items-center gap-3">
        <TeamBlock team={homeTeam} winner={score.winner === "HOME_TEAM"} loser={isDone && score.winner === "AWAY_TEAM"} />
        <div className="w-16 flex-shrink-0 text-center">
          {isDone || isLive ? (
            <span className={`text-2xl font-heading font-black tabular-nums ${isLive ? "text-primary" : "text-foreground"}`}>
              {score.home ?? 0}–{score.away ?? 0}
            </span>
          ) : (
            <span className="text-xs font-heading text-muted-foreground uppercase tracking-wider">vs</span>
          )}
        </div>
        <TeamBlock team={awayTeam} winner={score.winner === "AWAY_TEAM"} loser={isDone && score.winner === "HOME_TEAM"} flip />
      </div>
    </button>
  );
}

function TeamBlock({ team, winner, loser, flip = false }: { team: Fixture["homeTeam"]; winner: boolean; loser: boolean; flip?: boolean }) {
  return (
    <div className={`flex-1 flex items-center gap-2 ${flip ? "flex-row-reverse text-right" : ""}`}>
      {team.flagEmoji ? (
        <span className="text-2xl shrink-0 leading-none" role="img" aria-label={team.name}>{team.flagEmoji}</span>
      ) : team.crest ? (
        <img src={team.crest} alt={team.name} className="w-8 h-8 object-contain shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-heading font-bold shrink-0">
          {team.tla?.slice(0, 2)}
        </div>
      )}
      <span className={`font-heading font-bold text-sm truncate ${winner ? "text-primary" : loser ? "text-muted-foreground/60" : "text-foreground"}`}>
        {team.shortName}
      </span>
    </div>
  );
}

function FixtureDetailDialog({ matchId, onClose }: { matchId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["wc-fixture-detail", matchId],
    queryFn: () => getFixtureDetail(matchId),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-wider text-base">Match Details</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {/* Score */}
            <div className="bg-muted/30 rounded-xl p-5 text-center border border-border/50">
              <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-4">
                {data.group ?? stageName(data.stage)}
                {data.matchday ? ` · Matchday ${data.matchday}` : ""}
              </p>
              <div className="flex items-center justify-between gap-4">
                <DetailTeam team={data.homeTeam} />
                <div className="text-center">
                  {data.status === "upcoming" ? (
                    <div>
                      <p className="text-xl font-heading font-bold text-muted-foreground">vs</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatKickoff(data.utcDate)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className={`text-4xl font-heading font-black tabular-nums ${data.status === "live" ? "text-primary" : "text-foreground"}`}>
                        {data.score.home ?? 0}<span className="text-muted-foreground mx-1">–</span>{data.score.away ?? 0}
                      </p>
                      <p className="text-[10px] mt-1.5 font-heading uppercase tracking-widest">
                        {data.status === "live" ? (
                          <span className="text-red-500">● Live{data.minute ? ` ${data.minute}'` : ""}</span>
                        ) : (
                          <span className="text-muted-foreground">Full Time</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <DetailTeam team={data.awayTeam} />
              </div>
              {data.score.winner && (
                <p className="mt-3 text-xs font-heading uppercase tracking-wider text-primary">
                  {data.score.winner === "HOME_TEAM" ? `${data.homeTeam.shortName} Win`
                    : data.score.winner === "AWAY_TEAM" ? `${data.awayTeam.shortName} Win`
                    : "Draw"}
                </p>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-2.5">
              <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="Kickoff" value={formatKickoff(data.utcDate, true)} />
              {data.venue && <MetaRow icon={<MapPin className="w-3.5 h-3.5" />} label="Venue" value={data.venue} />}
              {data.referees[0] && <MetaRow icon={<Users className="w-3.5 h-3.5" />} label="Referee" value={data.referees[0]} />}
            </div>

            {/* H2H */}
            {data.head2head?.aggregates && (
              <div>
                <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-2">Head to Head</p>
                <div className="grid grid-cols-3 text-center bg-muted/20 rounded-lg p-3 border border-border/50">
                  <H2HStat label={data.homeTeam.tla} value={data.head2head.aggregates.homeTeam?.wins ?? 0} />
                  <H2HStat label="Draws" value={data.head2head.aggregates.homeTeam?.draws ?? 0} />
                  <H2HStat label={data.awayTeam.tla} value={data.head2head.aggregates.awayTeam?.wins ?? 0} />
                </div>
              </div>
            )}

            {/* Recent meetings */}
            {data.head2head?.matches?.length > 0 && (
              <div>
                <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-2">Recent Meetings</p>
                <div className="space-y-1.5">
                  {(data.head2head.matches as any[]).slice(0, 5).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2 text-xs border border-border/30">
                      <span className="text-muted-foreground truncate w-20">{m.homeTeam?.shortName ?? "?"}</span>
                      <span className="font-heading font-bold tabular-nums text-foreground">
                        {m.score?.fullTime?.home ?? "?"} – {m.score?.fullTime?.away ?? "?"}
                      </span>
                      <span className="text-muted-foreground truncate w-20 text-right">{m.awayTeam?.shortName ?? "?"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailTeam({ team }: { team: Fixture["homeTeam"] }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      {team.flagEmoji ? (
        <span className="text-4xl leading-none" role="img" aria-label={team.name}>{team.flagEmoji}</span>
      ) : team.crest ? (
        <img src={team.crest} alt={team.name} className="w-12 h-12 object-contain" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-heading font-bold">
          {team.tla}
        </div>
      )}
      <span className="text-xs font-heading font-bold text-center leading-tight">{team.shortName}</span>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="text-muted-foreground w-16 shrink-0 text-xs font-heading uppercase tracking-wide">{label}</span>
      <span className="text-foreground text-xs flex-1">{value}</span>
    </div>
  );
}

function H2HStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-heading font-black text-foreground">{value}</p>
      <p className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function GroupStandingsTable({ group }: { group: StandingGroup }) {
  const title = group.group ? group.group.replace(/_/g, " ") : stageName(group.stage);
  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/20">
        <h3 className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground border-b border-border/50">
              <th className="text-left px-4 py-2 w-5">#</th>
              <th className="text-left px-4 py-2">Team</th>
              <th className="text-center px-2 py-2">P</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-center px-2 py-2">GD</th>
              <th className="text-center px-2 py-2 text-primary">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.table.map((entry, i) => (
              <tr key={entry.team.id} className={`border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors ${i < 2 ? "border-l-2 border-l-primary/50" : ""}`}>
                <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">{entry.position}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {entry.team.crest ? (
                      <img src={entry.team.crest} alt={entry.team.name} className="w-5 h-5 object-contain shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-heading font-bold">
                        {entry.team.tla?.slice(0, 2)}
                      </div>
                    )}
                    <span className="font-medium text-foreground truncate max-w-[7rem]">{entry.team.shortName}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-2.5 text-muted-foreground font-mono text-xs">{entry.playedGames}</td>
                <td className="text-center px-2 py-2.5 text-muted-foreground font-mono text-xs">{entry.won}</td>
                <td className="text-center px-2 py-2.5 text-muted-foreground font-mono text-xs">{entry.draw}</td>
                <td className="text-center px-2 py-2.5 text-muted-foreground font-mono text-xs">{entry.lost}</td>
                <td className="text-center px-2 py-2.5 font-mono text-xs">
                  <span className={entry.goalDifference > 0 ? "text-emerald-500" : entry.goalDifference < 0 ? "text-destructive" : "text-muted-foreground"}>
                    {entry.goalDifference > 0 ? "+" : ""}{entry.goalDifference}
                  </span>
                </td>
                <td className="text-center px-2 py-2.5 font-heading font-bold text-primary">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
