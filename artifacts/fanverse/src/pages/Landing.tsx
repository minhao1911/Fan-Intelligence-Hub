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
