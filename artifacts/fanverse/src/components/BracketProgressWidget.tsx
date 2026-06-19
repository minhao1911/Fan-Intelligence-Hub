import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getFixtures, type Fixture } from "@/lib/fixtures";
import { Trophy, ChevronRight, CheckCircle2, Clock, Circle } from "lucide-react";

const STAGES = [
  { key: "GROUP_STAGE",    label: "Group Stage",    short: "Groups",  emoji: "⚽", teams: 48, slots: null },
  { key: "ROUND_OF_16",   label: "Round of 16",    short: "R16",     emoji: "🏟️", teams: 32, slots: 16  },
  { key: "QUARTER_FINALS",label: "Quarter Finals",  short: "QF",      emoji: "⚡", teams: 16, slots: 8   },
  { key: "SEMI_FINALS",   label: "Semi Finals",    short: "SF",      emoji: "🔥", teams: 8,  slots: 4   },
  { key: "FINAL",         label: "Final",          short: "Final",   emoji: "👑", teams: 2,  slots: 1   },
];

function groupByStage(matches: Fixture[]) {
  const map: Record<string, Fixture[]> = {};
  for (const m of matches) {
    if (!map[m.stage]) map[m.stage] = [];
    map[m.stage].push(m);
  }
  return map;
}

function stageStatus(matches: Fixture[]): "not_started" | "in_progress" | "complete" {
  if (!matches?.length) return "not_started";
  const done = matches.filter((m) => m.status === "completed").length;
  if (done === 0) return "not_started";
  if (done === matches.length) return "complete";
  return "in_progress";
}

export default function BracketProgressWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["wc-fixtures-bracket"],
    queryFn: () => getFixtures({}),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const byStage = groupByStage(data?.matches ?? []);
  const totalMatches = data?.matches?.length ?? 0;
  const completedMatches = (data?.matches ?? []).filter((m) => m.status === "completed").length;
  const tournamentPct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  // Find champion: winner of the Final
  const finalMatches = byStage["FINAL"] ?? [];
  const completedFinal = finalMatches.find((m) => m.status === "completed");
  const champion =
    completedFinal?.score.winner === "HOME_TEAM"
      ? completedFinal.homeTeam
      : completedFinal?.score.winner === "AWAY_TEAM"
      ? completedFinal.awayTeam
      : null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              WC 2026 Bracket
            </p>
          </div>
          <Link href="/fixtures">
            <span className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer">
              Full <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>

        {/* Overall progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5 text-[10px]">
            <span className="text-muted-foreground font-semibold">Tournament progress</span>
            <span className="font-bold font-mono text-primary">{tournamentPct}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-yellow-300 rounded-full transition-all duration-700"
              style={{ width: `${tournamentPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {completedMatches} / {totalMatches} matches played
          </p>
        </div>
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="mx-3 mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/15 to-yellow-500/10 border border-primary/30">
          <span className="text-2xl leading-none">{champion.flagEmoji ?? "🏆"}</span>
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-primary">🏆 World Champion</p>
            <p className="text-sm font-heading font-bold text-foreground">{champion.name}</p>
          </div>
        </div>
      )}

      {/* Stage list */}
      <div className="px-3 py-3 flex flex-col gap-1">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
          ))
        ) : (
          STAGES.map((stage, idx) => {
            const matches = byStage[stage.key] ?? [];
            const status = stageStatus(matches);
            const done = matches.filter((m) => m.status === "completed").length;
            const total = matches.length || stage.slots || "—";
            const isActive = status === "in_progress";
            const isDone = status === "complete";
            const hasData = matches.length > 0;

            // Find last completed match winners for knockout stages
            const lastWinners = stage.key !== "GROUP_STAGE"
              ? matches
                  .filter((m) => m.status === "completed")
                  .slice(-2)
                  .map((m) =>
                    m.score.winner === "HOME_TEAM"
                      ? m.homeTeam
                      : m.score.winner === "AWAY_TEAM"
                      ? m.awayTeam
                      : null
                  )
                  .filter(Boolean)
              : [];

            return (
              <div key={stage.key}>
                {/* Connector dot for non-first stages */}
                {idx > 0 && (
                  <div className="flex justify-center py-0.5">
                    <div className={`w-px h-3 ${isDone || isActive ? "bg-primary/40" : "bg-border"}`} />
                  </div>
                )}

                <Link href={`/fixtures`}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer group ${
                      isDone
                        ? "border-primary/30 bg-primary/6"
                        : isActive
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_12px_rgba(250,204,21,0.1)]"
                        : "border-border/50 bg-secondary/20 hover:border-border"
                    }`}
                  >
                    {/* Status icon */}
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : isActive ? (
                        <div className="relative">
                          <Circle className="h-4 w-4 text-primary" />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          </span>
                        </div>
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Stage info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${isDone || isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          <span className="mr-1">{stage.emoji}</span>
                          {stage.label}
                        </span>
                        {hasData && (
                          <span className={`text-[10px] font-bold font-mono shrink-0 ${
                            isDone ? "text-primary" : isActive ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {done}/{total}
                          </span>
                        )}
                      </div>

                      {/* Progress mini-bar for active stage */}
                      {isActive && typeof total === "number" && total > 0 && (
                        <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.round((done / total) * 100)}%` }}
                          />
                        </div>
                      )}

                      {/* Show recent knockout winners */}
                      {stage.key !== "GROUP_STAGE" && lastWinners.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {lastWinners.map((w) => w && (
                            <span key={w.id} className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <span>{w.flagEmoji ?? "🏴"}</span>
                              <span className="font-semibold">{w.tla}</span>
                            </span>
                          ))}
                          {done > 2 && (
                            <span className="text-[9px] text-muted-foreground">+{done - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <Link href="/fixtures">
          <button
            type="button"
            className="w-full py-2 text-[11px] font-bold uppercase tracking-widest text-primary border border-primary/25 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors"
          >
            View Full Bracket →
          </button>
        </Link>
      </div>
    </div>
  );
}
