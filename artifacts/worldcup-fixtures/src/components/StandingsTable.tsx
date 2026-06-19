import { type StandingGroup } from "@/lib/api";

interface Props {
  group: StandingGroup;
}

export default function StandingsTable({ group }: Props) {
  const title = group.group
    ? group.group.replace(/_/g, " ")
    : group.stage.replace(/_/g, " ");

  return (
    <div className="bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.06]">
      <div className="px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.06] flex items-center gap-2">
        <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">{title}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-white/25 uppercase tracking-widest border-b border-white/[0.05]">
              <th className="text-left px-4 py-2 w-6">#</th>
              <th className="text-left px-4 py-2">Team</th>
              <th className="text-center px-2 py-2">P</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-center px-2 py-2">GD</th>
              <th className="text-center px-2 py-2 text-white/40">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.table.map((entry, i) => {
              const qualifies = i < 2;
              return (
                <tr
                  key={entry.team.id}
                  className={`border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.03] ${
                    qualifies ? "border-l-2 border-l-green-500/40" : "border-l-2 border-l-transparent"
                  }`}
                >
                  <td className="px-4 py-2.5 text-white/30 text-xs font-mono">{entry.position}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {entry.team.flagEmoji ? (
                        <span className="text-lg leading-none select-none">{entry.team.flagEmoji}</span>
                      ) : entry.team.crest ? (
                        <img src={entry.team.crest} alt={entry.team.name} className="w-5 h-5 object-contain" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                          {entry.team.tla?.slice(0, 2)}
                        </div>
                      )}
                      <span className={`text-sm truncate max-w-[8rem] ${qualifies ? "text-white/90 font-medium" : "text-white/60"}`}>
                        {entry.team.shortName}
                      </span>
                    </div>
                  </td>
                  <td className="text-center px-2 py-2.5 text-white/40 text-xs">{entry.playedGames}</td>
                  <td className="text-center px-2 py-2.5 text-white/40 text-xs">{entry.won}</td>
                  <td className="text-center px-2 py-2.5 text-white/40 text-xs">{entry.draw}</td>
                  <td className="text-center px-2 py-2.5 text-white/40 text-xs">{entry.lost}</td>
                  <td className="text-center px-2 py-2.5 text-xs">
                    <span className={entry.goalDifference > 0 ? "text-green-400" : entry.goalDifference < 0 ? "text-red-400/70" : "text-white/30"}>
                      {entry.goalDifference > 0 ? "+" : ""}{entry.goalDifference}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2.5 font-bold text-white text-sm">{entry.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
