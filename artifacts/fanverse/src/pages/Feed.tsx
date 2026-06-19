import { useState, useRef } from "react";
import {
  useListMatches,
  useGetGlobalStats,
  useListNations,
  useGetMe,
  useGetLeaderboard,
  useListDiscussions,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity, Clock, Globe, Trophy, Target, MessageSquare,
  Users, Zap, Swords, Camera, ChevronRight, ChevronLeft,
  PanelRight, MessageCircle,
} from "lucide-react";
import FanPhotoComposer, { type FanPhoto } from "@/components/FanPhotoComposer";
import FanMomentCard from "@/components/FanMomentCard";
import TopFanGroupsWidget from "@/components/TopFanGroupsWidget";
import FanOfTheMatch from "@/components/FanOfTheMatch";
import MatchDayCountdown from "@/components/MatchDayCountdown";
import HotTakeStrip from "@/components/HotTakeStrip";
import NationRivalryCard from "@/components/NationRivalryCard";
import BracketProgressWidget from "@/components/BracketProgressWidget";
import FanLiveChat from "@/components/FanLiveChat";

const NAV_LINKS = [
  { href: "/matches",     emoji: "⚽", label: "Live Match Center" },
  { href: "/nations",     emoji: "🌍", label: "My Team Dashboard" },
  { href: "/fixtures",    emoji: "🏆", label: "Tournament Bracket" },
  { href: "/leaderboard", emoji: "🎖️", label: "Badges & Ranks" },
  { href: "/predictions", emoji: "🎯", label: "Predictions Hub" },
  { href: "/discussions", emoji: "💬", label: "Fan Banter" },
  { href: "/groups",      emoji: "👥", label: "Fan Groups" },
  { href: "/pulse",       emoji: "📊", label: "Analytics Pulse" },
];

