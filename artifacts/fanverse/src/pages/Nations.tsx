import { useListNations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useState } from "react";

export default function Nations() {
  const [search, setSearch] = useState("");
  const { data: nations, isLoading } = useListNations({ search: search || undefined });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Global Nations</h1>
        <p className="text-muted-foreground mt-2">Discover communities, track national confidence, and join your fanbase.</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search nations..." 
          className="pl-10 h-12 bg-card border-border text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nations?.map(nation => (
            <Link key={nation.code} href={`/nations/${nation.code}`}>
              <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {nation.flagEmoji}
                  </div>
                  <h3 className="text-xl font-heading font-bold uppercase tracking-wide mb-1">{nation.name}</h3>
                  <div className="text-xs text-muted-foreground font-bold tracking-widest uppercase mb-4">
                    {nation.confederation}
                  </div>
                  
                  <div className="w-full flex justify-between items-center pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                      <Users className="h-4 w-4" />
                      {nation.memberCount.toLocaleString()}
                    </div>
                    {nation.confidenceScore !== null && nation.confidenceScore !== undefined && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Confidence</span>
                        <span className="font-mono font-bold text-primary">{nation.confidenceScore}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      {!isLoading && nations?.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No nations found matching your search.
        </div>
      )}
    </div>
  );
}
