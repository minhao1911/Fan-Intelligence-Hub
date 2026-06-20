import { useListNations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, Users, TrendingUp } from "lucide-react";
import { useState } from "react";

const CONFEDERATIONS = ["All", "UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];

const CONF_COLOR: Record<string, string> = {
  UEFA: "text-blue-400 border-blue-400/30 bg-blue-400/8",
  CONMEBOL: "text-emerald-400 border-emerald-400/30 bg-emerald-400/8",
  CONCACAF: "text-red-400 border-red-400/30 bg-red-400/8",
  CAF: "text-orange-400 border-orange-400/30 bg-orange-400/8",
  AFC: "text-purple-400 border-purple-400/30 bg-purple-400/8",
  OFC: "text-cyan-400 border-cyan-400/30 bg-cyan-400/8",
};

export default function Nations() {
  const [search, setSearch] = useState("");
  const [confederation, setConfederation] = useState<string>("All");

  const { data: nations, isLoading } = useListNations({
    search: search || undefined,
    confederation: confederation === "All" ? undefined : confederation,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Hero Header ─────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🌍</span>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold uppercase text-foreground tracking-tight">Global Nations</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Discover communities, track national confidence, and join your fanbase.
          </p>
          {nations && (
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span><strong className="text-foreground">{nations.length}</strong> nations competing</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3 w-3 text-primary" />
                <span><strong className="text-foreground">{nations.reduce((s, n) => s + n.memberCount, 0).toLocaleString()}</strong> total fans</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Search + Filters ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search nations…"
            className="pl-10 bg-card border-border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CONFEDERATIONS.map((conf) => (
            <button
              key={conf}
              onClick={() => setConfederation(conf)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-150 ${
                confederation === conf
                  ? "bg-primary/12 border-primary/50 text-primary shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                  : conf === "All"
                  ? "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  : `${CONF_COLOR[conf] ?? "bg-muted border-border text-muted-foreground"} hover:opacity-90`
              }`}
            >
              {conf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="h-44 bg-muted/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : nations?.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground border border-dashed border-border/50 rounded-2xl">
          <span className="text-5xl block mb-3">🔍</span>
          <p className="font-medium">No nations found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {nations?.map((nation) => (
            <Link key={nation.code} href={`/nations/${nation.code}`}>
              <div className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5">
                {/* Gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                {/* Confederation color top bar */}
                <div className={`h-0.5 w-full ${
                  nation.confederation === "UEFA" ? "bg-blue-500/60" :
                  nation.confederation === "CONMEBOL" ? "bg-emerald-500/60" :
                  nation.confederation === "CONCACAF" ? "bg-red-500/60" :
                  nation.confederation === "CAF" ? "bg-orange-500/60" :
                  nation.confederation === "AFC" ? "bg-purple-500/60" :
                  "bg-cyan-500/60"
                }`} />

                <div className="p-4 flex flex-col items-center text-center">
                  {/* Flag */}
                  <div className="text-5xl leading-none mb-3 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
                    {nation.flagEmoji}
                  </div>

                  {/* Name */}
                  <h3 className="text-xs font-heading font-bold uppercase tracking-wide text-foreground leading-tight mb-0.5 line-clamp-2">
                    {nation.name}
                  </h3>

                  {/* Confederation */}
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full border mb-3 ${CONF_COLOR[nation.confederation] ?? "text-muted-foreground border-border"}`}>
                    {nation.confederation}
                  </span>

                  {/* Stats */}
                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-2.5 w-2.5" />
                        {nation.memberCount.toLocaleString()}
                      </div>
                      {nation.confidenceScore != null && (
                        <span className="font-mono font-bold text-primary">{Math.round(nation.confidenceScore)}%</span>
                      )}
                    </div>
                    {nation.confidenceScore != null && (
                      <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                          style={{ width: `${nation.confidenceScore}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
