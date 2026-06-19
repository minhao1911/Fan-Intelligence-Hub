import { useState, useMemo } from "react";
import { useGetLeaderboard, useListNations } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trophy, Medal, Award, Search, Crown, Zap, Activity, ThumbsUp } from "lucide-react";
import type { LeaderboardEntry } from "@workspace/api-client-react";

const TIERS = ["All", "Casual", "Fan", "Capo", "Ultras"] as const;
type TierFilter = typeof TIERS[number];

const TIER_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  Casual:  { bg: "bg-slate-400/10",   text: "text-slate-300",   ring: "ring-slate-400/30" },
  Fan:     { bg: "bg-sky-400/10",     text: "text-sky-300",     ring: "ring-sky-400/30"   },
  Capo:    { bg: "bg-violet-400/10",  text: "text-violet-300",  ring: "ring-violet-400/30"},
  Ultras:  { bg: "bg-primary/10",     text: "text-primary",     ring: "ring-primary/40"   },
};

const RANK_META: Record<number, { icon: React.ReactNode; glow: string; label: string }> = {
  1: { icon: <Crown className="h-5 w-5 text-yellow-400" />, glow: "shadow-[0_0_24px_rgba(250,204,21,0.2)]", label: "Gold" },
  2: { icon: <Medal className="h-5 w-5 text-slate-300" />,  glow: "shadow-[0_0_16px_rgba(148,163,184,0.15)]", label: "Silver" },
  3: { icon: <Award className="h-5 w-5 text-amber-600" />,  glow: "shadow-[0_0_16px_rgba(180,83,9,0.15)]",   label: "Bronze" },
};

