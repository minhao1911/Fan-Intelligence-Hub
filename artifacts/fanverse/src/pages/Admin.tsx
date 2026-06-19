import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import {
  Shield, Zap, Clock, CheckCircle2, Radio, Trophy,
  ChevronRight, AlertCircle, RefreshCw, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type MatchStatus = "upcoming" | "live" | "completed";

interface AdminMatch {
  id: number;
  homeNationCode: string;
  homeNationName: string;
  homeNationFlag: string;
  awayNationCode: string;
  awayNationName: string;
  awayNationFlag: string;
  stage: string | null;
  status: MatchStatus;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  predictionCount: number;
}

interface ResolveResult {
  matchId: number;
  homeScore: number;
  awayScore: number;
  actualOutcome: string;
  settledCount: number;
  correctCount: number;
  exactCount: number;
}

function useAdminMatches() {
  const { getToken } = useAuth();
  return useQuery<AdminMatch[]>({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/admin/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Failed to fetch matches");
      return r.json();
    },
    refetchInterval: 30_000,
  });
}

function useUpdateStatus() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number; status: "upcoming" | "live" }) => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/admin/matches/${matchId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-matches"] }),
  });
}

function useResolveMatch() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      matchId, homeScore, awayScore,
    }: { matchId: number; homeScore: number; awayScore: number }): Promise<ResolveResult> => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/admin/matches/${matchId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ homeScore, awayScore }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-matches"] });
      qc.invalidateQueries({ queryKey: ["predictions-upcoming-matches"] });
      qc.invalidateQueries({ queryKey: ["my-predictions-history"] });
    },
  });
}

