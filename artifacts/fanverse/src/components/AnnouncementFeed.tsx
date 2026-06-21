import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api";
import { Shield, Pin, ChevronRight, X } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isPublished: boolean;
  createdAt: string;
}

const CATEGORY_STYLES: Record<string, { label: string; classes: string }> = {
  update:    { label: "Update",    classes: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  alert:     { label: "Alert",     classes: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  event:     { label: "Event",     classes: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  community: { label: "Community", classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ReadModal({ post, onClose }: { post: Announcement; onClose: () => void }) {
  const cat = CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.update;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Gold accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/15 border border-primary/30 shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">FanVerse HQ</p>
                <p className="text-[10px] text-muted-foreground">{timeAgo(post.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Category + title */}
          <div className="space-y-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cat.classes}`}>
              {post.isPinned && <Pin className="h-2.5 w-2.5" />}
              {cat.label}
            </span>
            <h2 className="text-lg font-heading font-black text-foreground leading-snug">{post.title}</h2>
          </div>

          {/* Full content */}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-t border-border/50 pt-4">
            {post.content}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementFeed() {
  const [open, setOpen] = useState<Announcement | null>(null);

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const r = await fetch(`${getBaseUrl()}api/announcements`);
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  if (announcements.length === 0) return null;

  return (
    <>
      {open && <ReadModal post={open} onClose={() => setOpen(null)} />}

      <div className="flex flex-col gap-2">
        {announcements.map((post) => {
          const cat = CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.update;
          const excerpt = post.content.length > 120 ? post.content.slice(0, 120).trimEnd() + "…" : post.content;

          return (
            <button
              key={post.id}
              onClick={() => setOpen(post)}
              className="w-full text-left group"
            >
              <div className="relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/80 via-primary/40 to-transparent" />

                <div className="pl-4 pr-4 py-3.5 flex items-start gap-3">
                  {/* Shield icon */}
                  <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Source + meta row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">FanVerse HQ</span>
                      {post.isPinned && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-400">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </span>
                      )}
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cat.classes}`}>
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{timeAgo(post.createdAt)}</span>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-heading font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </p>

                    {/* Excerpt */}
                    <p className="text-xs text-muted-foreground leading-relaxed">{excerpt}</p>
                  </div>

                  {/* Read chevron */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