export default function Leaderboard() {
  const [selectedNation, setSelectedNation] = useState<string>("all");
  const [tierFilter, setTierFilter]         = useState<TierFilter>("All");
  const [search, setSearch]                 = useState("");

  const { data: raw, isLoading } = useGetLeaderboard({
    limit: 100,
    nationCode: selectedNation === "all" ? undefined : selectedNation,
  });

  const { data: nations } = useListNations({});

  // Client-side tier + search filter
  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    if (!raw) return [];
    return raw.filter((e) => {
      const tierOk = tierFilter === "All" || e.user.reputationTier === tierFilter;
      const q = search.trim().toLowerCase();
      const searchOk = !q || e.user.username.toLowerCase().includes(q) || (e.user.nationCode ?? "").toLowerCase().includes(q);
      return tierOk && searchOk;
    });
  }, [raw, tierFilter, search]);

  const top3 = leaderboard.slice(0, 3);
  const rest  = leaderboard.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-heading font-black uppercase tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          Fan Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Top contributors ranked by reputation. Earn points by voting, discussing, and predicting.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search fans…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-card border-border text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>

        {/* Nation select */}
        <Select value={selectedNation} onValueChange={setSelectedNation}>
          <SelectTrigger className="w-full sm:w-48 h-9 bg-card border-border text-foreground text-sm">
            <SelectValue placeholder="All Nations" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground max-h-72">
            <SelectItem value="all" className="focus:bg-muted/60">🌍 All Nations</SelectItem>
            {nations?.map((n) => (
              <SelectItem key={n.code} value={n.code} className="focus:bg-muted/60">
                {n.flagEmoji} {n.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tier tab pills */}
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1 w-fit flex-wrap">
        {TIERS.map((tier) => {
          const isActive = tierFilter === tier;
          const s = tier !== "All" ? TIER_STYLES[tier] : null;
          return (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                isActive
                  ? tier === "All"
                    ? "bg-primary text-black shadow-[0_0_14px_rgba(250,204,21,0.2)]"
                    : `${s!.bg} ${s!.text} ring-1 ${s!.ring}`
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tier}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-card border border-border" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && leaderboard.length === 0 && (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground text-sm">No fans ranked yet.</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && leaderboard.length > 0 && (
        <div className="space-y-6">

          {/* ── Podium ───────────────────────────────────── */}
          {top3.length >= 3 && !search && tierFilter === "All" && (
            <div className="grid grid-cols-3 gap-3 items-end">
              {/* Silver - 2nd */}
              <PodiumCard entry={top3[1]} rank={2} height="h-36" nations={nations} />
              {/* Gold - 1st */}
              <PodiumCard entry={top3[0]} rank={1} height="h-44" nations={nations} featured />
              {/* Bronze - 3rd */}
              <PodiumCard entry={top3[2]} rank={3} height="h-28" nations={nations} />
            </div>
          )}

          {/* ── Full table ───────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Column headers */}
            <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 md:col-span-5">Fan</div>
              <div className="col-span-3 md:col-span-2">Tier</div>
              <div className="hidden md:block col-span-2 text-right">Points</div>
              <div className="hidden md:block col-span-2 text-right">Activity</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/40">
              {leaderboard.map((entry) => {
                const nation = nations?.find((n) => n.code === entry.user.nationCode);
                const rank = entry.rank;
                const meta = RANK_META[rank];
                return (
                  <div
                    key={entry.user.id}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors hover:bg-muted/10 ${
                      rank === 1 ? "bg-yellow-400/[0.03]" : rank <= 3 ? "bg-primary/[0.02]" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex justify-center">
                      {meta ? (
                        meta.icon
                      ) : (
                        <span className="font-mono text-sm font-bold text-muted-foreground/60 tabular-nums">{rank}</span>
                      )}
                    </div>

                    {/* Fan */}
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar className={`h-8 w-8 border ${rank <= 3 ? "border-primary/30" : "border-border"}`}>
                          <AvatarImage src={entry.user.avatarUrl || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-heading text-[10px]">
                            {entry.user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${rank === 1 ? "text-primary" : "text-foreground"}`}>
                          {entry.user.username}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {nation && <span className="leading-none">{nation.flagEmoji}</span>}
                          <span className="uppercase tracking-wide">{entry.user.nationCode || "Global"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tier */}
                    <div className="col-span-3 md:col-span-2">
                      <ReputationBadge tier={entry.user.reputationTier} size="sm" />
                    </div>

                    {/* Points */}
                    <div className="hidden md:flex col-span-2 justify-end items-center gap-1">
                      <Zap className="h-3 w-3 text-primary/60 shrink-0" />
                      <span className={`font-mono font-bold text-sm tabular-nums ${rank === 1 ? "text-primary" : "text-foreground"}`}>
                        {entry.user.reputationPoints.toLocaleString()}
                      </span>
                    </div>

                    {/* Activity */}
                    <div className="hidden md:flex col-span-2 justify-end items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Activity className="h-3 w-3" />{entry.totalVotes}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="h-3 w-3" />{entry.totalReactions}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer count */}
            <div className="px-4 py-2.5 border-t border-border/40 bg-muted/10 text-[10px] text-muted-foreground font-medium text-right">
              Showing {leaderboard.length} fan{leaderboard.length !== 1 ? "s" : ""}
              {selectedNation !== "all" && ` · ${nations?.find((n) => n.code === selectedNation)?.name ?? selectedNation}`}
              {tierFilter !== "All" && ` · ${tierFilter} tier`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PodiumCard({
  entry, rank, height, nations, featured,
}: {
  entry: LeaderboardEntry;
  rank: number;
  height: string;
  nations: Array<{ code: string; flagEmoji: string; name: string }> | undefined;
  featured?: boolean;
}) {
  const meta = RANK_META[rank];
  const nation = nations?.find((n) => n.code === entry.user.nationCode);

  return (
    <div
      className={`relative flex flex-col items-center justify-end rounded-2xl border p-4 pb-5 ${height} overflow-hidden transition-all ${
        featured
          ? `bg-primary/5 border-primary/25 ${meta.glow}`
          : "bg-card border-border"
      }`}
    >
      {featured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      <div className="flex flex-col items-center gap-1.5 z-10 w-full">
        <div className="mb-1">{meta.icon}</div>

        <Avatar className={`border-2 ${featured ? "h-12 w-12 border-primary/40" : "h-10 w-10 border-border"}`}>
          <AvatarImage src={entry.user.avatarUrl || undefined} />
          <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xs">
            {entry.user.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {nation && (
          <span className="text-base leading-none" title={nation.name}>{nation.flagEmoji}</span>
        )}

        <p className={`font-bold text-center truncate w-full text-xs leading-tight ${featured ? "text-foreground" : "text-muted-foreground"}`}>
          {entry.user.username}
        </p>

        <p className={`font-mono font-black tabular-nums leading-none ${featured ? "text-primary text-base" : "text-sm text-muted-foreground"}`}>
          {entry.user.reputationPoints.toLocaleString()}
        </p>
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">pts</p>
      </div>
    </div>
  );
}
