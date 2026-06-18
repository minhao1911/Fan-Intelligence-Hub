import { Link } from "wouter";
import { useGetGlobalStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Activity, Users, BarChart3, Shield, Star } from "lucide-react";

export default function Landing() {
  const { data: stats, isLoading } = useGetGlobalStats();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 400 400" className="w-7 h-7 text-primary">
            <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="24" opacity="0.8"/>
            <path d="M 200 60 L 200 340 M 60 200 L 340 200 M 100 100 L 300 300 M 100 300 L 300 100" stroke="currentColor" strokeWidth="12" opacity="0.4"/>
          </svg>
          <span className="font-heading text-xl font-bold uppercase tracking-widest text-primary">FanVerse</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="font-heading uppercase tracking-wide">Join Now</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 lg:py-36 relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_rgba(250,204,21,0.15),_transparent)]" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Fan Intelligence Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold uppercase tracking-tight text-white mb-6 leading-none">
              The Digital Home of{" "}
              <br className="hidden md:block" />
              <span className="text-primary">Global Football</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Measure fan confidence, gauge matchday sentiment, and amplify your community's voice on the international stage.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8 font-heading uppercase tracking-widest">
                  Enter the Stadium <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8 font-heading uppercase tracking-widest border-border">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Global Stats */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Users className="h-8 w-8 text-primary" />, value: stats?.totalFans, label: "Active Fans" },
              { icon: <Activity className="h-8 w-8 text-primary" />, value: stats?.totalVotesCast, label: "Pulse Votes Cast", featured: true },
              { icon: <Globe className="h-8 w-8 text-primary" />, value: stats?.totalNationsActive, label: "Nations Represented" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-7 border ${item.featured ? "border-primary/30 bg-primary/5 relative overflow-hidden" : "border-border bg-card"}`}
              >
                {item.featured && <div className="absolute top-0 left-0 w-full h-0.5 bg-primary" />}
                {item.icon}
                <div className="text-4xl font-heading font-bold text-white mt-4 mb-1">
                  {isLoading ? "—" : (item.value?.toLocaleString() || "0")}
                </div>
                <div className="text-muted-foreground font-medium uppercase tracking-wider text-xs">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-card border-t border-border px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-primary font-heading uppercase tracking-widest text-xs mb-3">How It Works</p>
              <h2 className="text-3xl font-heading font-bold uppercase text-foreground">Your Fan Journey</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: <Shield className="w-7 h-7 text-primary" />,
                  title: "Join Your Nation",
                  desc: "Pick your allegiance and become part of your nation's fanbase. Your community, your voice.",
                },
                {
                  step: "02",
                  icon: <BarChart3 className="w-7 h-7 text-primary" />,
                  title: "Cast Your Signals",
                  desc: "Vote in match polls, post reactions, and start discussions to shape the Nation Pulse.",
                },
                {
                  step: "03",
                  icon: <Star className="w-7 h-7 text-primary" />,
                  title: "Build Reputation",
                  desc: "Earn points for every action. Climb from Casual to Fan, Capo, and Ultras — the top tier.",
                },
              ].map((item) => (
                <div key={item.step} className="relative pl-5 border-l border-primary/30">
                  <span className="font-mono text-xs text-primary font-bold mb-3 block">{item.step}</span>
                  <div className="mb-3">{item.icon}</div>
                  <h3 className="font-heading font-bold uppercase text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-5xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold uppercase text-foreground">Everything in One Place</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { emoji: "🏟️", title: "Match Center", desc: "Live scores, upcoming fixtures, and fan confidence bars across every match." },
              { emoji: "🌍", title: "Nation Communities", desc: "Join your national fanbase, see pulse analytics, and connect with fellow fans." },
              { emoji: "📊", title: "Nation Pulse", desc: "Macro-view analytics of global fan sentiment — win confidence, mood score, trends." },
              { emoji: "💬", title: "Discussions", desc: "Threaded forums for tactical analysis, predictions, and matchday reactions." },
              { emoji: "🏆", title: "Global Leaderboard", desc: "Ranked by reputation, filterable by nation. Top Ultras rise to the top." },
              { emoji: "⭐", title: "Fan Reputation", desc: "Earn points for every action. Four tiers: Casual, Fan, Capo, Ultras." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
                <span className="text-3xl leading-none shrink-0 mt-0.5">{f.emoji}</span>
                <div>
                  <h4 className="font-heading font-bold uppercase text-sm mb-1 text-foreground">{f.title}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/5 border-t border-primary/20 px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-4xl font-heading font-bold uppercase text-foreground mb-4">Ready to Join?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your nation needs your voice. Sign up free and start building your fan reputation today.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="font-heading uppercase tracking-widest text-base h-12 px-10">
              Enter the Stadium <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
