import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground flex items-center gap-4">
          <Trophy className="w-10 h-10 text-primary" /> Fan Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Top contributors, analysts, and passionate voices across the globe.</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border"></div>
          ))}
        </div>
      ) : !leaderboard?.length ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          Leaderboard is currently empty.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-muted/20 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-2 md:col-span-1 text-center">Rank</div>
            <div className="col-span-6 md:col-span-5">Fan</div>
            <div className="col-span-4 md:col-span-2 text-center">Tier</div>
            <div className="hidden md:block col-span-2 text-center">Reputation</div>
            <div className="hidden md:block col-span-2 text-center">Votes</div>
          </div>
          
          <div className="divide-y divide-border/50">
            {leaderboard.map((entry) => (
              <div key={entry.user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  {entry.rank === 1 ? <Trophy className="w-6 h-6 text-yellow-500" /> :
                   entry.rank === 2 ? <Medal className="w-6 h-6 text-gray-400" /> :
                   entry.rank === 3 ? <Award className="w-6 h-6 text-amber-700" /> :
                   <span className="font-mono text-lg font-bold text-muted-foreground">#{entry.rank}</span>}
                </div>
                
                <div className="col-span-6 md:col-span-5 flex items-center gap-4">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={entry.user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-heading">{entry.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-bold text-foreground truncate">{entry.user.username}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{entry.user.nationCode || "Global"}</p>
                  </div>
                </div>

                <div className="col-span-4 md:col-span-2 flex justify-center">
                  <div className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded">
                    {entry.user.reputationTier}
                  </div>
                </div>

                <div className="hidden md:flex col-span-2 justify-center font-mono font-bold text-foreground">
                  {entry.user.reputationPoints.toLocaleString()}
                </div>

                <div className="hidden md:flex col-span-2 justify-center font-mono text-muted-foreground">
                  {entry.totalVotes.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
