import { useQuery } from "@tanstack/react-query";
import { fetchFixtureDetail } from "@/lib/api";
import { formatMatchTime, stageName } from "@/lib/utils";
import { X, MapPin, Calendar, Users, Loader2 } from "lucide-react";

interface Props {
  matchId: number;
  onClose: () => void;
}

export default function MatchModal({ matchId, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["fixture", matchId],
    queryFn: () => fetchFixtureDetail(matchId),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[#1a1a2e] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-bold text-base text-white/90">Match Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
          </div>
        )}

        {isError && (
          <div className="p-6 text-center text-red-400 text-sm">Failed to load match details.</div>
        )}

        {data && (
          <div className="p-5 space-y-5">
            {/* Score hero */}
            <div className="bg-white/5 rounded-xl p-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4">
                {data.group ?? stageName(data.stage)}
                {data.matchday ? ` · Matchday ${data.matchday}` : ""}
              </p>
              <div className="flex items-center justify-between gap-4">
                <TeamHero team={data.homeTeam} />
                <div className="text-center">
                  {data.status === "upcoming" ? (
                    <div>
                      <p className="text-2xl font-bold text-white/30">vs</p>
                      <p className="text-xs text-white/50 mt-1">{formatMatchTime(data.utcDate)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-4xl font-black tabular-nums tracking-tight text-white">
                        {data.score.home ?? 0}
                        <span className="text-white/30 mx-2">–</span>
                        {data.score.away ?? 0}
                      </p>
                      <p className="text-xs mt-1.5 font-medium">
                        {data.status === "live" ? (
                          <span className="text-green-400">● Live{data.minute ? ` ${data.minute}'` : ""}</span>
                        ) : (
                          <span className="text-white/40">Full Time</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <TeamHero team={data.awayTeam} />
              </div>
              {data.score.winner && (
                <div className="mt-3 text-xs text-yellow-400 font-medium">
                  {data.score.winner === "HOME_TEAM"
                    ? `${data.homeTeam.shortName} wins!`
                    : data.score.winner === "AWAY_TEAM"
                    ? `${data.awayTeam.shortName} wins!`
                    : "Draw"}
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="grid gap-2">
              <MetaRow icon={<Calendar className="w-4 h-4" />} label="Date & Time" value={formatMatchTime(data.utcDate, true)} />
              {data.venue && <MetaRow icon={<MapPin className="w-4 h-4" />} label="Venue" value={data.venue} />}
              {data.referees.length > 0 && (
                <MetaRow icon={<Users className="w-4 h-4" />} label="Referee" value={data.referees[0]} />
              )}
            </div>

            {/* Head to head */}
            {data.head2head?.aggregates && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Head to Head (All Time)</p>
                <div className="bg-white/5 rounded-xl p-4 flex justify-around text-center">
                  <Stat label={data.homeTeam.tla} value={data.head2head.aggregates.homeTeam?.wins ?? 0} />
                  <Stat label="Draws" value={data.head2head.aggregates.homeTeam?.draws ?? 0} />
                  <Stat label={data.awayTeam.tla} value={data.head2head.aggregates.awayTeam?.wins ?? 0} />
                </div>
              </div>
            )}

            {/* Recent H2H matches */}
            {data.head2head?.matches?.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Recent Meetings</p>
                <div className="space-y-1.5">
                  {(data.head2head.matches as any[]).slice(0, 5).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-sm">
                      <span className="text-white/60 text-xs">{m.homeTeam?.shortName ?? "?"}</span>
                      <span className="font-bold tabular-nums text-white/80">
                        {m.score?.fullTime?.home ?? "?"} – {m.score?.fullTime?.away ?? "?"}
                      </span>
                      <span className="text-white/60 text-xs">{m.awayTeam?.shortName ?? "?"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamHero({ team }: { team: { name: string; shortName: string; crest: string | null; tla: string; flagEmoji?: string | null } }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      {team.flagEmoji ? (
        <span className="text-5xl leading-none select-none">{team.flagEmoji}</span>
      ) : team.crest ? (
        <img src={team.crest} alt={team.name} className="w-14 h-14 object-contain" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
          {team.tla}
        </div>
      )}
      <span className="text-sm font-semibold text-center leading-tight">{team.shortName}</span>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-white/30 mt-0.5">{icon}</span>
      <span className="text-white/40 w-20 shrink-0">{label}</span>
      <span className="text-white/80 flex-1">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  );
}
