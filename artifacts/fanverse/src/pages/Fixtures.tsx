import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFixtures, getFixtureStandings, getFixtureDetail, stageName, formatKickoff, type Fixture, type StandingGroup } from "@/lib/fixtures";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Search, Trophy, MapPin, Calendar, Users, Loader2, AlertCircle } from "lucide-react";

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

  const live      = filtered.filter((m) => m.status === "live");
  const upcoming  = filtered.filter((m) => m.status === "upcoming");
  const completed = filtered.filter((m) => m.status === "completed");
  const groupStandings = (standings?.standings ?? []).filter((s) => s.type === "TOTAL");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Hero Header ─────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative px-6 py-7 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-heading font-bold uppercase text-foreground tracking-tight">Fixtures</h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1">FIFA World Cup 2026 — group stage fixtures, scores &amp; standings.</p>
            {!isLoading && (
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                {live.length > 0 && (
                  <span className="flex items-center gap-1.5 text-red-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {live.length} Live
                  </span>
                )}
                <span><strong className="text-foreground">{upcoming.length}</strong> upcoming</span>
                <span><strong className="text-foreground">{completed.length}</strong> played</span>
              </div>
            )}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-1 p-2.5 rounded-xl hover:bg-muted transition-colors disabled:opacity-40 border border-border/50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-primary" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search teams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Error ───────────────────────────────────────── */}
      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-destructive/30 bg-destructive/8">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-sm text-foreground">Failed to load fixtures</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(error as Error)?.message}</p>
          </div>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading World Cup 2026 fixtures…</p>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-card border border-border/60 p-1 mb-6 flex flex-wrap gap-1 h-auto rounded-xl">
            <TabsTrigger value="all" className="font-heading uppercase tracking-widest text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              All <span className="ml-1.5 font-mono opacity-70">{filtered.length}</span>
            </TabsTrigger>
            {live.length > 0 && (
              <TabsTrigger value="live" className="font-heading uppercase tracking-widest text-xs rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <span className="mr-1.5 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse data-[state=active]:bg-white" />
                Live <span className="ml-1 font-mono opacity-70">{live.length}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="upcoming" className="font-heading uppercase tracking-widest text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              Upcoming <span className="ml-1.5 font-mono opacity-70">{upcoming.length}</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="font-heading uppercase tracking-widest text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              Results <span className="ml-1.5 font-mono opacity-70">{completed.length}</span>
            </TabsTrigger>
            {groupStandings.length > 0 && (
              <TabsTrigger value="standings" className="font-heading uppercase tracking-widest text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                Standings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all"><MatchList matches={filtered} onSelect={setSelectedId} /></TabsContent>
          <TabsContent value="live"><MatchList matches={live} onSelect={setSelectedId} /></TabsContent>
          <TabsContent value="upcoming"><MatchList matches={upcoming} onSelect={setSelectedId} /></TabsContent>
          <TabsContent value="results"><MatchList matches={completed} onSelect={setSelectedId} /></TabsContent>
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
      <div className="text-center py-20 text-muted-foreground border border-dashed border-border/50 rounded-2xl">
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
    <div className="space-y-8">
      {Object.entries(byDate).map(([date, dayMatches]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-widest px-3 py-1 rounded-full border border-border/50 bg-muted/30">
              {date}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
      className={`w-full text-left rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group ${
        isLive
          ? "border-red-500/30 bg-card hover:border-red-500/50 hover:shadow-red-500/8"
          : "border-border/60 bg-card hover:border-primary/40 hover:shadow-primary/8"
      }`}
    >
      {/* Live indicator bar */}
      {isLive && <div className="h-0.5 w-full bg-gradient-to-r from-red-500/80 to-transparent" />}
      {!isLive && <div className="h-0.5 w-full bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />}

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/40 bg-muted/10">
        <span className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground">
          {group ?? stageName(stage)}{matchday ? ` · MD${matchday}` : ""}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase">
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
            <span className={`text-2xl font-heading font-black tabular-nums ${isLive ? "text-red-500" : "text-foreground"}`}>
              {score.home ?? 0}–{score.away ?? 0}
            </span>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">vs</span>
            </div>
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
        <span className="text-2xl shrink-0 leading-none drop-shadow-sm" role="img" aria-label={team.name}>{team.flagEmoji}</span>
      ) : team.crest ? (
        <img src={team.crest} alt={team.name} className="w-8 h-8 object-contain shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-heading font-bold shrink-0">
          {team.tla?.slice(0, 2)}
        </div>
      )}
      <span className={`font-heading font-bold text-sm truncate ${winner ? "text-primary" : loser ? "text-muted-foreground/50" : "text-foreground"}`}>
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
      <DialogContent className="max-w-lg bg-card border-border/60 rounded-2xl">
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
            {/* Score panel */}
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-b from-muted/30 to-muted/10 p-5 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-4 relative">
                {data.group ?? stageName(data.stage)}
                {data.matchday ? ` · Matchday ${data.matchday}` : ""}
              </p>
              <div className="flex items-center justify-between gap-4 relative">
                <DetailTeam team={data.homeTeam} />
                <div className="text-center shrink-0">
                  {data.status === "upcoming" ? (
                    <div>
                      <p className="text-2xl font-heading font-bold text-muted-foreground">vs</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatKickoff(data.utcDate)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className={`text-4xl font-heading font-black tabular-nums ${data.status === "live" ? "text-red-500" : "text-foreground"}`}>
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
                <p className="mt-3 text-xs font-heading uppercase tracking-wider text-primary relative">
                  {data.score.winner === "HOME_TEAM" ? `${data.homeTeam.shortName} Win`
                    : data.score.winner === "AWAY_TEAM" ? `${data.awayTeam.shortName} Win`
                    : "Draw"}
                </p>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-2.5 bg-muted/20 rounded-xl p-4 border border-border/40">
              <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="Kickoff" value={formatKickoff(data.utcDate, true)} />
              {data.venue && <MetaRow icon={<MapPin className="w-3.5 h-3.5" />} label="Venue" value={data.venue} />}
              {data.referees[0] && <MetaRow icon={<Users className="w-3.5 h-3.5" />} label="Referee" value={data.referees[0]} />}
            </div>

            {/* H2H */}
            {data.head2head?.aggregates && (
              <div>
                <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-2">Head to Head</p>
                <div className="grid grid-cols-3 text-center bg-muted/20 rounded-xl p-3 border border-border/40">
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
        <span className="text-4xl leading-none drop-shadow-sm" role="img" aria-label={team.name}>{team.flagEmoji}</span>
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
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/8 to-transparent flex items-center gap-2">
        <Trophy className="h-3 w-3 text-primary" />
        <h3 className="text-[10px] font-heading uppercase tracking-widest text-foreground font-bold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground border-b border-border/40">
              <th className="text-left px-4 py-2.5 w-5">#</th>
              <th className="text-left px-4 py-2.5">Team</th>
              <th className="text-center px-2 py-2.5">P</th>
              <th className="text-center px-2 py-2.5">W</th>
              <th className="text-center px-2 py-2.5">D</th>
              <th className="text-center px-2 py-2.5">L</th>
              <th className="text-center px-2 py-2.5">GD</th>
              <th className="text-center px-2 py-2.5 text-primary">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.table.map((entry, i) => (
              <tr key={entry.team.id} className={`border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors ${i < 2 ? "border-l-2 border-l-primary/60" : "border-l-2 border-l-transparent"}`}>
                <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">{entry.position}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {entry.team.flagEmoji ? (
                      <span className="text-base leading-none shrink-0" role="img" aria-label={entry.team.name}>{entry.team.flagEmoji}</span>
                    ) : entry.team.crest ? (
                      <img src={entry.team.crest} alt={entry.team.name} className="w-5 h-5 object-contain shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-heading font-bold">
                        {entry.team.tla?.slice(0, 2)}
                      </div>
                    )}
                    <span className="font-medium text-foreground truncate max-w-[7rem] text-sm">{entry.team.shortName}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-2.5 text-muted-foreground font-mono text-xs">{entry.playedGames}</td>
                <td className="text-center px-2 py-2.5 text-muted-foreground font-mono text-xs">{entry.won}</td>
                <td className="text-center px-2 py-2.5 text-muted-foreground font-mono text-xs">{entry.draw}</td>
                <td className="text-center px-2 py-2.5 text-muted-foreground font-mono text-xs">{entry.lost}</td>
                <td className="text-center px-2 py-2.5 font-mono text-xs">
                  <span className={entry.goalDifference > 0 ? "text-emerald-500" : entry.goalDifference < 0 ? "text-red-400" : "text-muted-foreground"}>
                    {entry.goalDifference > 0 ? "+" : ""}{entry.goalDifference}
                  </span>
                </td>
                <td className="text-center px-2 py-2.5 font-heading font-bold text-primary">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
