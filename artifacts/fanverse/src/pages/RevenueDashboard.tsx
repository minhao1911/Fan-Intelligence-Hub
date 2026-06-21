import { TrendingUp, Users, Crown, ShoppingBag, XCircle, Percent, IndianRupee, Award } from "lucide-react";
import { useRevenueDashboard } from "@/hooks/useMonetization";

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 flex items-start gap-4 ${accent ?? "border-border"}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-primary/15" : "bg-muted"}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-2xl font-heading font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function RevenueDashboard() {
  const { data, isLoading, error } = useRevenueDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
        Failed to load revenue data. Make sure you have admin access.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold uppercase text-foreground tracking-wide">
          Revenue <span className="text-primary">Dashboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">Real-time monetization analytics for FanVerse.</p>
      </div>

      {/* ── Revenue KPIs ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Revenue</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<IndianRupee className="h-5 w-5 text-primary" />}
            label="Total Revenue"
            value={`₹${Number(data.totalRevenueInr).toLocaleString("en-IN")}`}
            accent="border-primary/30"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            label="Monthly Revenue"
            value={`₹${Number(data.monthlyRevenueInr).toLocaleString("en-IN")}`}
            sub="This calendar month"
          />
          <StatCard
            icon={<Percent className="h-5 w-5 text-blue-500" />}
            label="Conversion Rate"
            value={`${data.conversionRate}%`}
            sub="Paid users / total users"
          />
          <StatCard
            icon={<ShoppingBag className="h-5 w-5 text-purple-500" />}
            label="Cosmetic Sales"
            value={data.cosmeticSales}
            sub="Total items sold"
          />
        </div>
      </div>

      {/* ── Subscribers ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Subscriptions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-primary" />}
            label="Active Subscribers"
            value={data.activeSubscribers}
            sub="₹99/month plan"
            accent="border-primary/30"
          />
          <StatCard
            icon={<XCircle className="h-5 w-5 text-destructive" />}
            label="Cancelled"
            value={data.cancelledSubscriptions}
            sub="All-time churn"
          />
          <StatCard
            icon={<Percent className="h-5 w-5 text-orange-500" />}
            label="Churn Rate"
            value={
              data.activeSubscribers + data.cancelledSubscriptions > 0
                ? `${((data.cancelledSubscriptions / (data.activeSubscribers + data.cancelledSubscriptions)) * 100).toFixed(1)}%`
                : "0%"
            }
            sub="Cancelled / total ever"
          />
        </div>
      </div>

      {/* ── Founder Pass ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Founder Pass</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Crown className="h-5 w-5 text-yellow-500" />}
            label="Passes Sold"
            value={data.founderPassSold}
            sub={`₹${(data.founderPassSold * 999).toLocaleString("en-IN")} revenue`}
            accent="border-yellow-500/30"
          />
          <StatCard
            icon={<Award className="h-5 w-5 text-yellow-400" />}
            label="Remaining"
            value={data.founderPassRemaining}
            sub="of 1,000 available"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-yellow-300" />}
            label="Sold Out"
            value={`${((data.founderPassSold / 1000) * 100).toFixed(1)}%`}
            sub="Percent claimed"
          />
        </div>
      </div>

      {/* ── Top Products ──────────────────────────────────────────── */}
      {data.topProducts?.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Top Selling Cosmetics</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Product</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Sales</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p: any, i: number) => (
                  <tr key={p.productId} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{p.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