const CHALLENGES = [
  { href: "/pulse",       badge: "Match Pulse",  badgeClass: "bg-primary text-primary-foreground",   text: "Which nation dominates tonight? Cast your confidence vote." },
  { href: "/predictions", badge: "Trivia +15 XP", badgeClass: "bg-emerald-500 text-black",            text: "Predict 3 correct scores today to earn a streak bonus." },
  { href: "/matches",     badge: "Streak Bonus",  badgeClass: "bg-primary text-primary-foreground",   text: "Lock 3 correct scores in a row to maintain your streak." },
  { href: "/nations",     badge: "Nation Pick",   badgeClass: "bg-blue-500 text-white",               text: "See what the global fanbase is predicting for tonight." },
  { href: "/discussions", badge: "Hot Take",      badgeClass: "bg-red-500 text-white",                text: "Drop your boldest match take and climb the banter board." },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Feed() {
  const [photoComposerOpen, setPhotoComposerOpen] = useState(false);
  const [fanPhotos, setFanPhotos] = useState<FanPhoto[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const { data: upcomingMatches, isLoading: matchesLoading } = useListMatches({ status: "upcoming", limit: 5 });
  const { data: liveMatches } = useListMatches({ status: "live", limit: 3 });
  const { data: stats } = useGetGlobalStats();
  const { data: nations } = useListNations({});
  const { data: me } = useGetMe();
  const { data: leaderboard } = useGetLeaderboard({ limit: 5 });
  const { data: discussions } = useListDiscussions({ limit: 4 });

  const handlePost = (photo: FanPhoto) => {
    setFanPhotos((prev) => [photo, ...prev]);
  };

  const handleCheer = (id: string) => {
    setFanPhotos((prev) =>
      prev.map((p) => p.id === id ? { ...p, cheers: p.cheers + 1 } : p)
    );
  };

  const topNations = nations
    ? [...nations].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0)).slice(0, 5)
    : [];

  const myEntry = leaderboard?.find((e) => e.user.username === me?.username);

  return (
    <>
      <style>{`
        .feed-grid {
          display: grid;
          gap: 1.5rem;
          transition: grid-template-columns 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .feed-right-panel {
          overflow: hidden;
          transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .feed-right-panel.closed {
          opacity: 0;
          transform: translateX(32px);
          pointer-events: none;
        }
        @media (max-width: 1100px) {
          .feed-left  { display: none; }
        }
        @media (max-width: 768px) {
          .feed-right { display: none !important; }
          .sidebar-toggle-btn { display: none !important; }
        }
      `}</style>

      {/* ── Fan Live Chat panel ── */}
      <FanLiveChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        myUsername={me?.username ?? undefined}
      />

      {/* ── Floating chat toggle tab (left edge) ── */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        title={chatOpen ? "Close chat" : "Open Fan Live Chat"}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 px-2 py-4 rounded-r-2xl border border-l-0 border-border/80 bg-card shadow-xl hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 group"
        style={{ marginTop: chatOpen ? 0 : 64 }}
      >
        {chatOpen ? (
          <ChevronLeft className="h-4 w-4 text-primary" />
        ) : (
          <ChevronRight className="h-4 w-4 text-primary" />
        )}
        <span
          className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed", letterSpacing: "0.18em", transform: "rotate(180deg)" }}
        >
          {chatOpen ? "Close" : "Live Chat"}
        </span>
        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        {!chatOpen && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-card" />
        )}
      </button>

      {/* ── Floating sidebar toggle tab (right edge) ── */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? "Minimise panel" : "Open Fan Hub"}
        className="sidebar-toggle-btn fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 px-2 py-4 rounded-l-2xl border border-r-0 border-border/80 bg-card shadow-xl hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 group"
        style={{ boxShadow: "−4px 0 24px rgba(0,0,0,0.25)" }}
      >
        {sidebarOpen ? (
          <ChevronRight className="h-4 w-4 text-primary" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-primary" />
        )}
        <span
          className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed", letterSpacing: "0.18em" }}
        >
          {sidebarOpen ? "Minimise" : "Fan Hub"}
        </span>
        <PanelRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      <div
        className="feed-grid animate-in fade-in duration-500"
        style={{
          gridTemplateColumns: sidebarOpen
            ? "280px 1fr 360px"
            : "280px 1fr 0px",
        }}
      >

        {/* ══════════ LEFT SIDEBAR ══════════ */}
        <aside className="feed-left flex flex-col gap-1">
          {NAV_LINKS.map(({ href, emoji, label }) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-4 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer font-medium text-sm">
                <span className="text-base leading-none w-5 text-center">{emoji}</span>
                <span>{label}</span>
              </div>
            </Link>
          ))}

          <div className="mt-4 bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Platform Pulse
            </p>
            <div className="space-y-2.5 text-sm">
              {[
                { icon: Zap,   label: "Votes Cast",    value: stats?.totalVotesCast?.toLocaleString() ?? "—" },
                { icon: Users, label: "Fan Analysts",  value: stats?.totalFans?.toLocaleString() ?? "—" },
                { icon: Globe, label: "Nations Active", value: stats?.totalNationsActive?.toLocaleString() ?? "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" />{label}
                  </span>
                  <span className="font-bold font-mono text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ══════════ CENTER FEED ══════════ */}
        <main className="flex flex-col gap-5 min-w-0">

          {/* Match Day Countdown — only shows when a match is within 2 hours or live */}
          <MatchDayCountdown />

          {/* Hot Take strip — most upvoted fan take, cycles every 5s */}
          <HotTakeStrip />

          {/* Nation Rivalry — highest vs lowest confidence, live vote split */}
          <NationRivalryCard />

          {/* Prediction prompt box */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex gap-4 mb-4">
              <Avatar className="h-10 w-10 border-2 border-primary shrink-0">
                <AvatarImage src={me?.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-secondary text-foreground font-heading text-xs">
                  {me?.username?.substring(0, 2).toUpperCase() ?? "FV"}
                </AvatarFallback>
              </Avatar>
              <Link href="/predictions" className="flex-1">
                <div className="w-full bg-secondary border border-border rounded-full px-5 py-2.5 text-muted-foreground text-sm cursor-pointer hover:border-primary/50 transition-colors">
                  What's your prediction for tonight's big match?
                </div>
              </Link>
            </div>
            <div className="flex items-center justify-around border-t border-border pt-3 gap-2">
              {[
                { href: "/predictions", icon: Target,        label: "Quick Score" },
                { href: "/pulse",       icon: Activity,      label: "Nation Poll" },
                { href: "/discussions", icon: MessageSquare, label: "Post a Take" },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-semibold cursor-pointer">
                    <Icon className="h-4 w-4" />{label}
                  </button>
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setPhotoComposerOpen(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-semibold cursor-pointer"
              >
                <Camera className="h-4 w-4" /> Fan Photo
              </button>
            </div>
          </div>

          {/* Fan photo composer dialog */}
          <FanPhotoComposer
            open={photoComposerOpen}
            onClose={() => setPhotoComposerOpen(false)}
            onPost={handlePost}
            username={me?.username ?? "FanVerse User"}
            avatarUrl={me?.avatarUrl ?? undefined}
            nationCode={me?.nationCode ?? undefined}
          />

          {/* Fan Moments */}
          {fanPhotos.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-heading font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Camera className="h-4 w-4" /> Fan Moments
              </h2>
              {fanPhotos.map((photo) => (
                <FanMomentCard key={photo.id} photo={photo} onCheer={handleCheer} />
              ))}
            </div>
          )}

          {/* Fan of the Match */}
          <FanOfTheMatch fanPhotos={fanPhotos} />

          {/* Daily challenges carousel */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-heading font-bold uppercase tracking-widest text-primary">Daily Challenges</h2>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
              {CHALLENGES.map((c) => (
                <Link key={c.badge} href={c.href}>
                  <div className="min-w-[150px] h-[190px] bg-card border border-border rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:border-primary/60 transition-all duration-200 shrink-0 bg-gradient-to-br from-card to-secondary/60">
                    <span className={`self-start text-[9px] font-extrabold uppercase tracking-wide px-2 py-1 rounded ${c.badgeClass}`}>
                      {c.badge}
                    </span>
                    <p className="text-sm font-bold leading-snug text-foreground">{c.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Live matches */}
          {liveMatches && liveMatches.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-heading font-bold uppercase flex items-center gap-2 text-foreground">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" /> Live Now
              </h3>
              {liveMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="bg-card border border-red-500/20 hover:border-red-500/50 rounded-xl p-5 transition-colors cursor-pointer">
                    <div className="mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                        🔴 Live · {match.competition}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">{match.homeNationFlag}</span>
                        <span className="font-heading font-bold text-foreground truncate">{match.homeNationName}</span>
                      </div>
                      <div className="font-heading text-2xl font-bold text-red-400 tabular-nums shrink-0">
                        {match.homeScore ?? 0} – {match.awayScore ?? 0}
                      </div>
                      <div className="flex items-center justify-end gap-3 flex-1">
                        <span className="font-heading font-bold text-foreground truncate text-right">{match.awayNationName}</span>
                        <span className="text-3xl">{match.awayNationFlag}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-around mt-4 pt-3 border-t border-border/50">
                      {["👍 Cheer", "💬 Banter", "🚀 Predict"].map((label) => (
                        <span key={label} className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold cursor-pointer select-none">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Recent discussions */}
          {discussions && discussions.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-heading font-bold uppercase flex items-center gap-2 text-foreground">
                <MessageSquare className="w-4 h-4 text-primary" /> Fan Banter
              </h3>
              {discussions.map((d) => (
                <Link key={d.id} href={`/discussions/${d.id}`}>
                  <div className="bg-card border border-border hover:border-primary/30 rounded-xl p-5 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border shrink-0">
                          <AvatarImage src={d.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-secondary text-foreground font-heading text-[10px]">
                            {d.username?.substring(0, 2).toUpperCase() ?? "FV"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{d.username}</span>
                            {d.userNationCode && (
                              <span className="text-[10px] text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded font-bold uppercase">
                                {d.userNationCode}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{timeAgo(d.createdAt)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-secondary border border-border px-2 py-1 rounded-md text-muted-foreground whitespace-nowrap shrink-0">
                        {d.commentCount ?? 0} replies
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">{d.title}</h4>
                    {d.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{d.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                      <span>🔥 {d.upvotes ?? 0} cheers</span>
                      <span>💬 {d.commentCount ?? 0} banter</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Upcoming fixtures */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-bold uppercase flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4 text-primary" /> Upcoming Fixtures
              </h3>
              <Link href="/matches" className="text-xs font-bold text-primary hover:underline uppercase tracking-wide">
                View All →
              </Link>
            </div>
            {matchesLoading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)
            ) : !upcomingMatches?.length ? (
              <div className="bg-card border border-border rounded-xl py-8 text-center text-muted-foreground text-sm">
                No upcoming matches scheduled.
              </div>
            ) : upcomingMatches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <div className="bg-card border border-border hover:border-primary/40 rounded-xl overflow-hidden transition-colors cursor-pointer">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-secondary/30">
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{match.competition}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(match.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{match.homeNationFlag}</span>
                      <span className="font-heading font-bold truncate text-foreground">{match.homeNationName}</span>
                    </div>
                    <div className="px-3 py-1 bg-muted rounded font-mono text-xs font-bold text-muted-foreground shrink-0">VS</div>
                    <div className="flex items-center justify-end gap-3 flex-1">
                      <span className="font-heading font-bold truncate text-right text-foreground">{match.awayNationName}</span>
                      <span className="text-2xl">{match.awayNationFlag}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>

        {/* ══════════ RIGHT SIDEBAR ══════════ */}
        <aside className="feed-right overflow-hidden">
        <div className={`feed-right-panel flex flex-col gap-5 w-[360px]${sidebarOpen ? "" : " closed"}`}>

          {/* WC 2026 Bracket Progress */}
          <BracketProgressWidget />

          {/* Prediction standings widget */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[10px] font-heading font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-1.5">
              <Trophy className="h-3 w-3" /> Your Prediction Standings
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className="border border-primary rounded-lg p-4 text-center"
                style={{ background: "linear-gradient(180deg, hsl(var(--secondary)) 0%, rgba(255,204,0,0.05) 100%)" }}
              >
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wide">Local Rank</p>
                <p className="text-xl font-heading font-bold text-primary">
                  {myEntry ? `#${myEntry.rank}` : "—"}
                </p>
              </div>
              <div className="bg-secondary border border-border rounded-lg p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wide">Rep Points</p>
                <p className="text-xl font-heading font-bold text-foreground">
                  {me?.reputationPoints?.toLocaleString() ?? "—"}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-2">Top Predictors:</p>
            <div className="flex flex-col gap-1.5">
              {leaderboard && leaderboard.length > 0 ? leaderboard.slice(0, 5).map((entry) => {
                const isMe = entry.user.username === me?.username;
                return (
                  <div
                    key={entry.user.username}
                    className={`flex items-center justify-between px-2 py-2 rounded-lg text-sm ${
                      isMe ? "bg-primary/10 border border-dashed border-primary/50" : "hover:bg-secondary/60 transition-colors"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold w-5 text-center text-xs ${entry.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                        {entry.rank}
                      </span>
                      <Avatar className="h-6 w-6 border border-border">
                        <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-heading">
                          {entry.user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`font-semibold truncate max-w-[110px] text-xs ${isMe ? "text-primary" : "text-foreground"}`}>
                        {isMe ? `You (${entry.user.username})` : entry.user.username}
                      </span>
                    </div>
                    <span className="font-bold font-mono text-xs text-foreground shrink-0">
                      {entry.user.reputationPoints.toLocaleString()} pts
                    </span>
                  </div>
                );
              }) : (
                <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
              )}
            </div>
            <Link href="/leaderboard" className="block mt-3 pt-3 border-t border-border/50 text-center">
              <span className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">
                Full Leaderboard →
              </span>
            </Link>
          </div>

          {/* Nation confidence battle */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[10px] font-heading font-bold uppercase tracking-widest text-primary mb-1 flex items-center gap-1.5">
              <Swords className="h-3 w-3" /> Nation Confidence Wars
            </h2>
            <p className="text-[11px] text-muted-foreground mb-4">Community confidence rankings by nation.</p>
            <div className="flex flex-col gap-3">
              {topNations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
              ) : topNations.map((nation, idx) => {
                const score = nation.confidenceScore ?? 0;
                const isTop = idx === 0;
                return (
                  <Link key={nation.code} href={`/nations/${nation.code}`}>
                    <div className="flex flex-col gap-1.5 cursor-pointer group">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs w-4 text-center ${isTop ? "text-primary" : "text-muted-foreground"}`}>
                            {idx + 1}
                          </span>
                          <span className="text-lg leading-none">{nation.flagEmoji}</span>
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[130px]">
                            {nation.name}
                          </span>
                        </div>
                        <span className={`font-bold font-mono text-xs ${isTop ? "text-primary" : "text-muted-foreground"}`}>
                          {score}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${score}%`,
                            backgroundColor: isTop ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/nations" className="block mt-4 pt-3 border-t border-border/50 text-center">
              <span className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">
                <Globe className="h-3.5 w-3.5 inline mr-1" /> View All Nations
              </span>
            </Link>
          </div>

          {/* Top Fan Groups */}
          <TopFanGroupsWidget fanPhotos={fanPhotos} />

          {/* Upcoming count teaser */}
          {upcomingMatches && upcomingMatches.length > 0 && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 text-center">
              <div className="text-4xl font-heading font-bold text-primary">{upcomingMatches.length}</div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Upcoming Fixtures</p>
              <Link href="/fixtures" className="block mt-3">
                <button className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wide text-xs py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  View Fixtures
                </button>
              </Link>
            </div>
          )}
        </div>{/* end feed-right-panel */}
        </aside>

      </div>
    </>
  );
}
