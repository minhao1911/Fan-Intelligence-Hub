import { useEffect, useState } from "react";
import { Link } from "wouter";
import messiImg from "@assets/players/messi.png";
import ronaldoImg from "@assets/players/ronaldo.png";
import mbappeImg from "@assets/players/mbappe.png";
import neymarImg from "@assets/players/neymar.png";
import { useGetGlobalStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Activity, Users, BarChart3, Shield, Star, Zap } from "lucide-react";

const FOOTBALL_SVG = (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
    <circle cx="50" cy="50" r="46" stroke="rgba(250,204,21,0.6)" strokeWidth="4" fill="none"/>
    <polygon points="50,18 62,28 58,42 42,42 38,28" fill="rgba(250,204,21,0.12)" stroke="rgba(250,204,21,0.5)" strokeWidth="2.5"/>
    <polygon points="18,38 30,32 38,42 32,56 18,54" fill="rgba(250,204,21,0.10)" stroke="rgba(250,204,21,0.4)" strokeWidth="2.5"/>
    <polygon points="82,38 70,32 62,42 68,56 82,54" fill="rgba(250,204,21,0.10)" stroke="rgba(250,204,21,0.4)" strokeWidth="2.5"/>
    <polygon points="26,72 32,58 42,58 50,68 44,80" fill="rgba(250,204,21,0.10)" stroke="rgba(250,204,21,0.4)" strokeWidth="2.5"/>
    <polygon points="74,72 68,58 58,58 50,68 56,80" fill="rgba(250,204,21,0.10)" stroke="rgba(250,204,21,0.4)" strokeWidth="2.5"/>
    <line x1="50" y1="18" x2="38" y2="28" stroke="rgba(250,204,21,0.3)" strokeWidth="1.5"/>
    <line x1="50" y1="18" x2="62" y2="28" stroke="rgba(250,204,21,0.3)" strokeWidth="1.5"/>
    <line x1="18" y1="38" x2="30" y2="32" stroke="rgba(250,204,21,0.3)" strokeWidth="1.5"/>
    <line x1="82" y1="38" x2="70" y2="32" stroke="rgba(250,204,21,0.3)" strokeWidth="1.5"/>
    <line x1="26" y1="72" x2="32" y2="58" stroke="rgba(250,204,21,0.3)" strokeWidth="1.5"/>
    <line x1="74" y1="72" x2="68" y2="58" stroke="rgba(250,204,21,0.3)" strokeWidth="1.5"/>
  </svg>
);

const STAR_SVG = (
  <svg viewBox="0 0 24 24" fill="none" style={{width:"100%",height:"100%"}}>
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="rgba(250,204,21,0.35)" stroke="rgba(250,204,21,0.5)" strokeWidth="0.8"/>
  </svg>
);


type TickerMatch = {
  id: number;
  homeNationFlag: string;
  homeNationName: string;
  awayNationFlag: string;
  awayNationName: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeConfidence: number | null;
  awayConfidence: number | null;
  stage: string;
};

