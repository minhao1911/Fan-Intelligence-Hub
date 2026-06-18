import { useState } from "react";
import { useGetLeaderboard, useListNations } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";

export default function Leaderboard() {
  const [selectedNation, setSelectedNation] = useState<string | undefined>(undefined);
  const { data: leaderboard, isLoading } = useGetLeaderboard({
    limit: 50,
    nationCode: selectedNation,
  });
  const { data: nations } = useListNations({});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-6">
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground flex items-center gap-4">
          <Trophy className="w-9 h-9 text-primary" /> Fan Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1 text-base">
          Top contributors, analysts, and passionate voices across the globe.
        </p>
      </header>

      {/* Nation Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
        <button
          onClick={() => setSelectedNation(undefined)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${
            !selectedNation
              ? "bg-primary/10 border-primary/40 text-primary"
              : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          All Nations
        </button>
        {nations?.map((n) => (
          <button
            key={n.code}
            onClick={() => setSelectedNation(n.code === selectedNation ? undefined : n.code)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${
              selectedNation === n.code
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {n.flagEmoji} {n.code}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-card rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      ) : !leaderboard?.length ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>No fans ranked yet{selectedNation ? ` for ${selectedNation}` : ""}.</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-2">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, idx) => {
                const podiumRank = [2, 1, 3][idx];
                const heights = ["h-28", "h-36", "h-24"];
                const medal = [
                  <Medal className="w-6 h-6 text-gray-400" />,
                  <Trophy className="w-7 h-7 text-yellow-400" />,
                  <Award className="w-6 h-6 text-amber-700" />,
                ][idx];
                return (
                  <div
                    key={entry.user.id}
                    className={`flex flex-col items-center justify-end bg-card border border-border rounded-xl p-4 ${heights[idx]} relative overflow-hidden`}
                  >
                    {idx === 1 && (
                      <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    )}
                    <div className="text-center z-10">
                      {medal}
                      <Avatar className="h-10 w-10 border-2 border-primary/20 mx-auto mt-1 mb-1">
                        <AvatarImage src={entry.user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xs">
                          {entry.user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-bold text-foreground truncate max-w-[80px]">
                        {entry.user.username}
                      </p>
                      <p className="font-mono text-xs text-primary font-bold">
                        {entry.user.reputationPoints.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 gap-2 p-4 border-b border-border/50 bg-muted/20 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5 md:col-span-4">Fan</div>
              <div className="col-span-3 md:col-span-3">Tier</div>
              <div className="hidden md:block col-span-2 text-right">Reputation</div>
              <div className="hidden md:block col-span-2 text-right">Votes</div>
            </div>

            <div className="divide-y divide-border/50">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors hover:bg-muted/10 ${
                    entry.rank <= 3 ? "bg-primary/[0.02]" : ""
                  }`}
                >
                  <div className="col-span-1 flex justify-center">
                    {entry.rank === 1 ? (
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    ) : entry.rank === 2 ? (
                      <Medal className="w-5 h-5 text-gray-400" />
                    ) : entry.rank === 3 ? (
                      <Award className="w-5 h-5 text-amber-700" />
                    ) : (
                      <span className="font-mono text-sm font-bold text-muted-foreground">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border shrink-0">
                      <AvatarImage src={entry.user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xs">
                        {entry.user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-bold text-foreground text-sm truncate">{entry.user.username}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        {entry.user.nationCode || "Global"}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 md:col-span-3">
                    <ReputationBadge tier={entry.user.reputationTier} size="sm" />
                  </div>

                  <div className="hidden md:flex col-span-2 justify-end font-mono font-bold text-foreground text-sm">
                    {entry.user.reputationPoints.toLocaleString()}
                  </div>

                  <div className="hidden md:flex col-span-2 justify-end font-mono text-muted-foreground text-sm">
                    {entry.totalVotes.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
