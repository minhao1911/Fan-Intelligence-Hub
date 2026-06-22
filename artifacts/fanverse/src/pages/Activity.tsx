import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getBaseUrl } from "@/lib/api";
import { MessageSquare, ThumbsUp, Vote, Zap, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const REACTION_EMOJI: Record<string, string> = {
  ecstatic: "🤩", happy: "😄", neutral: "😐",
  disappointed: "😔", devastated: "💔",
};

const CATEGORY_COLORS: Record<string, string> = {
  analysis: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  prediction: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  reaction: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  general: "bg-muted text-muted-foreground border-border",
};

type ActivityItem = {
  type: "discussion" | "comment" | "reaction" | "poll_vote";
  id: number;
  createdAt: string;
  pts: number;
  [key: string]: unknown;
};

function useMyActivity(limit = 50) {
  const { getToken } = useAuth();
  return useQuery<ActivityItem[]>({
    queryKey: ["me-activity", limit],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/me/activity?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Failed to fetch activity");
      return r.json();
    },
    staleTime: 30_000,
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ActivityItemCard({ item }: { item: ActivityItem }) {
  if (item.type === "discussion") {
    const catColor = CATEGORY_COLORS[item.category as string] ?? CATEGORY_COLORS.general;
    return (
      <Link href={`/discussions/${item.id}`}>
        <Card className="bg-card border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
          <CardContent className="p-4 flex gap-3 items-start">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Posted a thread
                </span>
                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${catColor}`}>
                  {item.category as string}
                </span>
                {item.nationCode && (
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase">
                    {item.nationCode as string}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-foreground group-hover:text-primary/90 transition-colors truncate">
                {item.title as string}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs font-mono font-bold text-primary">+{item.pts} pts</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" /> {timeAgo(item.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (item.type === "comment") {
    return (
      <Link href={`/discussions/${item.discussionId as number}`}>
        <Card className="bg-card border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
          <CardContent className="p-4 flex gap-3 items-start">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
              <ArrowRight className="h-4 w-4 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Left a comment
              </p>
              <p className="text-sm text-foreground/80 line-clamp-2">
                {item.content as string}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs font-mono font-bold text-primary">+{item.pts} pts</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" /> {timeAgo(item.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (item.type === "reaction") {
    const emoji = REACTION_EMOJI[item.reactionType as string] ?? "😶";
    const homeCode = item.homeNationCode as string | null;
    const awayCode = item.awayNationCode as string | null;
    return (
      <Link href={item.matchId ? `/matches/${item.matchId as number}` : "/matches"}>
        <Card className="bg-card border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
          <CardContent className="p-4 flex gap-3 items-start">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 text-base">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Match reaction · <span className="capitalize">{item.reactionType as string}</span>
              </p>
              {homeCode && awayCode && (
                <p className="text-sm font-bold text-foreground">
                  {homeCode} vs {awayCode}
                </p>
              )}
              {item.comment && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.comment as string}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs font-mono font-bold text-primary">+{item.pts} pts</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" /> {timeAgo(item.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (item.type === "poll_vote") {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex gap-3 items-start">
          <div className="mt-0.5 w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Vote className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Cast a poll vote
            </p>
            <p className="text-sm font-bold text-foreground capitalize">
              {(item.optionValue as string).replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs font-mono font-bold text-primary">+{item.pts} pts</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" /> {timeAgo(item.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default function Activity() {
  const { data: items, isLoading } = useMyActivity();

  const totalPts = items?.reduce((sum, i) => sum + i.pts, 0) ?? 0;
  const counts = {
    discussions: items?.filter((i) => i.type === "discussion").length ?? 0,
    comments: items?.filter((i) => i.type === "comment").length ?? 0,
    reactions: items?.filter((i) => i.type === "reaction").length ?? 0,
    votes: items?.filter((i) => i.type === "poll_vote").length ?? 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="border-b border-border/50 pb-6">
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground">My Activity</h1>
        <p className="text-muted-foreground mt-1">Your complete engagement history on FanVerse.</p>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Threads", value: counts.discussions, icon: <MessageSquare className="h-4 w-4 text-primary" />, color: "text-primary" },
          { label: "Comments", value: counts.comments, icon: <ArrowRight className="h-4 w-4 text-sky-400" />, color: "text-sky-400" },
          { label: "Reactions", value: counts.reactions, icon: <ThumbsUp className="h-4 w-4 text-orange-400" />, color: "text-orange-400" },
          { label: "Votes", value: counts.votes, icon: <Vote className="h-4 w-4 text-violet-400" />, color: "text-violet-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className={`text-xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Points summary */}
      {(items?.length ?? 0) > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <Zap className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-bold text-primary">+{totalPts} pts</span>
            <span className="text-muted-foreground"> earned from your last {items?.length} actions shown here.</span>
          </p>
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : (items?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-2xl gap-3 text-center">
          <span className="text-5xl">📋</span>
          <div>
            <p className="font-heading font-bold uppercase text-foreground tracking-wide">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start engaging — vote, react, discuss!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items!.map((item, idx) => (
            <ActivityItemCard key={`${item.type}-${item.id}-${idx}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
