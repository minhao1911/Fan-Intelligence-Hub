import { Link, useLocation } from "wouter";
import { Home, Activity, CalendarDays, Globe, Trophy, User, LogOut, Menu, Star, ListOrdered, UsersRound, Target } from "lucide-react";
import { useClerk } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { data: user } = useGetMe();

  const navigation = [
    { name: "Feed", href: "/feed", icon: Home },
    { name: "Pulse", href: "/pulse", icon: Activity },
    { name: "Fixtures", href: "/fixtures", icon: ListOrdered },
    { name: "Matches", href: "/matches", icon: CalendarDays },
    { name: "Nations", href: "/nations", icon: Globe },
    { name: "Groups", href: "/groups", icon: UsersRound },
    { name: "Predictions", href: "/predictions", icon: Target },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const NavLinks = () => (
    <>
      <div className="flex items-center gap-2 px-4 py-6 border-b border-border">
        <svg viewBox="0 0 400 400" className="w-8 h-8 text-primary shrink-0">
          <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="24" opacity="0.8"/>
          <path d="M 200 60 L 200 340 M 60 200 L 340 200 M 100 100 L 300 300 M 100 300 L 300 100" stroke="currentColor" strokeWidth="12" opacity="0.4"/>
        </svg>
        <span className="font-heading text-xl font-bold text-foreground uppercase tracking-wide">FanVerse</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Rep Mini-Card */}
      {user && (
        <Link href="/profile">
          <div className="mx-3 mb-3 p-3 rounded-lg bg-muted/40 border border-border/50 hover:border-primary/30 hover:bg-muted/60 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-border shrink-0">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xs">
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user.username}</p>
                <ReputationBadge tier={user.reputationTier} size="sm" className="mt-0.5" />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 text-primary" />
                <span className="text-xs font-mono font-bold text-primary">{user.reputationPoints}</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground text-sm"
          onClick={() => signOut()}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Log out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-card border-r border-border flex flex-col h-full">
          <NavLinks />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
        <div className="flex flex-col flex-1 min-h-0">
          <NavLinks />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:pl-64 h-[100dvh]">
        <main className="flex-1 overflow-y-auto bg-background px-4 sm:px-6 py-16 md:py-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
