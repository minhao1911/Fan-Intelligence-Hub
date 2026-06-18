import { Link } from "wouter";
import { useGetGlobalStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Activity, Users } from "lucide-react";

export default function Landing() {
  const { data: stats, isLoading } = useGetGlobalStats();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="px-6 lg:px-12 py-6 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 400 400" className="w-8 h-8 text-primary">
            <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="24" opacity="0.8"/>
            <path d="M 200 60 L 200 340 M 60 200 L 340 200 M 100 100 L 300 300 M 100 300 L 300 100" stroke="currentColor" strokeWidth="12" opacity="0.4"/>
          </svg>
          <span className="font-heading text-xl font-bold uppercase tracking-widest text-primary">FanVerse</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors py-2 px-4">Sign In</Link>
          <Link href="/sign-up">
            <Button className="font-heading uppercase tracking-wide">Join Now</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-heading font-bold uppercase tracking-tight text-white mb-6">
            The Digital Home of <br className="hidden md:block"/>
            <span className="text-primary">Global Football</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Measure fan confidence, gauge matchday sentiment, and amplify your community's voice on the international stage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 font-heading uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                Enter the Stadium <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Stats */}
        <div className="relative z-10 w-full max-w-6xl mx-auto mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
              <Users className="h-10 w-10 text-primary mb-4" />
              <div className="text-4xl font-heading font-bold text-white mb-2">
                {isLoading ? "..." : (stats?.totalFans?.toLocaleString() || "0")}
              </div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Active Fans</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <Activity className="h-10 w-10 text-primary mb-4" />
              <div className="text-4xl font-heading font-bold text-white mb-2">
                {isLoading ? "..." : (stats?.totalVotesCast?.toLocaleString() || "0")}
              </div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Pulse Votes Cast</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
              <Globe className="h-10 w-10 text-primary mb-4" />
              <div className="text-4xl font-heading font-bold text-white mb-2">
                {isLoading ? "..." : (stats?.totalNationsActive?.toLocaleString() || "0")}
              </div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Nations Represented</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
