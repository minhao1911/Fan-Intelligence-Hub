import { useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FanPhoto } from "./FanPhotoComposer";

const TAG_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  jersey: { emoji: "🎽", label: "Fan Jersey",   color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  goat:   { emoji: "🐐", label: "With My GOAT", color: "bg-primary/20 text-primary border-primary/30" },
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

interface FanMomentCardProps {
  photo: FanPhoto;
  onCheer: (id: string) => void;
}

export default function FanMomentCard({ photo, onCheer }: FanMomentCardProps) {
  const [cheered, setCheered] = useState(false);
  const [shared, setShared] = useState(false);
  const tag = TAG_LABELS[photo.tag] ?? TAG_LABELS.jersey;

  const handleCheer = () => {
    if (!cheered) {
      setCheered(true);
      onCheer(photo.id);
    }
  };

  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-primary shrink-0">
            <AvatarImage src={photo.avatarUrl} />
            <AvatarFallback className="bg-secondary text-foreground font-heading text-xs">
              {photo.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">{photo.username}</span>
              {photo.nationCode && (
                <span className="text-[10px] text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded font-bold uppercase">
                  {photo.nationCode}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo(photo.createdAt)}</span>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border ${tag.color}`}>
          {tag.emoji} {tag.label}
        </span>
      </div>

      {/* Caption */}
      {photo.caption && (
        <p className="px-4 pb-3 text-sm text-foreground leading-relaxed">{photo.caption}</p>
      )}

      {/* Photo */}
      <div className="w-full overflow-hidden bg-secondary/30" style={{ maxHeight: "420px" }}>
        <img
          src={photo.imageUrl}
          alt={`Fan moment by ${photo.username}`}
          className="w-full object-cover"
          style={{ maxHeight: "420px" }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-3 border-t border-border/50">
        <button
          type="button"
          onClick={handleCheer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            cheered
              ? "text-red-400 bg-red-500/10"
              : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          }`}
        >
          <Heart className={`h-4 w-4 ${cheered ? "fill-red-400" : ""}`} />
          {photo.cheers + (cheered ? 1 : 0)}
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>
        <button
          type="button"
          onClick={handleShare}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ml-auto ${
            shared ? "text-emerald-400 bg-emerald-500/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Share2 className="h-4 w-4" />
          {shared ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}
