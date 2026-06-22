import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { useListMatches, getListMatchesQueryKey } from "@workspace/api-client-react";

export default function LiveMatchTicker() {
  const liveParams = { status: "live", limit: 10 } as const;
  const { data: liveMatches } = useListMatches(
    liveParams,
    { query: { queryKey: getListMatchesQueryKey(liveParams), refetchInterval: 30_000 } },
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const matches = liveMatches ?? [];
  const count = matches.length;

  useEffect(() => {
    if (count <= 1) return;
    intervalRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActiveIdx((i) => (i + 1) % count);
        setAnimating(false);
      }, 350);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [count]);

  useEffect(() => {
    if (activeIdx >= count && count > 0) setActiveIdx(0);
  }, [count, activeIdx]);

  if (!matches.length) return null;

  const match = matches[activeIdx] ?? matches[0];

  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/60 via-card/90 to-red-950/60 backdrop-blur-sm shadow-lg">

        {/* Animated background pulse */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.08) 0%, transparent 70%)",
            animation: "tickerPulse 3s ease-in-out infinite",
          }}
        />

        <div className="relative flex items-center gap-0 px-3 py-2.5">

          {/* LIVE badge */}
          <div className="flex items-center gap-1.5 shrink-0 mr-3 pr-3 border-r border-red-500/30">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 whitespace-nowrap">
              Live
            </span>
          </div>

          {/* Match content */}
          <Link href={`/matches/${match.id}`} className="flex-1 min-w-0">
            <div
              className="flex items-center gap-3 cursor-pointer"
              style={{
                opacity: animating ? 0 : 1,
                transform: animating ? "translateY(-6px)" : "translateY(0)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              {/* Home team */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xl leading-none shrink-0">{match.homeNationFlag}</span>
                <span className="text-xs font-heading font-bold uppercase tracking-wide text-foreground truncate hidden sm:block">
                  {match.homeNationName}
                </span>
                <span className="text-xs font-heading font-bold uppercase tracking-wide text-foreground sm:hidden shrink-0">
                  {match.homeNationCode}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-lg font-black text-red-400 tabular-nums leading-none">
                  {match.homeScore ?? 0}
                </span>
                <span className="text-xs font-bold text-muted-foreground">–</span>
                <span className="font-mono text-lg font-black text-red-400 tabular-nums leading-none">
                  {match.awayScore ?? 0}
                </span>
              </div>

              {/* Away team */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-heading font-bold uppercase tracking-wide text-foreground truncate hidden sm:block">
                  {match.awayNationName}
                </span>
                <span className="text-xs font-heading font-bold uppercase tracking-wide text-foreground sm:hidden shrink-0">
                  {match.awayNationCode}
                </span>
                <span className="text-xl leading-none shrink-0">{match.awayNationFlag}</span>
              </div>

              {/* Stage badge */}
              {match.stage && (
                <span className="hidden md:block text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border/60 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  {match.stage}
                </span>
              )}
            </div>
          </Link>

          {/* Right side: pagination dots + CTA */}
          <div className="flex items-center gap-3 ml-3 pl-3 border-l border-red-500/30 shrink-0">

            {/* Dots for multiple matches */}
            {count > 1 && (
              <div className="flex items-center gap-1">
                {matches.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveIdx(i); setAnimating(false); }}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIdx
                        ? "w-4 h-1.5 bg-red-400"
                        : "w-1.5 h-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Match count badge */}
            {count > 1 && (
              <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap hidden sm:block">
                {activeIdx + 1}/{count} live
              </span>
            )}

            {/* View CTA */}
            <Link href={`/matches/${match.id}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors whitespace-nowrap">
                Watch →
              </span>
            </Link>
          </div>
        </div>

        {/* Progress bar that cycles with the interval */}
        {count > 1 && (
          <div className="absolute bottom-0 left-0 h-[2px] bg-red-500/30 w-full">
            <div
              className="h-full bg-red-500/70"
              style={{
                animation: "tickerProgress 4s linear infinite",
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes tickerPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes tickerProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
