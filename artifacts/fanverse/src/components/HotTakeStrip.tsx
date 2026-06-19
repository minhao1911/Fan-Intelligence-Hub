import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useListDiscussions } from "@workspace/api-client-react";
import { Flame, ChevronLeft, ChevronRight, ArrowUpRight, MessageSquare } from "lucide-react";

const CYCLE_MS  = 5_000;   // rotate every 5 s
const REFETCH_MS = 60_000; // server refetch every 60 s

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const TIER_COLORS: Record<string, string> = {
  legend:   "text-yellow-400",
  elite:    "text-purple-400",
  veteran:  "text-blue-400",
  fan:      "text-emerald-400",
  newcomer: "text-muted-foreground",
};

export default function HotTakeStrip() {
  const { data: discussions, refetch } = useListDiscussions({ limit: 20 });
  const [idx, setIdx] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const [visible, setVisible] = useState(true);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort by upvotes desc, take top 3
  const discussionsList = Array.isArray(discussions) ? discussions : [];
  const hot = discussionsList
    .slice()
    .sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
    .slice(0, 3);

  // Auto-cycle
  useEffect(() => {
    if (hot.length <= 1) return;
    cycleRef.current = setTimeout(() => advance("left"), CYCLE_MS);
    return () => { if (cycleRef.current) clearTimeout(cycleRef.current); };
  });

  // Server refetch
  useEffect(() => {
    const id = setInterval(() => refetch(), REFETCH_MS);
    return () => clearInterval(id);
  }, [refetch]);

  function advance(dir: "left" | "right") {
    if (cycleRef.current) clearTimeout(cycleRef.current);
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => {
      setIdx((i) => {
        if (dir === "left") return (i + 1) % hot.length;
        return (i - 1 + hot.length) % hot.length;
      });
      setVisible(true);
      setAnimDir(null);
    }, 180);
  }

  if (!hot.length) return null;

  const take = hot[idx];
  const tierColor = TIER_COLORS[take.reputationTier ?? "fan"] ?? TIER_COLORS.fan;

  return (
    <div className="relative rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-950/30 via-card to-card overflow-hidden">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

      <div className="flex items-center gap-0">

        {/* Flame label */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-r border-orange-500/20 bg-orange-500/8">
          <Flame className="h-4 w-4 text-orange-400 shrink-0" style={{ filter: "drop-shadow(0 0 6px rgba(251,146,60,0.7))" }} />
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-400 leading-none">Hot</span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-400 leading-none">Take</span>
          </div>
        </div>

        {/* Prev button */}
        {hot.length > 1 && (
          <button
            type="button"
            onClick={() => advance("right")}
            className="shrink-0 px-2 py-3 text-muted-foreground hover:text-orange-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Take content — animated */}
        <Link href={`/discussions/${take.id}`} className="flex-1 min-w-0">
          <div
            className="flex items-center gap-3 px-2 py-3 cursor-pointer group"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible
                ? "translateX(0)"
                : animDir === "left"
                ? "translateX(-8px)"
                : "translateX(8px)",
              transition: "opacity 180ms ease, transform 180ms ease",
            }}
          >
            {/* Meta */}
            <div className="shrink-0 hidden sm:flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-bold text-orange-400 font-mono tabular-nums">
                🔥 {take.upvotes ?? 0}
              </span>
              <span className="text-[9px] text-muted-foreground">{timeAgo(take.createdAt)}</span>
            </div>

            {/* Title + author */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate group-hover:text-orange-400 transition-colors leading-tight">
                {take.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-semibold ${tierColor}`}>
                  {take.username}
                </span>
                {take.userNationCode && (
                  <span className="text-[9px] text-primary border border-primary/25 bg-primary/5 px-1 py-px rounded font-bold uppercase">
                    {take.userNationCode}
                  </span>
                )}
                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                  <MessageSquare className="h-2.5 w-2.5" /> {take.commentCount ?? 0}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-400 transition-colors shrink-0" />
          </div>
        </Link>

        {/* Next button */}
        {hot.length > 1 && (
          <button
            type="button"
            onClick={() => advance("left")}
            className="shrink-0 px-2 py-3 text-muted-foreground hover:text-orange-400 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Dot indicators */}
        {hot.length > 1 && (
          <div className="shrink-0 flex items-center gap-1 pr-3">
            {hot.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => advance(i > idx ? "left" : "right")}
                className={`rounded-full transition-all duration-300 ${
                  i === idx
                    ? "w-4 h-1.5 bg-orange-400"
                    : "w-1.5 h-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
