import { Crown, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function FounderBadge({ founderNumber, size = "sm" }: { founderNumber?: number | null; size?: "sm" | "xs" }) {
  if (size === "xs") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 text-[9px] font-bold uppercase tracking-wide shrink-0">
        <Crown className="w-2.5 h-2.5" />
        {founderNumber != null ? `#${founderNumber}` : "Founder"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 text-[10px] font-bold uppercase tracking-wide shrink-0">
      <Crown className="w-3 h-3" />
      Founder{founderNumber != null ? ` #${founderNumber}` : ""}
    </span>
  );
}

export function PremiumBadge({ size = "sm" }: { size?: "sm" | "xs" }) {
  if (size === "xs") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/40 text-violet-400 text-[9px] font-bold uppercase tracking-wide shrink-0">
        <Zap className="w-2.5 h-2.5" />
        Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/15 border border-violet-500/40 text-violet-400 text-[10px] font-bold uppercase tracking-wide shrink-0">
      <Zap className="w-3 h-3" />
      Premium
    </span>
  );
}

const FRAME_RING: Record<string, string> = {
  nation_frame:   "ring-2 ring-offset-1 ring-offset-background ring-primary/70",
  animated_flag:  "ring-2 ring-offset-1 ring-offset-background ring-sky-500/70",
  worldcup_theme: "ring-2 ring-offset-1 ring-offset-background ring-amber-400/70",
  special_theme:  "ring-2 ring-offset-1 ring-offset-background ring-violet-500/70",
};

export function AvatarWithFrame({
  avatarUrl,
  username,
  isFounder,
  isPremium,
  equippedFrame,
  size = "md",
  className = "",
}: {
  avatarUrl?: string | null;
  username: string;
  isFounder?: boolean;
  isPremium?: boolean;
  equippedFrame?: { category: string } | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = {
    xs: "h-7 w-7",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-28 w-28",
  }[size];

  const textSize = {
    xs: "text-[9px]",
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-4xl",
  }[size];

  let ringClass = "";
  if (isFounder) {
    ringClass = "ring-2 ring-offset-1 ring-offset-background ring-yellow-400/80";
  } else if (equippedFrame) {
    ringClass = FRAME_RING[equippedFrame.category] ?? "";
  } else if (isPremium) {
    ringClass = "ring-2 ring-offset-1 ring-offset-background ring-violet-500/60";
  }

  return (
    <Avatar className={`${sizeClass} ${ringClass} ${className}`}>
      <AvatarImage src={avatarUrl || undefined} className="object-cover" />
      <AvatarFallback className={`bg-muted text-muted-foreground font-heading ${textSize}`}>
        {username.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
