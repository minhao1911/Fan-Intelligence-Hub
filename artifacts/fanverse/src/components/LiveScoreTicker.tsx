import { useListMatches, getListMatchesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useRef, useEffect } from "react";

export default function LiveScoreTicker() {
  const liveParams = { status: "live", limit: 20 } as const;
  const { data: liveMatches } = useListMatches(
    liveParams,
    { query: { queryKey: getListMatchesQueryKey(liveParams), refetchInterval: 30_000 } },
  );

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let animationId: number;
    let x = 0;

    const speed = 0.6;

    function tick() {
      if (!track) return;
      x -= speed;
      const half = track.scrollWidth / 2;
      if (Math.abs(x) >= half) x = 0;
      track.style.transform = `translateX(${x}px)`;
      animationId = requestAnimationFrame(tick);
    }

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [liveMatches]);

  if (!liveMatches || liveMatches.length === 0) return null;

  const items = [...liveMatches, ...liveMatches];

  return (
    <div className="fixed top-14 left-0 right-0 z-40 h-8 bg-red-950/95 backdrop-blur-sm border-b border-red-500/30 overflow-hidden flex items-center">
      <div className="shrink-0 flex items-center gap-2 px-3 bg-red-600 h-full z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-heading font-bold text-white uppercase tracking-widest whitespace-nowrap">
          Live
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div ref={trackRef} className="flex items-center gap-0 whitespace-nowrap will-change-transform">
          {items.map((match, i) => (
            <Link
              key={`${match.id}-${i}`}
              href={`/matches/${match.id}`}
              className="inline-flex items-center gap-2 px-5 h-8 hover:bg-red-500/20 transition-colors cursor-pointer group shrink-0"
            >
              <span className="text-base leading-none">{match.homeNationFlag}</span>
              <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors truncate max-w-[5rem]">
                {match.homeNationName}
              </span>
              <span className="font-heading text-sm font-bold text-red-400 tabular-nums">
                {match.homeScore ?? 0} – {match.awayScore ?? 0}
              </span>
              <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors truncate max-w-[5rem]">
                {match.awayNationName}
              </span>
              <span className="text-base leading-none">{match.awayNationFlag}</span>
              <span className="text-red-500/60 text-xs ml-2 font-mono">·</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
