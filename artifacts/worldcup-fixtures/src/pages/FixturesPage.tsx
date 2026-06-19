import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFixtures, fetchStandings, type Match, type StandingGroup } from "@/lib/api";
import MatchCard from "@/components/MatchCard";
import MatchModal from "@/components/MatchModal";
import StandingsTable from "@/components/StandingsTable";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trophy, Search, Loader2, AlertCircle, Flame, Clock, CheckCircle2, BarChart3 } from "lucide-react";

const STAGES: Record<string, string> = {
  "": "All Stages",
  "GROUP_STAGE": "Group Stage",
  "ROUND_OF_16": "Round of 16",
  "QUARTER_FINALS": "Quarter Finals",
  "SEMI_FINALS": "Semi Finals",
  "THIRD_PLACE": "Third Place",
  "FINAL": "Final",
};

const TABS = [
  { id: "all",       label: "All",       icon: null },
  { id: "live",      label: "Live",      icon: Flame },
  { id: "upcoming",  label: "Upcoming",  icon: Clock },
  { id: "results",   label: "Results",   icon: CheckCircle2 },
  { id: "standings", label: "Standings", icon: BarChart3 },
] as const;

type TabId = typeof TABS[number]["id"];

export default function FixturesPage() {
  const [stage, setStage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("all");

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

  const live      = filtered.filter((m) => m.status === "live");
  const upcoming  = filtered.filter((m) => m.status === "upcoming");
  const completed = filtered.filter((m) => m.status === "completed");

  const groupStandings: StandingGroup[] =
    (standings?.standings ?? []).filter((s) => s.type === "TOTAL");

  const counts: Record<TabId, number> = {
    all: filtered.length,
    live: live.length,
    upcoming: upcoming.length,
    results: completed.length,
    standings: groupStandings.length,
  };

  const tabMatches: Record<TabId, Match[]> = {
    all: filtered,
    live,
    upcoming,
    results: completed,
    standings: [],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1117] via-[#13182a] to-[#0f1117] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f1117]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h1 className="font-black text-base leading-none tracking-tight">FIFA World Cup 2026</h1>
              <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-widest font-medium">Fixtures & Standings</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-all text-xs text-white/50 hover:text-white/80 disabled:opacity-40"
            title="Refresh"
          >
            <svg className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isFetching ? "Updating…" : "Refresh"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            <Input
              placeholder="Search teams…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-yellow-400/40 text-sm"
            />
          </div>
          <Select value={stage || "all"} onValueChange={(v) => setStage(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-44 h-9 bg-white/[0.04] border-white/[0.08] text-white text-sm">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent className="bg-[#13182a] border-white/10 text-white">
              {Object.entries(STAGES).map(([val, label]) => (
                <SelectItem key={val || "all"} value={val || "all"} className="focus:bg-white/10 text-sm">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-xl p-4 text-red-300/80">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load fixtures</p>
              <p className="text-xs text-red-400/60 mt-0.5">{(error as Error)?.message}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[4.5rem] rounded-xl bg-white/[0.04] border border-white/[0.04]" />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div>
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-4 overflow-x-auto scrollbar-none">
              {TABS.map(({ id, label, icon: Icon }) => {
                if (id === "live" && live.length === 0) return null;
                if (id === "standings" && groupStandings.length === 0) return null;
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.25)]"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                    }`}
                  >
                    {id === "live" && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-black" : "bg-green-400"} animate-pulse shrink-0`} />
                    )}
                    {Icon && id !== "live" && <Icon className="w-3 h-3 shrink-0" />}
                    {label}
                    <span className={`font-mono text-[10px] ${isActive ? "opacity-60" : "opacity-40"}`}>
                      {counts[id]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === "standings" ? (
              <div className="space-y-3">
                {groupStandings.map((group) => (
                  <StandingsTable key={group.group ?? group.stage} group={group} />
                ))}
              </div>
            ) : (
              <MatchList matches={tabMatches[activeTab]} onSelect={setSelectedMatchId} />
            )}
          </div>
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
      <div className="text-center py-20 text-white/20">
        <Trophy className="w-8 h-8 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No matches found</p>
      </div>
    );
  }

  const byDate = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const d = new Date(m.utcDate).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
    });
    (acc[d] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(byDate).map(([date, dayMatches]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[10px] text-white/25 font-bold uppercase tracking-widest">{date}</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="grid gap-1.5">
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} onClick={() => onSelect(m.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
