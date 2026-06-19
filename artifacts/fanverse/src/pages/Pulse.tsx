import { useState } from "react";
import { useListNations, useGetNationConfidence, useVoteNationConfidence } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Globe, Users, TrendingUp, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@clerk/react";
import { getBaseUrl } from "@/lib/api";

const LEVELS = [
  { level: 1, label: "Doomed",    emoji: "💀", xp: 0,  color: "bg-red-900/60 border-red-700 hover:border-red-500 text-red-300" },
  { level: 2, label: "Shaky",     emoji: "😟", xp: 0,  color: "bg-orange-900/60 border-orange-700 hover:border-orange-500 text-orange-300" },
  { level: 3, label: "Neutral",   emoji: "😐", xp: 5,  color: "bg-zinc-800/60 border-zinc-600 hover:border-zinc-400 text-zinc-300" },
  { level: 4, label: "Strong",    emoji: "💪", xp: 25, color: "bg-blue-900/60 border-blue-700 hover:border-blue-500 text-blue-300" },
  { level: 5, label: "Champions", emoji: "🔥", xp: 50, color: "bg-primary/20 border-primary/60 hover:border-primary text-primary" },
] as const;

const CONF_COLOR = (score: number) =>
  score >= 80 ? "text-primary" : score >= 60 ? "text-blue-400" : score >= 40 ? "text-zinc-400" : "text-red-400";

function ConfidenceBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function NationVotePanel({ code, onVoted }: { code: string; onVoted: () => void }) {
  const qc = useQueryClient();
  const { data: conf, isLoading } = useGetNationConfidence(code, {
    query: { enabled: true, queryKey: ["nation-confidence", code] },
  });
  const vote = useVoteNationConfidence();

  const handleVote = (level: number) => {
    vote.mutate(
      { code, data: { level } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["nation-confidence", code] });
          qc.invalidateQueries({ queryKey: ["me-confidence-votes"] });
          onVoted();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!conf) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {conf.totalVotes} fan votes · Overall {conf.overallConfidence}%
        </span>
        {conf.myVote && (
          <span className="text-xs font-bold text-primary">
            Your stance: {LEVELS.find((l) => l.level === conf.myVote)?.emoji}{" "}
            {LEVELS.find((l) => l.level === conf.myVote)?.label}
          </span>
        )}
      </div>

      {conf.breakdown.map((b) => (
        <div key={b.level} className="flex items-center gap-3">
          <span className="text-base w-5 text-center shrink-0">{b.emoji}</span>
          <span className="text-xs text-muted-foreground w-16 shrink-0">{b.label}</span>
          <ConfidenceBar
            pct={b.pct}
            color={b.level >= 4 ? "bg-primary" : b.level === 3 ? "bg-zinc-500" : "bg-red-600"}
          />
          <span className="text-xs font-mono text-muted-foreground w-8 text-right shrink-0">{b.pct}%</span>
        </div>
      ))}

      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {LEVELS.map((lvl) => {
          const isMyVote = conf.myVote === lvl.level;
          return (
            <button
              key={lvl.level}
              disabled={vote.isPending}
              onClick={() => handleVote(lvl.level)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all duration-150 cursor-pointer ${
                isMyVote
                  ? "ring-2 ring-primary scale-105 " + lvl.color
                  : lvl.color
              }`}
            >
              <span className="text-xl">{lvl.emoji}</span>
              <span className="text-[10px] font-bold leading-tight">{lvl.label}</span>
              {lvl.xp > 0 && (
                <span className="text-[9px] font-mono text-primary">+{lvl.xp} XP</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Vote Strong or Champions to earn XP when this nation advances in the tournament
      </p>
    </div>
  );
}

function ConfidenceWarsTab() {
  const { data: nations, isLoading } = useListNations({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const { isSignedIn } = useAuth();
  const qc = useQueryClient();

  const sorted = nations
    ? [...nations].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
    : [];
  const maxConf = sorted[0]?.confidenceScore ?? 100;

  const toggle = (code: string) => setExpanded((prev) => (prev === code ? null : code));

  return (
    <div className="space-y-2">
      {isLoading
        ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-card rounded-xl animate-pulse border border-border" />
          ))
        : sorted.map((nation, idx) => {
            const conf = nation.confidenceScore ?? 0;
            const barPct = maxConf > 0 ? (conf / maxConf) * 100 : 0;
            const isOpen = expanded === nation.code;
            return (
              <div
                key={nation.code}
                className={`bg-card border rounded-xl transition-all duration-200 ${
                  isOpen ? "border-primary/40" : "border-border hover:border-border/80"
                }`}
              >
                <div
                  className="flex items-center gap-4 p-3 cursor-pointer select-none"
                  onClick={() => toggle(nation.code)}
                >
                  <span className="font-mono text-xs text-muted-foreground w-6 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-2xl leading-none shrink-0">{nation.flagEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-foreground truncate">{nation.name}</span>
                      <span className={`font-mono text-sm font-bold shrink-0 ml-2 ${CONF_COLOR(conf)}`}>
                        {conf}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
                      {nation.confederation}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {nation.memberCount.toLocaleString()}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {isOpen && isSignedIn && (
                  <div className="px-4 pb-4">
                    <NationVotePanel
                      code={nation.code}
                      onVoted={() => qc.invalidateQueries({ queryKey: ["me-confidence-votes"] })}
                    />
                  </div>
                )}
                {isOpen && !isSignedIn && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/50 text-center text-sm text-muted-foreground">
                    Sign in to cast your confidence vote
                  </div>
                )}
              </div>
            );
          })}
    </div>
  );
}

function MyStancesTab() {
  const { isSignedIn, getToken } = useAuth();

  const { data: myVotes, isLoading } = useQuery<
    {
      nationCode: string;
      nationName: string;
      flagEmoji: string;
      level: number;
      levelLabel: string;
      levelEmoji: string;
      overallConfidence: number;
      pendingXp: number;
      updatedAt: string | null;
    }[]
  >({
    queryKey: ["me-confidence-votes"],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/me/confidence-votes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Failed to fetch confidence votes");
      return r.json();
    },
    enabled: isSignedIn === true,
  });

  if (!isSignedIn) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Sign in to see your confidence stances</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  if (!myVotes || myVotes.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-sm">No confidence votes yet</p>
        <p className="text-xs mt-1">Switch to Confidence Wars and vote on any nation</p>
      </div>
    );
  }

  const totalPendingXp = myVotes.reduce((sum, v) => sum + (v.pendingXp ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Nations Staked", value: myVotes.length, icon: <Globe className="w-4 h-4 text-primary" /> },
          { label: "Pending XP", value: `+${totalPendingXp}`, icon: <Zap className="w-4 h-4 text-primary" /> },
          { label: "Believers", value: myVotes.filter((v) => v.level >= 4).length, icon: <TrendingUp className="w-4 h-4 text-primary" /> },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                {stat.icon}
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        {myVotes.map((v) => {
          const lvl = LEVELS.find((l) => l.level === v.level);
          const barW = Math.min(100, v.overallConfidence ?? 0);
          return (
            <div
              key={v.nationCode}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <span className="text-3xl shrink-0">{v.flagEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-foreground truncate">{v.nationName}</span>
                  <span className={`text-xs font-mono font-bold ${CONF_COLOR(v.overallConfidence ?? 0)}`}>
                    {v.overallConfidence ?? 0}% confidence
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${barW}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-2xl">{lvl?.emoji}</span>
                <span className="text-[10px] font-bold text-muted-foreground">{lvl?.label}</span>
              </div>
              {v.pendingXp > 0 ? (
                <div className="flex flex-col items-center gap-0.5 shrink-0 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">+{v.pendingXp}</span>
                  <span className="text-[9px] text-muted-foreground">on advance</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5 shrink-0 bg-muted/50 border border-border rounded-lg px-3 py-2">
                  <span className="text-xs text-muted-foreground font-bold">0 XP</span>
                  <span className="text-[9px] text-muted-foreground">on advance</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">How XP rewards work:</strong> When a nation advances to the knockouts,
          all Champions (🔥) believers earn <strong className="text-primary">+50 XP</strong>,
          Strong (💪) earn <strong className="text-primary">+25 XP</strong>,
          and Neutral (😐) earn <strong className="text-primary">+5 XP</strong>.
        </p>
      </div>
    </div>
  );
}

export default function Pulse() {
  const [tab, setTab] = useState<"wars" | "mine">("wars");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-border/50 pb-6">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Activity className="w-5 h-5" />
          <span className="font-heading font-bold uppercase tracking-widest text-xs">Fan Confidence Intelligence</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase text-foreground">
          Nation Confidence Wars
        </h1>
        <p className="text-muted-foreground mt-3 text-base max-w-2xl">
          Vote your confidence in any nation. When they advance, believers earn XP — up to{" "}
          <span className="text-primary font-bold">+50 XP</span> for Champions calls.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {LEVELS.map((lvl) => (
            <div
              key={lvl.level}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-bold"
            >
              <span>{lvl.emoji}</span>
              <span className="text-foreground">{lvl.label}</span>
              {lvl.xp > 0 ? (
                <span className="text-primary">+{lvl.xp} XP</span>
              ) : (
                <span className="text-muted-foreground">0 XP</span>
              )}
            </div>
          ))}
        </div>
      </header>

      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {[
          { key: "wars", label: "Confidence Wars", icon: <TrendingUp className="w-4 h-4" /> },
          { key: "mine", label: "My Stances", icon: <Zap className="w-4 h-4" /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as "wars" | "mine")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              tab === key
                ? "bg-card border border-border text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {tab === "wars" ? <ConfidenceWarsTab /> : <MyStancesTab />}
    </div>
  );
}
