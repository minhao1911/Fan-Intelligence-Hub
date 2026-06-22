import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home, Activity, CalendarDays, Globe, Trophy, User, LogOut,
  Star, ListOrdered, UsersRound, Target, Bell, MessageSquare,
  Search, ChevronDown, ShieldCheck, Sun, Moon, ShoppingBag, ClipboardList,
  ArrowUpCircle, CheckCheck
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useClerk, useUser, useAuth } from "@clerk/react";
import { useGetMe, useListMatches, getListMatchesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LiveScoreTicker from "@/components/LiveScoreTicker";
import MobileSearchModal from "@/components/MobileSearchModal";
import { Toaster } from "@/components/ui/sonner";
import { useMatchNotifications } from "@/hooks/useMatchNotifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";

type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  discussionId: number | null;
  actorUsername: string | null;
  createdAt: string;
};

function useNotifications() {
  const { getToken } = useAuth();
  return useQuery<AppNotification[]>({
    queryKey: ["me-notifications"],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/me/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

function useMarkAllRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await fetch(`${getBaseUrl()}api/me/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me-notifications"] }),
  });
}

function useMarkOneRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken();
      await fetch(`${getBaseUrl()}api/me/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me-notifications"] }),
  });
}

function timeAgoShort(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkOneRead();
  const [, navigate] = useLocation();

  const unread = notifications.filter((n) => !n.isRead);
  const unreadCount = unread.length;

  function handleClick(n: AppNotification) {
    if (!n.isRead) markOne.mutate(n.id);
    if (n.discussionId) navigate(`/discussions/${n.discussionId}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border-border p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[340px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-3 py-3 border-b border-border/40 last:border-0 hover:bg-muted/50 transition-colors flex gap-2.5 items-start ${
                  !n.isRead ? "bg-primary/4" : ""
                }`}
              >
                {/* Icon */}
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  n.type === "comment" ? "bg-sky-500/15" : "bg-primary/10"
                }`}>
                  {n.type === "comment"
                    ? <MessageSquare className="h-3 w-3 text-sky-400" />
                    : <ArrowUpCircle className="h-3 w-3 text-primary" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold leading-snug ${n.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{n.body}</p>
                </div>

                {/* Meta */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground">{timeAgoShort(n.createdAt)}</span>
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useMatchNotifications();
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: user } = useGetMe();
  const { data: liveMatches } = useListMatches(
    { status: "live", limit: 1 },
    { query: { queryKey: getListMatchesQueryKey({ status: "live", limit: 1 }), refetchInterval: 30_000 } },
  );
  const hasLive = (liveMatches?.length ?? 0) > 0;

  const navigation = [
    { name: "Feed",        href: "/feed",        icon: Home },
    { name: "Pulse",       href: "/pulse",        icon: Activity },
    { name: "Fixtures",    href: "/fixtures",     icon: ListOrdered },
    { name: "Nations",     href: "/nations",      icon: Globe },
    { name: "Matches",     href: "/matches",      icon: CalendarDays, live: hasLive },
    { name: "Predictions", href: "/predictions",  icon: Target },
    { name: "Leaderboard", href: "/leaderboard",  icon: Trophy },
    { name: "Activity",    href: "/activity",     icon: ClipboardList },
    { name: "Groups",      href: "/groups",       icon: UsersRound },
    { name: "Store",       href: "/store",        icon: ShoppingBag },
    { name: "Profile",     href: "/profile",      icon: User },
    { name: "Admin",       href: "/admin",        icon: ShieldCheck },
  ];

  const mobileNavLeft = [
    { name: "Home",    href: "/feed",    icon: Home },
    { name: "Nations", href: "/nations", icon: Globe },
  ];
  const mobileNavRight = [
    { name: "Matches",  href: "/matches",     icon: CalendarDays, live: hasLive },
    { name: "Rank",     href: "/leaderboard", icon: Trophy },
  ];

  const primaryNav = navigation.slice(0, 7);
  const moreNav    = navigation.slice(7);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />

      {/* ── Top Navigation Bar ─────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-md border-b border-border/60 flex items-center px-3 md:px-6 gap-3">

        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 shrink-0 mr-2">
          <img src="/fanverse-logo.png" alt="FanVerse" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-heading text-lg font-bold text-foreground uppercase tracking-wide hidden sm:block">
            Fan<span className="text-primary">Verse</span>
          </span>
        </Link>

        {/* Primary nav — desktop */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 h-full">
          {primaryNav.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-1.5 px-2.5 h-full text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Active bottom indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.name}</span>
                {/* Live dot badge */}
                {"live" in item && item.live && (
                  <span className="relative flex h-1.5 w-1.5 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                )}
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

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <NotificationBell />

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 transition-colors ${
              location.startsWith("/discussions") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            asChild
          >
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
      <main className={`flex-1 pb-20 lg:pb-6 transition-all duration-300 ${hasLive ? "pt-22" : "pt-14"}`}>
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom navigation ────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/60 flex items-stretch h-16 safe-area-bottom">
        {/* Left two: Home + Nations */}
        {mobileNavLeft.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-primary" />
              )}
              <item.icon className={`h-5 w-5 transition-transform duration-150 ${isActive ? "scale-110" : ""}`} />
              {item.name}
            </Link>
          );
        })}

        {/* Centre Search FAB */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          <div className="w-10 h-10 -mt-4 rounded-full bg-primary flex items-center justify-center shadow-[0_0_18px_rgba(251,191,36,0.4)] border-[3px] border-card">
            <Search className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>Search</span>
        </button>

        {/* Right three */}
        {mobileNavRight.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex-1 relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-primary" />
              )}
              <div className="relative">
                <item.icon className={`h-5 w-5 transition-transform duration-150 ${isActive ? "scale-110" : ""}`} />
                {"live" in item && item.live && (
                  <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                )}
              </div>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Mobile search modal */}
      <MobileSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
