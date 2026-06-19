import { type Match } from "@/lib/api";
import { stageName } from "@/lib/utils";

interface Props {
  match: Match;
  onClick: () => void;
}

export default function MatchCard({ match, onClick }: Props) {
  const { homeTeam, awayTeam, score, status, utcDate, stage, group, matchday, minute } = match;
  const isLive = status === "live";
  const isDone = status === "completed";
  const isHomeWin = score.winner === "HOME_TEAM";
  const isAwayWin = score.winner === "AWAY_TEAM";

  const timeStr = new Date(utcDate).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC",
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-yellow-400/20 rounded-xl px-5 py-3.5 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <TeamSide team={homeTeam} isWinner={isHomeWin} isLoser={isDone && isAwayWin} />

        <div className="flex flex-col items-center gap-0.5 shrink-0 w-[4.5rem] text-center">
          {isDone || isLive ? (
            <span className={`text-xl font-black tabular-nums ${isLive ? "text-green-300" : "text-white"}`}>
              {score.home ?? 0}–{score.away ?? 0}
            </span>
          ) : (
            <span className="text-sm font-bold tabular-nums text-white/40">{timeStr}</span>
          )}
          <span className="text-[10px] uppercase tracking-widest font-bold leading-none">
            {isLive ? (
              <span className="text-green-400 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                {minute ? `${minute}'` : "Live"}
              </span>
            ) : isDone ? (
              <span className="text-white/25">FT</span>
            ) : (
              <span className="text-white/15">{group ?? stageName(stage)}</span>
            )}
          </span>
        </div>

        <TeamSide team={awayTeam} isWinner={isAwayWin} isLoser={isDone && isHomeWin} flip />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/20 font-medium">
        <span>
          {group ? group.replace(/GROUP_?/i, "Group ") : stageName(stage)}
          {matchday ? ` · MD ${matchday}` : ""}
        </span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30">
          Details →
        </span>
      </div>
    </button>
  );
}

function TeamSide({
  team, isWinner, isLoser, flip = false,
}: {
  team: Match["homeTeam"];
  isWinner: boolean;
  isLoser: boolean;
  flip?: boolean;
}) {
  const nameClass = isLoser ? "text-white/30" : isWinner ? "text-white font-bold" : "text-white/80 font-medium";

  return (
    <div className={`flex-1 flex items-center gap-2.5 min-w-0 ${flip ? "flex-row-reverse" : ""}`}>
      <span className="text-2xl leading-none shrink-0 select-none" title={team.name}>
        {team.flagEmoji ?? (
          <span className="inline-flex w-8 h-8 rounded-full bg-white/10 items-center justify-center text-[10px] font-bold text-white/60">
            {team.tla.slice(0, 2)}
          </span>
        )}
      </span>
      <span className={`text-sm truncate ${nameClass} ${flip ? "text-right" : ""}`}>
        {team.shortName}
      </span>
      {isWinner && <span className="text-yellow-400 text-xs shrink-0">★</span>}
    </div>
  );
}
