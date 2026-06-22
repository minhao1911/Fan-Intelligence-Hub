import { useState, useMemo, useRef, useEffect } from "react";
import { useGetLeaderboard, useListNations, useListMatches, getListMatchesQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import { FounderBadge, PremiumBadge } from "@/components/ui/UserBadges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Trophy, Medal, Award, Search, Crown, Zap, Activity,
  ThumbsUp, TrendingUp, TrendingDown, Minus, Radio, Target,
  CheckCircle2, Crosshair, ChevronRight,
} from "lucide-react";
import type { LeaderboardEntry } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";

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

// ── Prediction leaderboard types & hook ───────────────────────────────────────
type PredictionEntry = {
  rank: number;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
    nationCode: string | null;
    nationFlag: string | null;
    reputationPoints: number;
  };
  totalPredictions: number;
  correctOutcomes: number;
  exactScores: number;
  outcomeAccuracy: number;
  exactAccuracy: number;
};

function usePredictionLeaderboard() {
  return useQuery<PredictionEntry[]>({
    queryKey: ["stats-prediction-leaderboard"],
    queryFn: async () => {
      const r = await fetch(`${getBaseUrl()}api/stats/prediction-leaderboard`, {
        
      });
      if (!r.ok) throw new Error("Failed to load prediction leaderboard");
      return r.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ── Animated XP counter ───────────────────────────────────────────────────────
function AnimatedXP({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return <>{displayed.toLocaleString()}</>;
}

// ── Rank delta badge ──────────────────────────────────────────────────────────
function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  if (delta === 0) return <Minus className="h-2.5 w-2.5 text-muted-foreground/40" />;
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 leading-none">
      <TrendingUp className="h-2.5 w-2.5" />+{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-400 leading-none">
      <TrendingDown className="h-2.5 w-2.5" />{delta}
    </span>
  );
}

// ── Accuracy ring ─────────────────────────────────────────────────────────────
function AccuracyRing({ pct, color }: { pct: number; color: string }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="36" height="36" className="rotate-[-90deg]">
      <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-muted/40" />
      <circle
        cx="18" cy="18" r={r} fill="none" strokeWidth="3"
        stroke={color}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

export default function Leaderboard() {
  const [activeTab, setActiveTab]           = useState<"reputation" | "predictors">("reputation");
  const [selectedNation, setSelectedNation] = useState<string>("all");
  const [tierFilter, setTierFilter]         = useState<TierFilter>("All");
  const [search, setSearch]                 = useState("");
  const [flashedIds, setFlashedIds]         = useState<Set<string>>(new Set());

  // Check for live matches to decide polling speed
  const liveMatchParams = { status: "live", limit: 1 } as const;
  const { data: liveMatches } = useListMatches(
    liveMatchParams,
    { query: { queryKey: getListMatchesQueryKey(liveMatchParams), refetchInterval: 10_000 } }
  );
  const hasLive = Array.isArray(liveMatches) && liveMatches.length > 0;

  // Fast poll when live, slow otherwise
  const leaderboardParams = { limit: 100, nationCode: selectedNation === "all" ? undefined : selectedNation };
  const { data: raw, isLoading, dataUpdatedAt } = useGetLeaderboard(
    leaderboardParams,
    { query: { queryKey: getGetLeaderboardQueryKey(leaderboardParams), refetchInterval: hasLive ? 4_000 : 30_000 } }
  );

  const { data: nations } = useListNations({});
  const { data: predictionData, isLoading: predLoading } = usePredictionLeaderboard();

  // Track previous snapshot: userId → { rank, xp }
  const prevSnapshot = useRef<Map<string, { rank: number; xp: number }>>(new Map());
  const isFirstFetch = useRef(true);

  // Compute per-entry rank delta and XP gained, detect changes for flash
  const enriched = useMemo(() => {
    if (!raw) return [];
    const prev = prevSnapshot.current;
    const changed: string[] = [];

    const result = raw.map((e, idx) => {
      const id = String(e.user.id);
      const prevEntry = prev.get(id);
      const currentRank = idx + 1;
      const delta = prevEntry && !isFirstFetch.current
        ? prevEntry.rank - currentRank
        : null;
      const xpGained = prevEntry && !isFirstFetch.current && e.user.reputationPoints > prevEntry.xp
        ? e.user.reputationPoints - prevEntry.xp
        : null;

      if (xpGained && xpGained > 0) changed.push(id);
      return { ...e, rank: currentRank, delta, xpGained };
    });

    // Update snapshot
    const newSnap = new Map<string, { rank: number; xp: number }>();
    result.forEach((e) => newSnap.set(String(e.user.id), { rank: e.rank, xp: e.user.reputationPoints }));

    if (!isFirstFetch.current && changed.length > 0) {
      setFlashedIds(new Set(changed));
      setTimeout(() => setFlashedIds(new Set()), 2000);
    }

    prevSnapshot.current = newSnap;
    isFirstFetch.current = false;

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, dataUpdatedAt]);

  // Client-side tier + search filter
  const leaderboard = useMemo(() => {
    return enriched.filter((e) => {
      const tierOk = tierFilter === "All" || e.user.reputationTier === tierFilter;
      const q = search.trim().toLowerCase();
      const searchOk = !q || e.user.username.toLowerCase().includes(q) || (e.user.nationCode ?? "").toLowerCase().includes(q);
      return tierOk && searchOk;
    });
  }, [enriched, tierFilter, search]);

  const top3 = leaderboard.slice(0, 3);
  const rest  = leaderboard.slice(3);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-heading font-black uppercase tracking-tight text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            Fan Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Top contributors ranked by reputation. Earn points by voting, discussing, and predicting.
          </p>
        </div>

        {/* Live indicator */}
        {hasLive && activeTab === "reputation" && (
          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <Radio className="h-3 w-3 text-red-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Live updates</span>
            </div>
            {lastUpdated && (
              <span className="text-[9px] text-muted-foreground">Updated {lastUpdated}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("reputation")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === "reputation"
              ? "bg-primary text-black shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          Fan Rankings
        </button>
        <button
          onClick={() => setActiveTab("predictors")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === "predictors"
              ? "bg-violet-500 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          Predictors
        </button>
      </div>

      {/* ── Predictors tab ───────────────────────────────────────────────────── */}
      {activeTab === "predictors" && (
        <PredictionLeaderboard entries={predictionData ?? []} isLoading={predLoading} />
      )}

      {/* ── Reputation tab ───────────────────────────────────────────────────── */}
      {activeTab === "reputation" && (
        <>
          {/* XP event banner — shows when XP was just awarded */}
          {flashedIds.size > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/8 px-4 py-2.5 flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300">
              <Zap className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-bold text-primary">
                XP just awarded — {flashedIds.size} fan{flashedIds.size !== 1 ? "s" : ""} moved up the rankings!
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search fans…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-card border-border text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>

            <Select value={selectedNation} onValueChange={setSelectedNation}>
              <SelectTrigger className="w-full sm:w-48 h-9 bg-card border-border text-foreground text-sm">
                <SelectValue placeholder="All Nations" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground max-h-72">
                <SelectItem value="all" className="focus:bg-muted/60">🌍 All Nations</SelectItem>
                {Array.isArray(nations) && nations.map((n) => (
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
                  <PodiumCard entry={top3[1]} rank={2} height="h-36" nations={nations} flashed={flashedIds.has(String(top3[1].user.id))} />
                  <PodiumCard entry={top3[0]} rank={1} height="h-44" nations={nations} featured flashed={flashedIds.has(String(top3[0].user.id))} />
                  <PodiumCard entry={top3[2]} rank={3} height="h-28" nations={nations} flashed={flashedIds.has(String(top3[2].user.id))} />
                </div>
              )}

              {/* ── Full table ───────────────────────────────── */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Column headers */}
                <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5 md:col-span-4">Fan</div>
                  <div className="col-span-3 md:col-span-2">Tier</div>
                  <div className="hidden md:block col-span-2 text-right">Pts</div>
                  <div className="hidden md:block col-span-2 text-right">Change</div>
                  <div className="hidden md:block col-span-1 text-right">Activity</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-border/40">
                  {leaderboard.map((entry) => {
                    const nation = Array.isArray(nations) ? nations.find((n) => n.code === entry.user.nationCode) : undefined;
                    const rank = entry.rank;
                    const meta = RANK_META[rank];
                    const flashed = flashedIds.has(String(entry.user.id));
                    return (
                      <div
                        key={entry.user.id}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-all duration-700 ${
                          flashed
                            ? "bg-primary/10 border-l-2 border-primary"
                            : rank === 1
                            ? "bg-yellow-400/[0.03]"
                            : rank <= 3
                            ? "bg-primary/[0.02]"
                            : "hover:bg-muted/10"
                        }`}
                      >
                        {/* Rank */}
                        <div className="col-span-1 flex flex-col items-center gap-0.5">
                          {meta ? (
                            meta.icon
                          ) : (
                            <span className="font-mono text-sm font-bold text-muted-foreground/60 tabular-nums">{rank}</span>
                          )}
                          <RankDelta delta={entry.delta ?? null} />
                        </div>

                        {/* Fan */}
                        <div className="col-span-5 md:col-span-4 flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <Avatar className={`h-8 w-8 border transition-all duration-700 ${
                              (entry.user as any).isFounder ? "border-yellow-400/50 ring-1 ring-yellow-400/40"
                              : flashed ? "border-primary/60 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                              : (entry.user as any).isPremium ? "border-violet-500/40 ring-1 ring-violet-500/30"
                              : rank <= 3 ? "border-primary/30" : "border-border"
                            }`}>
                              <AvatarImage src={entry.user.avatarUrl || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground font-heading text-[10px]">
                                {entry.user.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {(entry.user as any).isFounder && (
                              <span className="absolute -top-1.5 -right-1.5 text-[9px]" title={`Founder #${(entry.user as any).founderNumber}`}>👑</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`text-sm font-bold truncate ${rank === 1 ? "text-primary" : "text-foreground"}`}>
                                {entry.user.username}
                              </p>
                              {(entry.user as any).isFounder && (
                                <FounderBadge founderNumber={(entry.user as any).founderNumber} size="xs" />
                              )}
                              {!(entry.user as any).isFounder && (entry.user as any).isPremium && (
                                <PremiumBadge size="xs" />
                              )}
                            </div>
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

                        {/* Points — animated */}
                        <div className="hidden md:flex col-span-2 justify-end items-center gap-1">
                          <Zap className={`h-3 w-3 shrink-0 transition-colors ${flashed ? "text-primary" : "text-primary/60"}`} />
                          <span className={`font-mono font-bold text-sm tabular-nums transition-colors ${rank === 1 ? "text-primary" : flashed ? "text-primary" : "text-foreground"}`}>
                            <AnimatedXP value={entry.user.reputationPoints} />
                          </span>
                        </div>

                        {/* XP gained badge */}
                        <div className="hidden md:flex col-span-2 justify-end items-center gap-1.5">
                          {entry.xpGained && entry.xpGained > 0 ? (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold animate-in zoom-in-75 duration-300">
                              <Zap className="h-2.5 w-2.5" />+{entry.xpGained}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Activity className="h-3 w-3" />{entry.totalVotes}
                              <ThumbsUp className="h-3 w-3 ml-1" />{entry.totalReactions}
                            </span>
                          )}
                        </div>

                        {/* Mobile XP */}
                        <div className="md:hidden col-span-4 flex justify-end items-center gap-1">
                          <Zap className="h-3 w-3 text-primary/60 shrink-0" />
                          <span className="font-mono font-bold text-xs tabular-nums text-foreground">
                            <AnimatedXP value={entry.user.reputationPoints} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border/40 bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span>
                    {hasLive
                      ? "Refreshing every 4s · live match active"
                      : "Refreshing every 30s"}
                  </span>
                  <span>
                    Showing {leaderboard.length} fan{leaderboard.length !== 1 ? "s" : ""}
                    {selectedNation !== "all" && ` · ${Array.isArray(nations) ? nations.find((n) => n.code === selectedNation)?.name ?? selectedNation : selectedNation}`}
                    {tierFilter !== "All" && ` · ${tierFilter} tier`}
                  </span>
                </div>
              </div>

              {rest.length > 0 && null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Prediction leaderboard component ─────────────────────────────────────────
function PredictionLeaderboard({ entries, isLoading }: { entries: PredictionEntry[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? entries.filter((e) => e.user.username.toLowerCase().includes(search.toLowerCase()))
    : entries;

  const PRED_RANK_META: Record<number, { icon: React.ReactNode }> = {
    1: { icon: <Crown className="h-4 w-4 text-yellow-400" /> },
    2: { icon: <Medal className="h-4 w-4 text-slate-300" /> },
    3: { icon: <Award className="h-4 w-4 text-amber-600" /> },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Explainer */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex gap-3 items-start">
        <Target className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">Prediction Accuracy Ranking</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ranked by <span className="text-violet-400 font-semibold">exact score predictions</span> on completed matches, then by correct outcome %. Only fans who have predicted at least one completed match appear here.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search predictors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 bg-card border-border text-foreground placeholder:text-muted-foreground text-sm"
        />
      </div>

      {/* Top 3 accuracy cards */}
      {!isLoading && !search && filtered.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[filtered[1], filtered[0], filtered[2]].map((entry, pos) => {
            const actualRank = pos === 0 ? 2 : pos === 1 ? 1 : 3;
            const isFeatured = actualRank === 1;
            return (
              <div
                key={entry.user.id}
                className={`relative rounded-2xl border p-4 flex flex-col items-center gap-2 text-center overflow-hidden ${
                  isFeatured
                    ? "border-violet-500/30 bg-violet-500/5 shadow-[0_0_24px_rgba(139,92,246,0.12)]"
                    : "border-border bg-card"
                }`}
              >
                {isFeatured && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-60" />
                )}
                <div className="mb-0.5">
                  {PRED_RANK_META[actualRank]?.icon}
                </div>
                <Avatar className={`border-2 ${isFeatured ? "h-12 w-12 border-violet-500/40" : "h-10 w-10 border-border"}`}>
                  <AvatarImage src={entry.user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xs">
                    {entry.user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {entry.user.nationFlag && (
                  <span className="text-base leading-none">{entry.user.nationFlag}</span>
                )}
                <p className={`text-xs font-bold truncate w-full ${isFeatured ? "text-foreground" : "text-muted-foreground"}`}>
                  {entry.user.username}
                </p>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="relative flex items-center justify-center">
                    <AccuracyRing pct={entry.outcomeAccuracy} color={isFeatured ? "#8b5cf6" : "#6b7280"} />
                    <span className="absolute text-[10px] font-black tabular-nums" style={{ color: isFeatured ? "#8b5cf6" : "#9ca3af" }}>
                      {entry.outcomeAccuracy}%
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest">outcome</span>
                </div>
                {entry.exactScores > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-violet-400">
                    <Crosshair className="h-3 w-3" />{entry.exactScores} exact
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-card border border-border" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground text-sm font-semibold">No prediction data yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Make predictions on upcoming matches to appear here once they complete.</p>
        </div>
      )}

      {/* Full table */}
      {!isLoading && filtered.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Headers */}
          <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Predictor</div>
            <div className="col-span-2 text-center">Played</div>
            <div className="col-span-2 text-center">
              <span className="flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3" />Correct</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="flex items-center justify-center gap-1"><Crosshair className="h-3 w-3" />Exact</span>
            </div>
            <div className="col-span-1 text-right hidden md:block">%</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/40">
            {filtered.map((entry) => {
              const rank = entry.rank;
              const meta = PRED_RANK_META[rank];
              return (
                <div
                  key={entry.user.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/10 transition-colors ${
                    rank === 1 ? "bg-violet-500/[0.03]" : rank <= 3 ? "bg-violet-500/[0.02]" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center justify-center">
                    {meta ? meta.icon : (
                      <span className="font-mono text-sm font-bold text-muted-foreground/60 tabular-nums">{rank}</span>
                    )}
                  </div>

                  {/* User */}
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <Avatar className={`h-7 w-7 border shrink-0 ${rank <= 3 ? "border-violet-500/30" : "border-border"}`}>
                      <AvatarImage src={entry.user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-heading text-[9px]">
                        {entry.user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${rank === 1 ? "text-violet-400" : "text-foreground"}`}>
                        {entry.user.username}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        {entry.user.nationFlag && <span>{entry.user.nationFlag}</span>}
                        <span className="uppercase tracking-wide">{entry.user.nationCode || "Global"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Played */}
                  <div className="col-span-2 text-center">
                    <span className="font-mono text-sm font-bold text-foreground tabular-nums">{entry.totalPredictions}</span>
                  </div>

                  {/* Correct outcomes */}
                  <div className="col-span-2 text-center flex flex-col items-center">
                    <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">{entry.correctOutcomes}</span>
                    <span className="text-[9px] text-muted-foreground">{entry.outcomeAccuracy}%</span>
                  </div>

                  {/* Exact scores */}
                  <div className="col-span-2 text-center flex flex-col items-center">
                    <span className={`font-mono text-sm font-bold tabular-nums ${entry.exactScores > 0 ? "text-violet-400" : "text-muted-foreground/40"}`}>
                      {entry.exactScores}
                    </span>
                    {entry.exactScores > 0 && (
                      <span className="text-[9px] text-violet-400/70">{entry.exactAccuracy}%</span>
                    )}
                  </div>

                  {/* Accuracy bar — desktop */}
                  <div className="hidden md:flex col-span-1 items-center justify-end">
                    <div className="relative flex items-center justify-center w-8 h-8">
                      <AccuracyRing pct={entry.outcomeAccuracy} color={rank === 1 ? "#8b5cf6" : rank <= 3 ? "#a78bfa" : "#6b7280"} />
                      <span className="absolute text-[8px] font-black tabular-nums text-muted-foreground">
                        {entry.outcomeAccuracy}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border/40 bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3" />
              {filtered.length} predictor{filtered.length !== 1 ? "s" : ""} ranked
            </span>
            <span>Based on completed matches · refreshes every 60s</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PodiumCard({
  entry, rank, height, nations, featured, flashed,
}: {
  entry: LeaderboardEntry & { delta?: number | null; xpGained?: number | null };
  rank: number;
  height: string;
  nations: Array<{ code: string; flagEmoji: string; name: string }> | undefined;
  featured?: boolean;
  flashed?: boolean;
}) {
  const meta = RANK_META[rank];
  const nation = Array.isArray(nations) ? nations.find((n) => n.code === entry.user.nationCode) : undefined;

  return (
    <div
      className={`relative flex flex-col items-center justify-end rounded-2xl border p-4 pb-5 ${height} overflow-hidden transition-all duration-700 ${
        flashed
          ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
          : featured
          ? `bg-primary/5 border-primary/25 ${meta.glow}`
          : "bg-card border-border"
      }`}
    >
      {(featured || flashed) && (
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent ${flashed ? "opacity-100" : "opacity-60"}`} />
      )}

      <div className="flex flex-col items-center gap-1.5 z-10 w-full">
        <div className="mb-1 relative">
          {meta.icon}
          {entry.xpGained && entry.xpGained > 0 && (
            <span className="absolute -top-1 -right-3 text-[9px] font-bold text-primary bg-primary/15 border border-primary/30 px-1 rounded-full animate-in zoom-in-75 duration-300">
              +{entry.xpGained}
            </span>
          )}
        </div>

        <Avatar className={`border-2 transition-all duration-700 ${
          flashed ? "h-12 w-12 border-primary shadow-[0_0_12px_rgba(251,191,36,0.3)]" : featured ? "h-12 w-12 border-primary/40" : "h-10 w-10 border-border"
        }`}>
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
        {(entry.user as any).isFounder && (
          <FounderBadge founderNumber={(entry.user as any).founderNumber} size="xs" />
        )}
        {!(entry.user as any).isFounder && (entry.user as any).isPremium && (
          <PremiumBadge size="xs" />
        )}

        <div className="flex items-center gap-1">
          <p className={`font-mono font-black tabular-nums leading-none ${featured || flashed ? "text-primary text-base" : "text-sm text-muted-foreground"}`}>
            <AnimatedXP value={entry.user.reputationPoints} />
          </p>
          {entry.delta !== null && entry.delta !== undefined && entry.delta !== 0 && (
            <RankDelta delta={entry.delta} />
          )}
        </div>
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">pts</p>
      </div>
    </div>
  );
}
