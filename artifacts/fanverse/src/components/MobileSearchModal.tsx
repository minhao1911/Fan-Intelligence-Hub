import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useListNations, useListMatches, getListNationsQueryKey, getListMatchesQueryKey } from "@workspace/api-client-react";
import { Search, X, Globe, CalendarDays, Shield, Users } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MobileSearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const q = query.trim().toLowerCase();

  const nationsParams = { search: q || undefined };
  const { data: nations } = useListNations(
    nationsParams,
    { query: { queryKey: getListNationsQueryKey(nationsParams), enabled: open } },
  );

  const upcomingParams = { status: "upcoming", limit: 20 } as const;
  const { data: upcomingMatches } = useListMatches(
    upcomingParams,
    { query: { queryKey: getListMatchesQueryKey(upcomingParams), enabled: open } },
  );
  const liveParams = { status: "live", limit: 10 } as const;
  const { data: liveMatches } = useListMatches(
    liveParams,
    { query: { queryKey: getListMatchesQueryKey(liveParams), enabled: open } },
  );

  const allMatches = [
    ...(liveMatches ?? []),
    ...(upcomingMatches ?? []),
  ];

  const filteredMatches = q
    ? allMatches.filter(
        (m) =>
          m.homeNationName.toLowerCase().includes(q) ||
          m.awayNationName.toLowerCase().includes(q) ||
          m.competition.toLowerCase().includes(q),
      )
    : allMatches.slice(0, 6);

  const filteredNations = (nations ?? []).slice(0, q ? 20 : 8);

  const hasResults = filteredNations.length > 0 || filteredMatches.length > 0;

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const go = (href: string) => {
    navigate(href);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border rounded-t-2xl flex flex-col max-h-[88dvh] animate-in slide-in-from-bottom-4 duration-300">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Search input */}
        <div className="px-4 pb-3 shrink-0">
          <div className="relative flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nations, matches, competitions…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-5">

          {/* Nations */}
          {filteredNations.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nations
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredNations.map((nation) => (
                  <button
                    key={nation.code}
                    onClick={() => go(`/nations/${nation.code}`)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                  >
                    <span className="text-2xl leading-none shrink-0">{nation.flagEmoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{nation.name}</p>
                      <p className="text-[10px] text-muted-foreground">{nation.confederation}</p>
                      {nation.confidenceScore != null && (
                        <p className="text-[10px] font-mono font-bold text-primary">{Math.round(nation.confidenceScore)}%</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Matches */}
          {filteredMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Matches
                </span>
              </div>
              <div className="space-y-2">
                {filteredMatches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => go(`/matches/${match.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl leading-none shrink-0">{match.homeNationFlag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {match.homeNationName} <span className="text-muted-foreground font-normal">vs</span> {match.awayNationName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Shield className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                          <p className="text-[10px] text-muted-foreground truncate">{match.competition}</p>
                          {match.status === "live" && (
                            <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest shrink-0 animate-pulse">Live</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xl leading-none shrink-0">{match.awayNationFlag}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!hasResults && q && (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm font-medium text-muted-foreground">No results for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">Try a nation name or competition</p>
            </div>
          )}

          {/* Zero query prompt */}
          {!hasResults && !q && (
            <div className="text-center py-12">
              <Globe className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">Search nations and matches</p>
            </div>
          )}

          {/* Quick links when no query */}
          {!q && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Quick Links
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "🌍 All Nations", href: "/nations" },
                  { label: "📅 All Matches", href: "/matches" },
                  { label: "⚡ Pulse", href: "/pulse" },
                  { label: "🏆 Leaderboard", href: "/leaderboard" },
                  { label: "🎯 Predictions", href: "/predictions" },
                ].map((link) => (
                  <button
                    key={link.href}
                    onClick={() => go(link.href)}
                    className="px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
