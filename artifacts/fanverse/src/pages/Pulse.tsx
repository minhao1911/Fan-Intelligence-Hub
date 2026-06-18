import { useGetGlobalStats } from "@workspace/api-client-react";
import { Activity, BarChart3, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Pulse() {
  const { data: stats, isLoading } = useGetGlobalStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3 text-primary mb-2">
          <Activity className="w-6 h-6" />
          <span className="font-heading font-bold uppercase tracking-widest text-sm">Global Flagship Analytics</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase text-foreground">Nation Pulse</h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-3xl">
          The aggregated macro-view of global fan sentiment. Real-time confidence tracking across all active nations.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Signals</p>
                <h3 className="text-3xl font-heading font-bold text-foreground">
                  {isLoading ? "..." : stats?.totalVotesCast?.toLocaleString()}
                </h3>
              </div>
              <Activity className="w-5 h-5 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Active Nations</p>
                <h3 className="text-3xl font-heading font-bold text-foreground">
                  {isLoading ? "..." : stats?.totalNationsActive?.toLocaleString()}
                </h3>
              </div>
              <GlobeIcon className="w-5 h-5 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Analysts</p>
                <h3 className="text-3xl font-heading font-bold text-foreground">
                  {isLoading ? "..." : stats?.totalFans?.toLocaleString()}
                </h3>
              </div>
              <Users className="w-5 h-5 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Most Activated</p>
                <h3 className="text-xl font-heading font-bold text-primary mt-2">
                  {isLoading ? "..." : stats?.mostActivatedNation || "N/A"}
                </h3>
              </div>
              <TrendingUp className="w-5 h-5 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 bg-card border border-border rounded-xl p-8 lg:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <BarChart3 className="w-16 h-16 text-primary/30 mx-auto mb-6" />
        <h2 className="text-2xl font-heading font-bold uppercase mb-4 relative z-10">Advanced Analytics Dashboard</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto relative z-10">
          The global pulse charts are currently gathering data. Once sufficient matchday signals are collected, this section will populate with real-time sentiment distribution and confidence trends.
        </p>
      </div>
    </div>
  );
}

// Inline icon to save imports
function GlobeIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
}
