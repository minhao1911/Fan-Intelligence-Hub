import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useListNations } from "@workspace/api-client-react";
import { Swords, ChevronRight, Zap, Users } from "lucide-react";

const STORAGE_KEY = "fanverse_rivalry_vote_v1";

function loadVote(): { nationCode: string; pair: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveVote(nationCode: string, pair: string) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ nationCode, pair })); } catch {}
}

export default function NationRivalryCard() {
  const { data: nations } = useListNations({});

  // Derive the rivalry: highest confidence vs lowest confidence
  const { home, away } = useMemo(() => {
    if (!nations || nations.length < 2) return { home: null, away: null };
    const sorted = [...nations]
      .filter((n) => (n.confidenceScore ?? 0) > 0)
      .sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0));
    if (sorted.length < 2) return { home: null, away: null };
    return { home: sorted[0], away: sorted[sorted.length - 1] };
  }, [nations]);

  const pairKey = home && away ? `${home.code}_${away.code}` : "";

  // Local vote state — seeded from localStorage + simulated crowd
  const [votes, setVotes] = useState<{ home: number; away: number }>({ home: 0, away: 0 });
  const [picked, setPicked] = useState<"home" | "away" | null>(null);
  const [pulse, setPulse] = useState<"home" | "away" | null>(null);

  // Seed simulated votes once nations load
  useEffect(() => {
    if (!home || !away) return;
    const hScore = home.confidenceScore ?? 50;
    const aScore = away.confidenceScore ?? 50;
    const total = 800 + Math.floor(Math.random() * 400);
    const hVotes = Math.round((hScore / (hScore + aScore)) * total);
    setVotes({ home: hVotes, away: total - hVotes });

    // Restore prior vote for this pair
    const saved = loadVote();
    if (saved && saved.pair === `${home.code}_${away.code}`) {
      setPicked(saved.nationCode === home.code ? "home" : "away");
    } else {
      setPicked(null);
    }
  }, [home?.code, away?.code]);

  // Simulate incoming votes every ~4s to feel live
  useEffect(() => {
    if (!home || !away) return;
    const id = setInterval(() => {
      const side: "home" | "away" = Math.random() > 0.45 ? "home" : "away";
      const bump = Math.floor(Math.random() * 4) + 1;
      setVotes((v) => ({ ...v, [side]: v[side] + bump }));
      setPulse(side);
      setTimeout(() => setPulse(null), 600);
    }, 3800 + Math.random() * 1200);
    return () => clearInterval(id);
  }, [home?.code, away?.code]);

  const handleVote = (side: "home" | "away") => {
    if (picked || !home || !away) return;
    setPicked(side);
    setVotes((v) => ({ ...v, [side]: v[side] + 1 }));
    saveVote(side === "home" ? home.code : away.code, pairKey);
    setPulse(side);
    setTimeout(() => setPulse(null), 600);
  };

  if (!home || !away) return null;

  const total = votes.home + votes.away || 1;
  const homePct = Math.round((votes.home / total) * 100);
  const awayPct = 100 - homePct;
  const gap = Math.abs(home.confidenceScore ?? 50) - Math.abs(away.confidenceScore ?? 50);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
      {/* Background split gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to right,
            rgba(250,204,21,0.04) 0%, rgba(250,204,21,0.04) 48%,
            transparent 48%, transparent 52%,
            rgba(59,130,246,0.04) 52%, rgba(59,130,246,0.04) 100%)`,
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/30 via-transparent to-blue-500/30" />

      <div className="relative px-5 pt-4 pb-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center">
              <Swords className="h-3 w-3 text-foreground" />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
              Nation Rivalry
            </p>
            <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground border border-border px-1.5 py-0.5 rounded">
              {gap >= 15 ? "🔥 Fierce" : gap >= 8 ? "⚡ Heated" : "🤝 Close Call"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {total.toLocaleString()} votes
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3 mb-4">
          {/* Home nation */}
          <button
            type="button"
            disabled={!!picked}
            onClick={() => handleVote("home")}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all duration-200 ${
              picked === "home"
                ? "border-primary bg-primary/15 shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                : picked === "away"
                ? "border-border/40 bg-secondary/20 opacity-50"
                : "border-border bg-secondary/40 hover:border-primary/50 hover:bg-primary/8 cursor-pointer active:scale-95"
            } ${pulse === "home" ? "scale-[1.02]" : ""}`}
            style={{ transition: "transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease" }}
          >
            <span className="text-4xl leading-none">{home.flagEmoji}</span>
            <span className="text-xs font-heading font-bold text-foreground text-center leading-tight max-w-[90px]">
              {home.name}
            </span>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold text-primary">
                {home.confidenceScore ?? 0}% confidence
              </span>
            </div>
            {picked === "home" && (
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">
                Your Pick ✓
              </span>
            )}
            {!picked && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Tap to back
              </span>
            )}
          </button>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-lg font-heading font-black text-muted-foreground/60">VS</span>
            <div className="w-px h-8 bg-border" />
          </div>

          {/* Away nation */}
          <button
            type="button"
            disabled={!!picked}
            onClick={() => handleVote("away")}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all duration-200 ${
              picked === "away"
                ? "border-blue-500 bg-blue-500/15 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                : picked === "home"
                ? "border-border/40 bg-secondary/20 opacity-50"
                : "border-border bg-secondary/40 hover:border-blue-500/50 hover:bg-blue-500/8 cursor-pointer active:scale-95"
            } ${pulse === "away" ? "scale-[1.02]" : ""}`}
            style={{ transition: "transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease" }}
          >
            <span className="text-4xl leading-none">{away.flagEmoji}</span>
            <span className="text-xs font-heading font-bold text-foreground text-center leading-tight max-w-[90px]">
              {away.name}
            </span>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400">
                {away.confidenceScore ?? 0}% confidence
              </span>
            </div>
            {picked === "away" && (
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Your Pick ✓
              </span>
            )}
            {!picked && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Tap to back
              </span>
            )}
          </button>
        </div>

        {/* Vote split bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
            <span className={`text-primary transition-all duration-300 ${pulse === "home" ? "scale-110" : ""}`}>
              {homePct}%
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-2.5 w-2.5" /> Live split
            </span>
            <span className={`text-blue-400 transition-all duration-300 ${pulse === "away" ? "scale-110" : ""}`}>
              {awayPct}%
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-secondary flex">
            <div
              className="h-full bg-gradient-to-r from-primary to-yellow-300 transition-all duration-500 ease-out rounded-l-full"
              style={{ width: `${homePct}%` }}
            />
            <div
              className="h-full bg-gradient-to-l from-blue-500 to-blue-400 transition-all duration-500 ease-out rounded-r-full flex-1"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground">
            {picked
              ? "Thanks for voting! Votes update live."
              : "Pick a side — no login needed."}
          </p>
          <Link href="/nations">
            <span className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer">
              All Nations <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
