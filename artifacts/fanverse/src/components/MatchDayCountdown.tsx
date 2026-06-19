import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useListMatches } from "@workspace/api-client-react";
import { Timer, Target, Activity, Users, Zap, ChevronRight } from "lucide-react";

const WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(ms: number) {
  if (ms <= 0) return { h: "00", m: "00", s: "00", total: 0 };
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h: pad(h), m: pad(m), s: pad(s), total };
}

export default function MatchDayCountdown() {
  const now = useNow();
  const { data: upcoming } = useListMatches({ status: "upcoming", limit: 10 });
  const { data: live } = useListMatches({ status: "live", limit: 1 });

  const liveMatch = live?.[0] ?? null;

  const soonMatch = useMemo(() => {
    if (!upcoming) return null;
    return (
      upcoming
        .map((m) => ({ ...m, msUntil: new Date(m.scheduledAt).getTime() - now }))
        .filter((m) => m.msUntil > 0 && m.msUntil <= WINDOW_MS)
        .sort((a, b) => a.msUntil - b.msUntil)[0] ?? null
    );
  }, [upcoming, now]);

  if (!liveMatch && !soonMatch) return null;

  const match = liveMatch ?? soonMatch!;
  const isLive = !!liveMatch;
  const msLeft = soonMatch ? soonMatch.msUntil : 0;
  const { h, m, s } = formatCountdown(msLeft);
  const urgency = msLeft <= 30 * 60 * 1000; // < 30 mins → red pulse

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border ${
        isLive
          ? "border-red-500/40 bg-gradient-to-r from-red-900/20 via-card to-card"
          : urgency
          ? "border-orange-500/40 bg-gradient-to-r from-orange-900/15 via-card to-card"
          : "border-primary/30 bg-gradient-to-r from-primary/8 via-card to-card"
      }`}
    >
      {/* Top shimmer line */}
      <div
        className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${
          isLive ? "via-red-500/70" : urgency ? "via-orange-500/60" : "via-primary/50"
        } to-transparent`}
      />

      <div className="relative px-5 py-4">
        {/* ── Top row: badge + match name ── */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Live Now
              </span>
            ) : (
              <span
                className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  urgency
                    ? "text-orange-400 bg-orange-500/15 border-orange-500/30"
                    : "text-primary bg-primary/10 border-primary/25"
                }`}
              >
                <Timer className="h-2.5 w-2.5" />
                Kick-off Soon
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
              {match.competition} · {match.stage}
            </span>
          </div>

          <Link href={`/matches/${match.id}`}>
            <span className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer">
              Details <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>

        {/* ── Teams row ── */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Home */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-4xl leading-none shrink-0">{match.homeNationFlag}</span>
            <span className="font-heading font-black text-foreground text-lg truncate leading-tight">
              {match.homeNationName}
            </span>
          </div>

          {/* Score / countdown */}
          <div className="shrink-0 text-center">
            {isLive ? (
              <div className="flex items-center gap-1">
                <span className="text-3xl font-heading font-black text-red-400 tabular-nums">
                  {match.homeScore ?? 0}
                </span>
                <span className="text-xl font-heading text-red-400/60 font-black">–</span>
                <span className="text-3xl font-heading font-black text-red-400 tabular-nums">
                  {match.awayScore ?? 0}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {[
                  { val: h, unit: "H" },
                  { val: m, unit: "M" },
                  { val: s, unit: "S" },
                ].map(({ val, unit }, i) => (
                  <div key={unit} className="flex items-center gap-0.5">
                    {i > 0 && (
                      <span className={`text-lg font-heading font-black ${urgency ? "text-orange-400" : "text-primary"} opacity-50`}>
                        :
                      </span>
                    )}
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-2xl font-heading font-black tabular-nums leading-none ${
                          urgency ? "text-orange-400" : "text-primary"
                        }`}
                      >
                        {val}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                        {unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
            <span className="font-heading font-black text-foreground text-lg truncate text-right leading-tight">
              {match.awayNationName}
            </span>
            <span className="text-4xl leading-none shrink-0">{match.awayNationFlag}</span>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/predictions">
            <button
              type="button"
              className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all duration-150 cursor-pointer ${
                isLive
                  ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border-primary/25 bg-primary/8 text-primary hover:bg-primary/15"
              }`}
            >
              <Target className="h-4 w-4" />
              Predict
            </button>
          </Link>

          <Link href="/pulse">
            <button
              type="button"
              className="w-full flex flex-col items-center gap-1 py-2.5 rounded-xl border border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-primary text-xs font-bold uppercase tracking-wide transition-all duration-150 cursor-pointer"
            >
              <Activity className="h-4 w-4" />
              Vote
            </button>
          </Link>

          <Link href="/groups">
            <button
              type="button"
              className="w-full flex flex-col items-center gap-1 py-2.5 rounded-xl border border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-primary text-xs font-bold uppercase tracking-wide transition-all duration-150 cursor-pointer"
            >
              <Users className="h-4 w-4" />
              Rally
            </button>
          </Link>
        </div>

        {/* ── Hype line ── */}
        {!isLive && (
          <p
            className={`mt-3 text-center text-[11px] font-semibold ${
              urgency ? "text-orange-400" : "text-muted-foreground"
            }`}
          >
            {urgency ? (
              <>
                <Zap className="h-3 w-3 inline mr-1 text-orange-400" />
                Less than 30 minutes — lock in your prediction now!
              </>
            ) : (
              <>
                <Timer className="h-3 w-3 inline mr-1" />
                Make your prediction before kick-off for bonus XP.
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
