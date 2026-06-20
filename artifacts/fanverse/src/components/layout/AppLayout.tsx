import { Link, useLocation } from "wouter";
import {
  Home, Activity, CalendarDays, Globe, Trophy, User, LogOut,
  Star, ListOrdered, UsersRound, Target, Bell, MessageSquare,
  Search, ChevronDown
} from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { useGetMe, useListMatches } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LiveScoreTicker from "@/components/LiveScoreTicker";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: user } = useGetMe();
  const { data: liveMatches } = useListMatches(
    { status: "live", limit: 1 },
    { query: { refetchInterval: 30_000 } },
  );
  const hasLive = (liveMatches?.length ?? 0) > 0;

  const navigation = [
    { name: "Feed",        href: "/feed",        icon: Home },
    { name: "Pulse",       href: "/pulse",        icon: Activity },
    { name: "Fixtures",    href: "/fixtures",     icon: ListOrdered },
    { name: "Nations",     href: "/nations",      icon: Globe },
    { name: "Matches",     href: "/matches",      icon: CalendarDays },
    { name: "Predictions", href: "/predictions",  icon: Target },
    { name: "Leaderboard", href: "/leaderboard",  icon: Trophy },
    { name: "Groups",      href: "/groups",       icon: UsersRound },
    { name: "Profile",     href: "/profile",      icon: User },
  ];

  const mobileNav = [
    { name: "Home",        href: "/feed",        icon: Home },
    { name: "Nations",     href: "/nations",      icon: Globe },
    { name: "Matches",     href: "/matches",      icon: CalendarDays },
    { name: "Predictions", href: "/predictions",  icon: Target },
    { name: "Profile",     href: "/profile",      icon: User },
  ];

  const primaryNav = navigation.slice(0, 7);
  const moreNav    = navigation.slice(7);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top Navigation Bar ─────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-md border-b border-border/60 flex items-center px-3 md:px-6 gap-3">

        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 400 400" className="w-8 h-8 text-primary">
              <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="24" opacity="0.9"/>
              <path d="M200 60 L200 340 M60 200 L340 200 M100 100 L300 300 M100 300 L300 100" stroke="currentColor" strokeWidth="12" opacity="0.45"/>
            </svg>
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-md -z-10" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground uppercase tracking-wide hidden sm:block">
            Fan<span className="text-primary">Verse</span>
          </span>
        </Link>

        {/* Primary nav — desktop */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {primaryNav.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all">
                More <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-card border-border">
              {moreNav.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Spacer on tablet */}
        <div className="flex-1 lg:hidden" />

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Search — md+ */}
          <div className="relative hidden md:block mr-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Search FanVerse…"
              className="w-44 xl:w-52 bg-muted border border-border rounded-full pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative" asChild>
            <Link href="/pulse">
              <Bell className="h-4.5 w-4.5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/discussions">
              <MessageSquare className="h-4.5 w-4.5" />
            </Link>
          </Button>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 ml-1 pl-2 pr-1 py-1 rounded-full hover:bg-muted/70 transition-colors">
                <Avatar className="h-7 w-7 border border-border shrink-0">
                  <AvatarImage src={user?.avatarUrl || clerkUser?.imageUrl || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-heading text-[10px]">
                    {user?.username
                      ? user.username.substring(0, 2).toUpperCase()
                      : clerkUser?.firstName && clerkUser?.lastName
                      ? (clerkUser.firstName[0] + clerkUser.lastName[0]).toUpperCase()
                      : clerkUser?.firstName
                      ? clerkUser.firstName.substring(0, 2).toUpperCase()
                      : clerkUser?.emailAddresses?.[0]?.emailAddress?.substring(0, 2).toUpperCase()
                      ?? "ME"}
                  </AvatarFallback>
                </Avatar>
                {user && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground max-w-[80px] truncate">{user.username}</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-mono font-bold text-primary">{user.reputationPoints}</span>
                    </div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-card border-border">
              {user && (
                <>
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-sm font-bold text-foreground">{user.username}</p>
                    <ReputationBadge tier={user.reputationTier} size="sm" className="mt-0.5" />
                  </div>
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" /> My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/leaderboard" className="cursor-pointer flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Leaderboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <LiveScoreTicker />

      {/* ── Page content ───────────────────────────────────────── */}
      <main className={`flex-1 pb-16 lg:pb-4 transition-all duration-300 ${hasLive ? "pt-22" : "pt-14"}`}>
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-6">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom navigation ────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/60 flex items-stretch h-16">
        {mobileNav.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
