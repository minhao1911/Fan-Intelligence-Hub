import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFixtures, fetchStandings, type Match, type StandingGroup } from "@/lib/api";
import MatchCard from "@/components/MatchCard";
import MatchModal from "@/components/MatchModal";
import StandingsTable from "@/components/StandingsTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RefreshCw, Trophy, Search, Loader2, AlertCircle } from "lucide-react";

const STAGES: Record<string, string> = {
  "": "All Stages",
  "GROUP_STAGE": "Group Stage",
  "ROUND_OF_16": "Round of 16",
  "QUARTER_FINALS": "Quarter Finals",
  "SEMI_FINALS": "Semi Finals",
  "THIRD_PLACE": "Third Place",
  "FINAL": "Final",
};

export default function FixturesPage() {
  const [stage, setStage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["fixtures", stage],
    queryFn: () => fetchFixtures(stage ? { stage } : {}),
    staleTime: 60_000,
  });

  const { data: standings } = useQuery({
    queryKey: ["standings"],
    queryFn: fetchStandings,
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

  const groupStandings: StandingGroup[] =
    (standings?.standings ?? []).filter((s) => s.type === "TOTAL");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1a1a2e]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <h1 className="font-bold text-lg leading-none">FIFA World Cup 2026</h1>
              <p className="text-xs text-white/50">Live Fixtures & Standings</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search teams…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-yellow-400/50"
            />
          </div>
          <Select value={stage || "all"} onValueChange={(v) => setStage(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-52 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
              {Object.entries(STAGES).map(([val, label]) => (
                <SelectItem key={val || "all"} value={val || "all"} className="focus:bg-white/10">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">Failed to load fixtures</p>
              <p className="text-sm text-red-400/80 mt-0.5">{(error as Error)?.message}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/50">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            <p className="text-sm">Loading World Cup fixtures…</p>
          </div>
        )}

        {!isLoading && !isError && (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black rounded-lg text-sm px-3 py-1.5">
                All <span className="ml-1.5 text-xs opacity-70">{filtered.length}</span>
              </TabsTrigger>
              {live.length > 0 && (
                <TabsTrigger value="live" className="data-[state=active]:bg-green-400 data-[state=active]:text-black rounded-lg text-sm px-3 py-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                  Live <span className="ml-1 text-xs opacity-70">{live.length}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-400 data-[state=active]:text-black rounded-lg text-sm px-3 py-1.5">
                Upcoming <span className="ml-1.5 text-xs opacity-70">{upcoming.length}</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-white/80 data-[state=active]:text-black rounded-lg text-sm px-3 py-1.5">
                Results <span className="ml-1.5 text-xs opacity-70">{completed.length}</span>
              </TabsTrigger>
              {groupStandings.length > 0 && (
                <TabsTrigger value="standings" className="data-[state=active]:bg-purple-400 data-[state=active]:text-black rounded-lg text-sm px-3 py-1.5">
                  Standings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <MatchList matches={filtered} onSelect={setSelectedMatchId} />
            </TabsContent>
            <TabsContent value="live" className="mt-4">
              <MatchList matches={live} onSelect={setSelectedMatchId} />
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4">
              <MatchList matches={upcoming} onSelect={setSelectedMatchId} />
            </TabsContent>
            <TabsContent value="results" className="mt-4">
              <MatchList matches={completed} onSelect={setSelectedMatchId} />
            </TabsContent>
            <TabsContent value="standings" className="mt-4 space-y-4">
              {groupStandings.map((group) => (
                <StandingsTable key={group.group ?? group.stage} group={group} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {selectedMatchId && (
        <MatchModal matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />
      )}
    </div>
  );
}

function MatchList({ matches, onSelect }: { matches: Match[]; onSelect: (id: number) => void }) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-white/40">
        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No matches found</p>
      </div>
    );
  }

  const byDate = matches.reduce<Record<string, Match[]>>((acc, m) => {
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
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/40 font-medium uppercase tracking-wide px-2">{date}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid gap-2">
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} onClick={() => onSelect(m.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
