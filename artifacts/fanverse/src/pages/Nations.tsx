import { useListNations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useState } from "react";

const CONFEDERATIONS = ["All", "UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC"];

export default function Nations() {
  const [search, setSearch] = useState("");
  const [confederation, setConfederation] = useState<string>("All");

  const { data: nations, isLoading } = useListNations({
    search: search || undefined,
    confederation: confederation === "All" ? undefined : confederation,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Global Nations</h1>
        <p className="text-muted-foreground mt-1">Discover communities, track national confidence, and join your fanbase.</p>
      </header>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search nations..."
          className="pl-10 bg-card border-border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Confederation Filter */}
      <div className="flex flex-wrap gap-2">
        {CONFEDERATIONS.map((conf) => (
          <button
            key={conf}
            onClick={() => setConfederation(conf)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${
              confederation === conf
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {conf}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : nations?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          No nations found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nations?.map((nation) => (
            <Link key={nation.code} href={`/nations/${nation.code}`}>
              <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300 leading-none">
                    {nation.flagEmoji}
                  </div>
                  <h3 className="text-lg font-heading font-bold uppercase tracking-wide mb-0.5">{nation.name}</h3>
                  <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mb-4">
                    {nation.confederation}
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground font-medium">
                        <Users className="h-3 w-3" />
                        {nation.memberCount.toLocaleString()}
                      </div>
                      {nation.confidenceScore != null && (
                        <span className="font-mono font-bold text-primary">{nation.confidenceScore}%</span>
                      )}
                    </div>
                    {nation.confidenceScore != null && (
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full"
                          style={{ width: `${nation.confidenceScore}%` }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