function MatchTicker() {
  const [matches, setMatches] = useState<TickerMatch[]>([]);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data: TickerMatch[]) => setMatches(data.slice(0, 12)))
      .catch(() => {});
  }, []);

  if (matches.length === 0) return null;

  const doubled = [...matches, ...matches];

  return (
    <div className="relative overflow-hidden border-b border-primary/10 bg-black/30 backdrop-blur-sm z-40">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/60 to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/60 to-transparent z-10 pointer-events-none" />

      {/* LIVE label */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-20 pl-3 pr-4 bg-gradient-to-r from-background via-background/95 to-transparent">
        <span className="flex items-center gap-1.5 font-heading font-black text-[10px] uppercase tracking-widest text-primary whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
          Live
        </span>
      </div>

      <div className="flex" style={{ animation: "ticker-scroll 60s linear infinite", width: "max-content" }}>
        {doubled.map((m, i) => {
          const isLive = m.status === "live";
          const isCompleted = m.status === "completed";
          return (
            <div
              key={`${m.id}-${i}`}
              className="flex items-center gap-2 px-5 py-2 border-r border-white/5 shrink-0"
            >
              {/* Status dot */}
              <span className={`w-1 h-1 rounded-full shrink-0 ${isLive ? "bg-red-500 animate-pulse" : isCompleted ? "bg-muted-foreground/40" : "bg-primary/40"}`} />

              {/* Home */}
              <span className="text-sm leading-none">{m.homeNationFlag}</span>
              <span className={`font-heading font-bold text-[11px] uppercase tracking-wide ${isLive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {m.homeNationName.split(" ").pop()}
              </span>

              {/* Score or confidence */}
              {isCompleted || isLive ? (
                <span className={`font-heading font-black text-xs px-1.5 py-0.5 rounded ${isLive ? "bg-red-500/15 text-red-400" : "bg-muted/50 text-foreground"}`}>
                  {m.homeScore ?? 0} – {m.awayScore ?? 0}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-primary/60 px-1.5 py-0.5 rounded bg-primary/5">
                  {m.homeConfidence != null ? `${Math.round(m.homeConfidence)}%` : "vs"}
                </span>
              )}

              {/* Away */}
              <span className={`font-heading font-bold text-[11px] uppercase tracking-wide ${isLive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {m.awayNationName.split(" ").pop()}
              </span>
              <span className="text-sm leading-none">{m.awayNationFlag}</span>

              {/* Stage label */}
              <span className="text-[9px] text-muted-foreground/40 font-mono ml-1 hidden sm:inline">{m.stage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type NationRow = { code: string; name: string; flagEmoji: string; confederation: string; memberCount: number; confidenceScore: number };

const CONF_COLORS: Record<string, string> = {
  UEFA: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  CONMEBOL: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  CONCACAF: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  CAF: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  AFC: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

function NationPulsePreview() {
  const [nations, setNations] = useState<NationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/nations")
      .then((r) => r.json())
      .then((data: NationRow[]) => {
        const sorted = [...data]
          .map((n) => ({ ...n, confidenceScore: n.confidenceScore ?? 0 }))
          .sort((a, b) => b.confidenceScore - a.confidenceScore)
          .slice(0, 5);
        setNations(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-4 sm:px-6 py-20 max-w-4xl mx-auto w-full">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-primary font-heading uppercase tracking-widest text-xs font-bold mb-2">Live Data</p>
          <h2 className="text-2xl md:text-3xl font-heading font-black uppercase text-foreground">Nation Pulse</h2>
          <p className="text-sm text-muted-foreground mt-1">Most confident fan bases right now</p>
        </div>
        <Link href="/sign-up">
          <Button size="sm" variant="outline" className="text-xs font-heading uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/10 hidden sm:flex">
            Join a Nation <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-card/60 border border-border animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
            ))
          : nations.map((nation, i) => {
              const confColor = CONF_COLORS[nation.confederation] ?? "text-slate-400 bg-slate-400/10 border-slate-400/20";
              const barWidth = Math.max(4, Math.round(nation.confidenceScore));
              const rank = i + 1;
              const isTop = rank === 1;
              return (
                <div
                  key={nation.code}
                  className={`relative rounded-2xl border px-5 py-4 flex items-center gap-4 overflow-hidden transition-all hover:border-primary/30 hover:bg-primary/3 ${
                    isTop ? "border-primary/30 bg-primary/5" : "border-border bg-card/60"
                  }`}
                >
                  {isTop && (
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                  )}
                  {/* Rank */}
                  <span className={`font-mono font-black text-sm w-5 shrink-0 ${isTop ? "text-primary" : "text-muted-foreground/40"}`}>
                    #{rank}
                  </span>
                  {/* Flag */}
                  <span className="text-3xl leading-none select-none shrink-0">{nation.flagEmoji}</span>
                  {/* Name + conf */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-heading font-black uppercase text-sm text-foreground truncate">{nation.name}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border shrink-0 ${confColor}`}>
                        {nation.confederation}
                      </span>
                    </div>
                    {/* Confidence bar */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isTop ? "bg-primary" : "bg-primary/50"}`}
                          style={{ width: `${barWidth}%`, transition: "width 0.8s ease" }}
                        />
                      </div>
                      <span className={`text-xs font-heading font-black tabular-nums shrink-0 ${isTop ? "text-primary" : "text-muted-foreground"}`}>
                        {nation.confidenceScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Members */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-sm font-heading font-black text-foreground">{nation.memberCount.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">fans</div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="mt-6 text-center">
        <Link href="/sign-up">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary font-heading uppercase tracking-widest">
            See all nations <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const { data: stats, isLoading } = useGetGlobalStats();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 400 400" className="w-7 h-7 text-primary">
            <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="24" opacity="0.8"/>
            <path d="M 200 60 L 200 340 M 60 200 L 340 200 M 100 100 L 300 300 M 100 300 L 300 100" stroke="currentColor" strokeWidth="12" opacity="0.4"/>
          </svg>
          <span className="font-heading text-xl font-bold uppercase tracking-widest">
            Fan<span className="text-primary">Verse</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted/50">
            Sign In
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="font-heading uppercase tracking-wide shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_28px_rgba(250,204,21,0.35)] transition-shadow">
              Join Now
            </Button>
          </Link>
        </div>
      </header>

      <MatchTicker />

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 lg:py-36 overflow-hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-5%,rgba(250,204,21,0.13),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_105%,rgba(250,204,21,0.05),transparent)]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:"linear-gradient(rgba(250,204,21,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(250,204,21,0.4) 1px,transparent 1px)", backgroundSize:"60px 60px"}} />

          {/* Star player silhouettes */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">

            {/* LEFT: Messi */}
            <div className="absolute bottom-0 left-0 sm:left-[1%] lg:left-[3%] flex flex-col items-center">
              <div className="relative h-[220px] sm:h-[280px] md:h-[320px] lg:h-[360px] xl:h-[420px]">
                <img src={messiImg} alt="Messi" className="h-full w-auto object-contain object-bottom" style={{filter:"drop-shadow(0 0 24px rgba(250,204,21,0.25)) drop-shadow(0 0 8px rgba(250,204,21,0.15))"}} />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
              <span className="font-heading font-black uppercase tracking-[0.3em] text-[10px] text-primary/50 mt-1">Messi</span>
            </div>

            {/* RIGHT: Ronaldo */}
            <div className="absolute bottom-0 right-0 sm:right-[1%] lg:right-[3%] flex flex-col items-center">
              <div className="relative h-[220px] sm:h-[280px] md:h-[320px] lg:h-[360px] xl:h-[420px]">
                <img src={ronaldoImg} alt="Ronaldo" className="h-full w-auto object-contain object-bottom" style={{filter:"drop-shadow(0 0 24px rgba(250,204,21,0.25)) drop-shadow(0 0 8px rgba(250,204,21,0.15))"}} />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
              <span className="font-heading font-black uppercase tracking-[0.3em] text-[10px] text-primary/50 mt-1">Ronaldo</span>
            </div>

            {/* FAR LEFT: Mbappé — visible from lg up */}
            <div className="absolute bottom-0 left-[-8%] lg:left-[-4%] xl:left-[-1%] flex flex-col items-center opacity-0 lg:opacity-60 xl:opacity-70" style={{animation:"player-breathe 6s ease-in-out 0.8s infinite", transformOrigin:"bottom center"}}>
              <div className="relative h-[260px] xl:h-[320px]">
                <img src={mbappeImg} alt="Mbappé" className="h-full w-auto object-contain object-bottom" style={{filter:"drop-shadow(0 0 16px rgba(250,204,21,0.2)) saturate(0.85) brightness(0.8)"}} />
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
              <span className="font-heading font-black uppercase tracking-[0.3em] text-[9px] text-primary/30 mt-1">Mbappé</span>
            </div>

            {/* FAR RIGHT: Neymar — visible from lg up */}
            <div className="absolute bottom-0 right-[-8%] lg:right-[-4%] xl:right-[-1%] flex flex-col items-center opacity-0 lg:opacity-60 xl:opacity-70" style={{animation:"player-sway 9s ease-in-out 2.2s infinite", transformOrigin:"bottom center"}}>
              <div className="relative h-[260px] xl:h-[320px]">
                <img src={neymarImg} alt="Neymar" className="h-full w-auto object-contain object-bottom" style={{filter:"drop-shadow(0 0 16px rgba(250,204,21,0.2)) saturate(0.85) brightness(0.8)"}} />
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
              <span className="font-heading font-black uppercase tracking-[0.3em] text-[9px] text-primary/30 mt-1">Neymar</span>
            </div>

            {/* Ground line glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />

            {/* Spotlight effects under each player */}
            <div className="absolute bottom-0 left-[8%] lg:left-[10%] w-48 h-32 bg-[radial-gradient(ellipse_at_bottom,rgba(250,204,21,0.08),transparent_70%)] hidden lg:block" style={{animation:"spotlight-pulse 7s ease-in-out infinite"}} />
            <div className="absolute bottom-0 right-[8%] lg:right-[10%] w-48 h-32 bg-[radial-gradient(ellipse_at_bottom,rgba(250,204,21,0.08),transparent_70%)] hidden lg:block" style={{animation:"spotlight-pulse 8s ease-in-out 1.5s infinite"}} />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src="/fanverse-logo.png" alt="FanVerse" className="w-24 h-24 rounded-2xl object-cover shadow-[0_0_40px_rgba(0,200,255,0.25)]" />
            </div>

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Fan Intelligence Platform · World Cup 2026
            </div>

            <h1 className="text-5xl md:text-[5.5rem] font-heading font-black uppercase tracking-tight text-foreground mb-5 leading-[0.95]">
              The Digital Home<br />
              of <span className="text-primary">Global Football</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Measure fan confidence, gauge matchday sentiment, and amplify your community's voice on the international stage.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-sm h-11 px-8 font-heading uppercase tracking-widest shadow-[0_0_24px_rgba(250,204,21,0.25)] hover:shadow-[0_0_36px_rgba(250,204,21,0.4)] transition-all">
                  Enter the Stadium <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm h-11 px-8 font-heading uppercase tracking-widest border-border/50 text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Reputation tier preview */}
            <div className="mt-10 flex items-center justify-center gap-1.5 flex-wrap">
              {[
                { label: "Casual", color: "text-slate-400 border-slate-400/20 bg-slate-400/5" },
                { label: "Fan", color: "text-sky-400 border-sky-400/20 bg-sky-400/5" },
                { label: "Capo", color: "text-violet-400 border-violet-400/20 bg-violet-400/5" },
                { label: "Ultras", color: "text-primary border-primary/30 bg-primary/8" },
              ].map(({ label, color }) => (
                <span key={label} className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${color}`}>
                  {label}
                </span>
              ))}
              <span className="text-[10px] text-muted-foreground/50 ml-1">Fan Tiers</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 sm:px-6 pb-20 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Users className="h-5 w-5 text-primary" />, value: stats?.totalFans, label: "Active Fans", suffix: "" },
              { icon: <Activity className="h-5 w-5 text-primary" />, value: stats?.totalVotesCast, label: "Pulse Votes Cast", featured: true, suffix: "" },
              { icon: <Globe className="h-5 w-5 text-primary" />, value: stats?.totalNationsActive, label: "Nations Represented", suffix: "" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl p-6 border transition-all hover:border-primary/20 ${item.featured
                  ? "border-primary/25 bg-primary/5 relative overflow-hidden"
                  : "border-border bg-card/60"
                }`}
              >
                {item.featured && (
                  <>
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
                  </>
                )}
                <div className="flex items-center gap-2 mb-3">
                  {item.icon}
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                </div>
                <div className="text-4xl font-heading font-black text-foreground">
                  {isLoading ? (
                    <div className="h-10 w-20 bg-muted/60 rounded animate-pulse" />
                  ) : (
                    (item.value?.toLocaleString() || "0") + item.suffix
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Nation Pulse Preview */}
        <NationPulsePreview />

        {/* How it works */}
        <section className="bg-card/40 border-t border-b border-border/50 px-4 sm:px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-primary font-heading uppercase tracking-widest text-xs font-bold mb-3">How It Works</p>
              <h2 className="text-3xl font-heading font-black uppercase text-foreground">Your Fan Journey</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  step: "01",
                  icon: <Shield className="w-6 h-6 text-primary" />,
                  title: "Join Your Nation",
                  desc: "Pick your allegiance and become part of your nation's fanbase. Your community, your voice.",
                },
                {
                  step: "02",
                  icon: <BarChart3 className="w-6 h-6 text-primary" />,
                  title: "Cast Your Signals",
                  desc: "Vote in match polls, post reactions, and start discussions to shape the Nation Pulse.",
                },
                {
                  step: "03",
                  icon: <Star className="w-6 h-6 text-primary" />,
                  title: "Build Reputation",
                  desc: "Earn points for every action. Climb from Casual to Fan, Capo, and the elite Ultras tier.",
                },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <span className="font-mono text-xs text-primary font-bold">{item.step}</span>
                  </div>
                  <h3 className="font-heading font-black uppercase text-base text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* XP callout */}
        <section className="px-4 sm:px-6 py-14 max-w-4xl mx-auto w-full">
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_50%,rgba(250,204,21,0.07),transparent)] pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-heading font-black uppercase text-lg text-foreground mb-1">Earn Points Every Match</p>
              <p className="text-muted-foreground text-sm">Vote, react, discuss and predict to build your reputation. Top fans climb to Ultras — the elite tier.</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {[{pts: "+5", label: "Vote"}, {pts: "+8", label: "Discuss"}, {pts: "+15", label: "Correct"}, {pts: "+35", label: "Exact"}].map(({pts, label}) => (
                <div key={label} className="text-center px-3 py-2 rounded-xl bg-background/80 border border-primary/15">
                  <div className="font-heading font-black text-primary text-lg leading-none">{pts}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-bold">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="px-4 sm:px-6 pb-20 max-w-4xl mx-auto w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-heading font-black uppercase text-foreground">Everything in One Place</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { emoji: "🏟️", title: "Match Center", desc: "Live scores, upcoming fixtures, and fan confidence across every game." },
              { emoji: "🌍", title: "Nation Communities", desc: "Join your fanbase, see pulse analytics, and connect with fans globally." },
              { emoji: "📊", title: "Nation Pulse", desc: "Macro analytics of global fan sentiment — confidence, mood, trends." },
              { emoji: "💬", title: "Discussions", desc: "Threaded forums for tactical analysis, predictions, and reactions." },
              { emoji: "🏆", title: "Global Leaderboard", desc: "Ranked by reputation, filterable by nation. Ultras rise to the top." },
              { emoji: "🎯", title: "Predictions", desc: "Predict outcomes and scores. Earn bonus XP for every correct call." },
            ].map((f) => (
              <div key={f.title} className="flex gap-3.5 p-4 bg-card/60 border border-border/50 rounded-xl hover:border-primary/20 hover:bg-card transition-all">
                <span className="text-2xl leading-none shrink-0 mt-0.5">{f.emoji}</span>
                <div>
                  <h4 className="font-heading font-bold uppercase text-xs mb-1.5 text-foreground tracking-wide">{f.title}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card/40 border-t border-border/50 px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 400 400" className="w-8 h-8 text-primary">
                <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="24" opacity="0.8"/>
                <path d="M 200 60 L 200 340 M 60 200 L 340 200 M 100 100 L 300 300 M 100 300 L 300 100" stroke="currentColor" strokeWidth="12" opacity="0.4"/>
              </svg>
            </div>
            <h2 className="text-3xl font-heading font-black uppercase text-foreground mb-3">Ready to Join?</h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              Your nation needs your voice. Sign up free and start building your fan reputation today.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="font-heading uppercase tracking-widest text-sm h-11 px-10 shadow-[0_0_24px_rgba(250,204,21,0.2)] hover:shadow-[0_0_36px_rgba(250,204,21,0.35)] transition-all">
                Enter the Stadium <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