// ── Score entry card for Live matches ────────────────────────────────────────
function LiveMatchCard({ match }: { match: AdminMatch }) {
  const [hs, setHs] = useState("");
  const [as_, setAs] = useState("");
  const [resolved, setResolved] = useState<ResolveResult | null>(null);
  const updateStatus = useUpdateStatus();
  const resolveMatch = useResolveMatch();

  if (resolved) {
    const outcomeLabel = resolved.actualOutcome === "home"
      ? match.homeNationCode
      : resolved.actualOutcome === "away"
      ? match.awayNationCode
      : "Draw";

    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-heading font-bold text-emerald-400 uppercase tracking-wide">
              {match.homeNationFlag} {match.homeNationCode} {resolved.homeScore}–{resolved.awayScore} {match.awayNationCode} {match.awayNationFlag}
            </p>
            <p className="text-xs text-muted-foreground">
              Result: {outcomeLabel} · {resolved.settledCount} predictions settled · {resolved.correctCount} correct · {resolved.exactCount} exact scores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400/70">
          <Zap className="h-3 w-3" />
          XP awarded: correct outcome +10 · exact score +30 on top of base +5
        </div>
      </div>
    );
  }

  const homeVal = parseInt(hs);
  const awayVal = parseInt(as_);
  const canResolve = !isNaN(homeVal) && !isNaN(awayVal) && homeVal >= 0 && awayVal >= 0;

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/10 p-4 space-y-4">
      {/* Match header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Live</span>
          <span className="text-[10px] text-muted-foreground ml-1">· {match.stage}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Users className="h-3 w-3" />
          {match.predictionCount} predictions
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col items-center text-center gap-1">
          <span className="text-3xl">{match.homeNationFlag}</span>
          <span className="text-xs font-heading font-bold uppercase tracking-wide">{match.homeNationCode}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="20"
            value={hs}
            onChange={(e) => setHs(e.target.value)}
            placeholder="0"
            className="w-12 h-10 text-center text-lg font-mono font-bold bg-muted/60 border border-border rounded-lg focus:outline-none focus:border-primary text-foreground"
          />
          <span className="text-muted-foreground font-bold">–</span>
          <input
            type="number"
            min="0"
            max="20"
            value={as_}
            onChange={(e) => setAs(e.target.value)}
            placeholder="0"
            className="w-12 h-10 text-center text-lg font-mono font-bold bg-muted/60 border border-border rounded-lg focus:outline-none focus:border-primary text-foreground"
          />
        </div>
        <div className="flex-1 flex flex-col items-center text-center gap-1">
          <span className="text-3xl">{match.awayNationFlag}</span>
          <span className="text-xs font-heading font-bold uppercase tracking-wide">{match.awayNationCode}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs border-border/60 text-muted-foreground hover:text-foreground"
          disabled={updateStatus.isPending}
          onClick={() => updateStatus.mutate({ matchId: match.id, status: "upcoming" })}
        >
          ← Back to Upcoming
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-heading uppercase tracking-wide"
          disabled={!canResolve || resolveMatch.isPending}
          onClick={() => {
            if (!canResolve) return;
            resolveMatch.mutate(
              { matchId: match.id, homeScore: homeVal, awayScore: awayVal },
              { onSuccess: (data) => setResolved(data) },
            );
          }}
        >
          {resolveMatch.isPending ? (
            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Zap className="h-3 w-3 mr-1" />
          )}
          Resolve & Award XP
        </Button>
      </div>

      {resolveMatch.isError && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" />
          {(resolveMatch.error as Error).message}
        </p>
      )}
    </div>
  );
}

// ── Upcoming match row ────────────────────────────────────────────────────────
function UpcomingMatchRow({ match }: { match: AdminMatch }) {
  const updateStatus = useUpdateStatus();
  const scheduledDate = new Date(match.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">{match.homeNationFlag}</span>
        <span className="text-xs font-heading font-bold uppercase tracking-wide text-foreground truncate">{match.homeNationCode}</span>
        <span className="text-[10px] text-muted-foreground mx-1">vs</span>
        <span className="text-xs font-heading font-bold uppercase tracking-wide text-foreground truncate">{match.awayNationCode}</span>
        <span className="text-base shrink-0">{match.awayNationFlag}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground hidden sm:block">{dateStr} · {timeStr}</span>
        {match.predictionCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-primary font-bold">
            <Users className="h-3 w-3" />{match.predictionCount}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground hidden sm:block">{match.stage}</span>
        <Button
          size="sm"
          className="h-7 px-3 text-[11px] bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-heading uppercase tracking-wide"
          variant="outline"
          disabled={updateStatus.isPending}
          onClick={() => updateStatus.mutate({ matchId: match.id, status: "live" })}
        >
          <Radio className="h-3 w-3 mr-1" />
          Go Live
        </Button>
      </div>
    </div>
  );
}

// ── Completed match row ───────────────────────────────────────────────────────
function CompletedMatchRow({ match }: { match: AdminMatch }) {
  const outcome = (match.homeScore ?? 0) > (match.awayScore ?? 0)
    ? "home"
    : (match.homeScore ?? 0) < (match.awayScore ?? 0)
    ? "away"
    : "draw";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0 opacity-60">
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className={`text-base shrink-0 ${outcome === "home" ? "opacity-100" : "opacity-40"}`}>{match.homeNationFlag}</span>
        <span className={`text-xs font-heading font-bold uppercase tracking-wide ${outcome === "home" ? "text-primary" : "text-muted-foreground"}`}>{match.homeNationCode}</span>
        <span className="font-mono text-sm font-bold text-foreground mx-1">{match.homeScore}–{match.awayScore}</span>
        <span className={`text-xs font-heading font-bold uppercase tracking-wide ${outcome === "away" ? "text-primary" : "text-muted-foreground"}`}>{match.awayNationCode}</span>
        <span className={`text-base shrink-0 ${outcome === "away" ? "opacity-100" : "opacity-40"}`}>{match.awayNationFlag}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {match.predictionCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3" />{match.predictionCount} settled
          </span>
        )}
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      </div>
    </div>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────
function StatsStrip({ matches }: { matches: AdminMatch[] }) {
  const upcoming = matches.filter((m) => m.status === "upcoming").length;
  const live = matches.filter((m) => m.status === "live").length;
  const completed = matches.filter((m) => m.status === "completed").length;
  const totalPreds = matches.reduce((acc, m) => acc + m.predictionCount, 0);

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: "Upcoming", value: upcoming, icon: Clock, color: "text-muted-foreground" },
        { label: "Live Now", value: live, icon: Radio, color: "text-red-400" },
        { label: "Completed", value: completed, icon: Trophy, color: "text-emerald-400" },
        { label: "Predictions", value: totalPreds, icon: Zap, color: "text-primary" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <Icon className={`h-4 w-4 mx-auto mb-1.5 ${color}`} />
          <p className="text-xl font-heading font-black text-foreground">{value}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
type Tab = "upcoming" | "live" | "completed";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data: matches = [], isLoading, error, refetch } = useAdminMatches();

  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const liveMatches = matches.filter((m) => m.status === "live");
  const completedMatches = matches.filter((m) => m.status === "completed");

  const tabCounts: Record<Tab, number> = {
    upcoming: upcomingMatches.length,
    live: liveMatches.length,
    completed: completedMatches.length,
  };

  const tabConfig: { key: Tab; label: string; icon: React.ReactNode; activeClass: string }[] = [
    {
      key: "upcoming",
      label: "Upcoming",
      icon: <Clock className="h-3.5 w-3.5" />,
      activeClass: "border-primary/60 text-primary bg-primary/8",
    },
    {
      key: "live",
      label: "Live",
      icon: <Radio className="h-3.5 w-3.5" />,
      activeClass: "border-red-500/60 text-red-400 bg-red-500/8",
    },
    {
      key: "completed",
      label: "Completed",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      activeClass: "border-emerald-500/60 text-emerald-400 bg-emerald-500/8",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border border-primary/30 bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black uppercase tracking-wide text-foreground">
              Match Admin
            </h1>
            <p className="text-xs text-muted-foreground">
              Set scores · distribute XP · manage match states
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-border/60 text-muted-foreground hover:text-foreground"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats strip */}
      {!isLoading && matches.length > 0 && <StatsStrip matches={matches} />}

      {/* XP guide */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-3">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-primary" /> XP Reward Structure
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span><span className="text-primary font-bold">+5 XP</span> — prediction submitted</span>
          <span><span className="text-blue-400 font-bold">+10 XP</span> — correct outcome bonus</span>
          <span><span className="text-purple-400 font-bold">+30 XP</span> — exact score bonus</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabConfig.map(({ key, label, icon, activeClass }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[11px] font-heading font-bold uppercase tracking-wide transition-all duration-150 ${
              tab === key
                ? activeClass
                : "border-border/50 text-muted-foreground hover:border-muted-foreground hover:text-foreground bg-muted/10"
            }`}
          >
            {icon}
            {label}
            {tabCounts[key] > 0 && (
              <span className="ml-0.5 text-[10px] font-mono">{tabCounts[key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load matches. Are you signed in?
        </div>
      ) : (
        <>
          {tab === "upcoming" && (
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              {upcomingMatches.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No upcoming matches
                </div>
              ) : (
                upcomingMatches.map((m) => <UpcomingMatchRow key={m.id} match={m} />)
              )}
            </div>
          )}

          {tab === "live" && (
            <div className="space-y-3">
              {liveMatches.length === 0 ? (
                <div className="rounded-2xl border border-border/50 bg-card py-12 text-center text-muted-foreground text-sm">
                  No live matches · Go to <strong>Upcoming</strong> and click "Go Live" to start one
                </div>
              ) : (
                liveMatches.map((m) => <LiveMatchCard key={m.id} match={m} />)
              )}
            </div>
          )}

          {tab === "completed" && (
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              {completedMatches.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No completed matches yet
                </div>
              ) : (
                completedMatches.map((m) => <CompletedMatchRow key={m.id} match={m} />)
              )}
            </div>
          )}
        </>
      )}

      {/* Workflow hint */}
      {tab === "upcoming" && !isLoading && upcomingMatches.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <ChevronRight className="h-3 w-3" />
          Click "Go Live" → switch to Live tab → enter final score → "Resolve & Award XP"
        </p>
      )}
    </div>
  );
}
