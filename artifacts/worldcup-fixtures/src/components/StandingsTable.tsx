import { type StandingGroup } from "@/lib/api";

interface Props {
  group: StandingGroup;
}

export default function StandingsTable({ group }: Props) {
  const title = group.group
    ? group.group.replace(/_/g, " ")
    : group.stage.replace(/_/g, " ");

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden border border-white/8">
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-white/30 uppercase tracking-wide border-b border-white/5">
              <th className="text-left px-4 py-2 w-6">#</th>
              <th className="text-left px-4 py-2">Team</th>
              <th className="text-center px-2 py-2">P</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-center px-2 py-2">GD</th>
              <th className="text-center px-2 py-2 font-bold text-white/50">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.table.map((entry, i) => (
              <tr
                key={entry.team.id}
                className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${
                  i < 2 ? "border-l-2 border-l-green-500/50" : ""
                }`}
              >
                <td className="px-4 py-2.5 text-white/40 text-xs">{entry.position}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {entry.team.crest ? (
                      <img src={entry.team.crest} alt={entry.team.name} className="w-5 h-5 object-contain" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                        {entry.team.tla?.slice(0, 2)}
                      </div>
                    )}
                    <span className="font-medium text-white/80 truncate max-w-[8rem]">{entry.team.shortName}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-2.5 text-white/50">{entry.playedGames}</td>
                <td className="text-center px-2 py-2.5 text-white/50">{entry.won}</td>
                <td className="text-center px-2 py-2.5 text-white/50">{entry.draw}</td>
                <td className="text-center px-2 py-2.5 text-white/50">{entry.lost}</td>
                <td className="text-center px-2 py-2.5 text-white/50">
                  <span className={entry.goalDifference > 0 ? "text-green-400" : entry.goalDifference < 0 ? "text-red-400" : ""}>
                    {entry.goalDifference > 0 ? "+" : ""}{entry.goalDifference}
                  </span>
                </td>
                <td className="text-center px-2 py-2.5 font-bold text-white">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
