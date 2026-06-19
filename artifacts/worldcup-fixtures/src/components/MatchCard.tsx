import { type Match } from "@/lib/api";
import { formatMatchTime, stageName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  match: Match;
  onClick: () => void;
}

export default function MatchCard({ match, onClick }: Props) {
  const { homeTeam, awayTeam, score, status, utcDate, stage, group, matchday, minute } = match;
  const isLive = status === "live";
  const isDone = status === "completed";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 rounded-xl px-4 py-3 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live{minute ? ` ${minute}'` : ""}
            </span>
          )}
          {!isLive && (
            <span className="text-[11px] text-white/40 font-medium">
              {isDone ? "FT" : formatMatchTime(utcDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <span>{group ?? stageName(stage)}</span>
          {matchday && <span>· MD {matchday}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <TeamDisplay team={homeTeam} winner={score.winner === "HOME_TEAM"} loser={isDone && score.winner === "AWAY_TEAM"} />

        <div className="flex items-center gap-1.5 min-w-[3.5rem] justify-center">
          {isDone || isLive ? (
            <span className={`text-xl font-bold tabular-nums tracking-tight ${isLive ? "text-green-300" : "text-white"}`}>
              {score.home ?? 0} – {score.away ?? 0}
            </span>
          ) : (
            <span className="text-white/20 text-sm font-medium">vs</span>
          )}
        </div>

        <TeamDisplay team={awayTeam} winner={score.winner === "AWAY_TEAM"} loser={isDone && score.winner === "HOME_TEAM"} flip />
      </div>
    </button>
  );
}

function TeamDisplay({
  team,
  winner,
  loser,
  flip = false,
}: {
  team: Match["homeTeam"];
  winner: boolean;
  loser: boolean;
  flip?: boolean;
}) {
  return (
    <div className={`flex-1 flex items-center gap-2.5 ${flip ? "flex-row-reverse text-right" : ""}`}>
      {team.crest ? (
        <img src={team.crest} alt={team.name} className="w-8 h-8 object-contain shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
          {team.tla.slice(0, 2)}
        </div>
      )}
      <span
        className={`font-semibold text-sm truncate ${
          winner ? "text-white" : loser ? "text-white/40" : "text-white/80"
        }`}
      >
        {team.shortName}
      </span>
      {winner && <span className="text-yellow-400 text-xs shrink-0">★</span>}
    </div>
  );
}
