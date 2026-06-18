import { useGetGlobalStats, useListNations } from "@workspace/api-client-react";
import { Activity, Globe, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Pulse() {
  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();
  const { data: nations, isLoading: nationsLoading } = useListNations({});

  const sorted = nations
    ? [...nations].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
    : [];

  const maxConf = sorted[0]?.confidenceScore ?? 100;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="border-b border-border/50 pb-6">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Activity className="w-5 h-5" />
          <span className="font-heading font-bold uppercase tracking-widest text-xs">Global Flagship Analytics</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase text-foreground">Nation Pulse</h1>
        <p className="text-muted-foreground mt-3 text-base max-w-2xl">
          Aggregated macro-view of global fan sentiment — real-time confidence tracking across all active nations.
        </p>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Signals", value: stats?.totalVotesCast, icon: <Activity className="w-5 h-5 text-primary" /> },
          { label: "Active Nations", value: stats?.totalNationsActive, icon: <Globe className="w-5 h-5 text-primary" /> },
          { label: "Total Analysts", value: stats?.totalFans, icon: <Users className="w-5 h-5 text-primary" /> },
          { label: "Most Activated", value: stats?.mostActivatedNation || "N/A", icon: <TrendingUp className="w-5 h-5 text-primary" />, isText: true },
        ].map((item) => (
          <Card key={item.label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                {item.icon}
              </div>
              <h3 className={`font-heading font-bold ${item.isText ? "text-xl text-primary mt-1" : "text-3xl text-foreground"}`}>
                {statsLoading ? "—" : item.isText ? item.value : (item.value as number)?.toLocaleString()}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nation Confidence Ladder */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-heading font-bold uppercase text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Fan Confidence by Nation
          </h2>
          <Link href="/nations" className="text-sm font-medium text-primary hover:underline">
            View All →
          </Link>
        </div>

        {nationsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-card rounded-xl animate-pulse border border-border" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((nation, idx) => {
              const conf = nation.confidenceScore ?? 0;
              const barPct = maxConf > 0 ? (conf / maxConf) * 100 : 0;
              return (
                <Link key={nation.code} href={`/nations/${nation.code}`}>
                  <div className="flex items-center gap-4 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors cursor-pointer group">
                    <span className="font-mono text-xs text-muted-foreground w-6 text-right shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-2xl leading-none shrink-0">{nation.flagEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {nation.name}
                        </span>
                        <span className="font-mono text-sm font-bold text-primary shrink-0 ml-2">{conf}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0 hidden sm:block">
                      {nation.confederation}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Users className="w-3 h-3" />
                      {nation.memberCount.toLocaleString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
