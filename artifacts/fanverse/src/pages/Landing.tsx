import { Link } from "wouter";
import { useGetGlobalStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Activity, Users, BarChart3, Shield, Star, Zap } from "lucide-react";

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

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 lg:py-36 overflow-hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-5%,rgba(250,204,21,0.13),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_105%,rgba(250,204,21,0.05),transparent)]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:"linear-gradient(rgba(250,204,21,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(250,204,21,0.4) 1px,transparent 1px)", backgroundSize:"60px 60px"}} />

          {/* Star player silhouettes */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">

            {/* LEFT: Messi — low dribble pose */}
            <div className="absolute bottom-0 left-[-2%] lg:left-[2%] flex flex-col items-center opacity-0 lg:opacity-100">
              <svg viewBox="0 0 180 420" className="h-[340px] xl:h-[400px]" fill="none">
                <defs>
                  <linearGradient id="messiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(250,204,21,0.18)" />
                    <stop offset="60%" stopColor="rgba(250,204,21,0.09)" />
                    <stop offset="100%" stopColor="rgba(250,204,21,0)" />
                  </linearGradient>
                  <filter id="messiGlow">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                {/* Head */}
                <ellipse cx="85" cy="38" rx="22" ry="25" fill="url(#messiGrad)" filter="url(#messiGlow)"/>
                {/* Neck */}
                <rect x="79" y="60" width="12" height="18" rx="5" fill="url(#messiGrad)"/>
                {/* Torso — leaning forward */}
                <path d="M 60 78 Q 85 72 110 80 L 105 145 Q 85 152 65 144 Z" fill="url(#messiGrad)"/>
                {/* Left arm — reaching down toward ball */}
                <path d="M 65 90 Q 40 118 28 145 Q 32 150 38 148 Q 52 122 70 98 Z" fill="url(#messiGrad)"/>
                {/* Right arm — back for balance */}
                <path d="M 108 88 Q 132 105 148 118 Q 144 124 138 121 Q 124 108 104 94 Z" fill="url(#messiGrad)"/>
                {/* Left leg — planted */}
                <path d="M 68 144 Q 60 195 55 250 Q 62 255 70 252 Q 76 198 82 148 Z" fill="url(#messiGrad)"/>
                {/* Left shin / boot */}
                <path d="M 55 250 Q 48 295 44 330 Q 38 332 34 328 Q 34 295 44 248 Z" fill="url(#messiGrad)"/>
                <path d="M 24 325 Q 32 340 52 336 Q 56 328 44 328 Z" fill="url(#messiGrad)"/>
                {/* Right leg — dribbling, bent forward */}
                <path d="M 88 146 Q 95 188 108 222 Q 115 225 120 220 Q 108 185 98 148 Z" fill="url(#messiGrad)"/>
                {/* Right shin */}
                <path d="M 108 222 Q 120 262 128 295 Q 136 296 138 290 Q 130 258 120 218 Z" fill="url(#messiGrad)"/>
                <path d="M 118 290 Q 130 308 148 302 Q 148 294 138 290 Z" fill="url(#messiGrad)"/>
                {/* Ball */}
                <circle cx="38" cy="355" r="22" fill="none" stroke="rgba(250,204,21,0.3)" strokeWidth="2.5"/>
                <path d="M 38 333 Q 52 343 60 355 Q 52 367 38 377 Q 24 367 16 355 Q 24 343 38 333 Z" fill="rgba(250,204,21,0.06)"/>
                <line x1="38" y1="333" x2="38" y2="377" stroke="rgba(250,204,21,0.18)" strokeWidth="1.2"/>
                <line x1="16" y1="355" x2="60" y2="355" stroke="rgba(250,204,21,0.18)" strokeWidth="1.2"/>
                <path d="M 22 338 Q 38 333 54 338" stroke="rgba(250,204,21,0.15)" strokeWidth="1" fill="none"/>
                <path d="M 22 372 Q 38 377 54 372" stroke="rgba(250,204,21,0.15)" strokeWidth="1" fill="none"/>
              </svg>
              <span className="font-heading font-black uppercase tracking-[0.3em] text-[10px] text-primary/40 mt-1">Messi</span>
            </div>

            {/* RIGHT: Ronaldo — free kick stance */}
            <div className="absolute bottom-0 right-[-2%] lg:right-[2%] flex flex-col items-center opacity-0 lg:opacity-100">
              <svg viewBox="0 0 180 420" className="h-[340px] xl:h-[400px]" fill="none">
                <defs>
                  <linearGradient id="ronaldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(250,204,21,0.18)" />
                    <stop offset="60%" stopColor="rgba(250,204,21,0.09)" />
                    <stop offset="100%" stopColor="rgba(250,204,21,0)" />
                  </linearGradient>
                  <filter id="ronaldoGlow">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                {/* Head — upright, chin up */}
                <ellipse cx="90" cy="36" rx="22" ry="25" fill="url(#ronaldoGrad)" filter="url(#ronaldoGlow)"/>
                {/* Neck */}
                <rect x="83" y="58" width="14" height="18" rx="5" fill="url(#ronaldoGrad)"/>
                {/* Torso — chest puffed, upright */}
                <path d="M 58 76 Q 90 68 122 76 L 116 148 Q 90 158 64 148 Z" fill="url(#ronaldoGrad)"/>
                {/* Left arm — wide out */}
                <path d="M 62 88 Q 34 108 18 128 Q 23 134 29 130 Q 44 112 66 96 Z" fill="url(#ronaldoGrad)"/>
                {/* Right arm — wide out other side */}
                <path d="M 116 88 Q 144 108 160 128 Q 155 134 149 130 Q 134 112 112 96 Z" fill="url(#ronaldoGrad)"/>
                {/* Left leg — planted, weight on it */}
                <path d="M 66 148 Q 58 200 56 258 Q 64 262 72 258 Q 74 200 80 150 Z" fill="url(#ronaldoGrad)"/>
                {/* Left shin */}
                <path d="M 56 258 Q 52 300 50 332 Q 44 334 40 330 Q 40 296 50 256 Z" fill="url(#ronaldoGrad)"/>
                <path d="M 30 326 Q 40 342 62 338 Q 64 330 50 330 Z" fill="url(#ronaldoGrad)"/>
                {/* Right leg — cocked back for power kick */}
                <path d="M 100 150 Q 112 185 122 215 Q 130 215 133 208 Q 122 178 108 148 Z" fill="url(#ronaldoGrad)"/>
                {/* Right shin — kicked back */}
                <path d="M 122 215 Q 138 248 148 272 Q 156 270 157 263 Q 146 238 130 210 Z" fill="url(#ronaldoGrad)"/>
                <path d="M 140 262 Q 152 278 166 270 Q 164 262 157 263 Z" fill="url(#ronaldoGrad)"/>
              </svg>
              <span className="font-heading font-black uppercase tracking-[0.3em] text-[10px] text-primary/40 mt-1">Ronaldo</span>
            </div>

            {/* FAR LEFT (xl only): Mbappé — sprint pose */}
            <div className="absolute bottom-0 left-[-4%] xl:left-[-1%] flex flex-col items-center opacity-0 xl:opacity-60">
              <svg viewBox="0 0 140 380" className="h-[280px] xl:h-[340px]" fill="none">
                <defs>
                  <linearGradient id="mbappeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(250,204,21,0.12)" />
                    <stop offset="100%" stopColor="rgba(250,204,21,0)" />
                  </linearGradient>
                </defs>
                {/* Head — forward lean */}
                <ellipse cx="72" cy="34" rx="20" ry="22" fill="url(#mbappeGrad)"/>
                <rect x="67" y="53" width="10" height="15" rx="4" fill="url(#mbappeGrad)"/>
                {/* Torso leaning forward aggressively */}
                <path d="M 48 68 Q 72 60 96 70 L 90 128 Q 72 136 54 127 Z" fill="url(#mbappeGrad)"/>
                {/* Arms pumping */}
                <path d="M 52 80 Q 28 100 16 118 Q 20 124 26 120 Q 38 104 56 88 Z" fill="url(#mbappeGrad)"/>
                <path d="M 90 78 Q 114 92 124 110 Q 120 116 114 112 Q 104 96 86 84 Z" fill="url(#mbappeGrad)"/>
                {/* Left leg pushing off */}
                <path d="M 56 127 Q 50 170 48 214 Q 56 218 63 214 Q 65 170 70 130 Z" fill="url(#mbappeGrad)"/>
                <path d="M 48 214 Q 44 248 42 272 Q 36 274 32 270 Q 34 244 42 212 Z" fill="url(#mbappeGrad)"/>
                <path d="M 24 266 Q 34 280 50 275 Q 52 268 42 270 Z" fill="url(#mbappeGrad)"/>
                {/* Right leg high stride */}
                <path d="M 76 130 Q 90 160 100 186 Q 108 184 110 178 Q 98 152 84 128 Z" fill="url(#mbappeGrad)"/>
                <path d="M 100 186 Q 112 210 116 232 Q 122 232 124 226 Q 118 202 108 182 Z" fill="url(#mbappeGrad)"/>
                <path d="M 108 226 Q 118 240 130 234 Q 128 226 124 226 Z" fill="url(#mbappeGrad)"/>
              </svg>
              <span className="font-heading font-black uppercase tracking-[0.3em] text-[9px] text-primary/25 mt-1">Mbappé</span>
            </div>

            {/* FAR RIGHT (xl only): Neymar — skill move */}
            <div className="absolute bottom-0 right-[-4%] xl:right-[-1%] flex flex-col items-center opacity-0 xl:opacity-60">
              <svg viewBox="0 0 140 380" className="h-[280px] xl:h-[340px]" fill="none">
                <defs>
                  <linearGradient id="neymarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(250,204,21,0.12)" />
                    <stop offset="100%" stopColor="rgba(250,204,21,0)" />
                  </linearGradient>
                </defs>
                {/* Head — tilted, showboating */}
                <ellipse cx="75" cy="36" rx="20" ry="22" fill="url(#neymarGrad)"/>
                <rect x="70" y="55" width="10" height="14" rx="4" fill="url(#neymarGrad)"/>
                {/* Torso — twisted */}
                <path d="M 52 70 Q 75 63 100 72 L 94 132 Q 75 140 56 131 Z" fill="url(#neymarGrad)"/>
                {/* Arms — one up flair */}
                <path d="M 56 82 Q 36 95 24 106 Q 28 112 34 108 Q 46 99 60 88 Z" fill="url(#neymarGrad)"/>
                <path d="M 92 78 Q 112 60 122 46 Q 128 50 126 56 Q 116 68 98 84 Z" fill="url(#neymarGrad)"/>
                {/* Left leg */}
                <path d="M 58 131 Q 52 175 50 222 Q 58 226 65 222 Q 67 176 72 134 Z" fill="url(#neymarGrad)"/>
                <path d="M 50 222 Q 46 258 44 280 Q 38 282 34 278 Q 36 252 44 220 Z" fill="url(#neymarGrad)"/>
                <path d="M 26 274 Q 36 288 54 284 Q 56 276 44 278 Z" fill="url(#neymarGrad)"/>
                {/* Right leg — flicking ball */}
                <path d="M 80 134 Q 92 165 104 190 Q 112 188 114 182 Q 100 156 88 132 Z" fill="url(#neymarGrad)"/>
                <path d="M 104 190 Q 116 215 122 238 Q 128 237 130 231 Q 122 206 112 186 Z" fill="url(#neymarGrad)"/>
                <path d="M 114 232 Q 124 246 136 240 Q 134 232 130 231 Z" fill="url(#neymarGrad)"/>
                {/* Ball at feet */}
                <circle cx="124" cy="300" r="18" fill="none" stroke="rgba(250,204,21,0.22)" strokeWidth="2"/>
                <line x1="124" y1="282" x2="124" y2="318" stroke="rgba(250,204,21,0.14)" strokeWidth="1"/>
                <line x1="106" y1="300" x2="142" y2="300" stroke="rgba(250,204,21,0.14)" strokeWidth="1"/>
              </svg>
              <span className="font-heading font-black uppercase tracking-[0.3em] text-[9px] text-primary/25 mt-1">Neymar</span>
            </div>

            {/* Ground line glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/60 to-transparent" />

            {/* Spotlight effects under each player */}
            <div className="absolute bottom-0 left-[8%] lg:left-[10%] w-48 h-32 bg-[radial-gradient(ellipse_at_bottom,rgba(250,204,21,0.08),transparent_70%)] hidden lg:block" />
            <div className="absolute bottom-0 right-[8%] lg:right-[10%] w-48 h-32 bg-[radial-gradient(ellipse_at_bottom,rgba(250,204,21,0.08),transparent_70%)] hidden lg:block" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
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
