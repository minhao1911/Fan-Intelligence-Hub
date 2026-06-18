import { cn } from "@/lib/utils";

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  Casual: {
    label: "Casual",
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
    glow: "",
  },
  Fan: {
    label: "Fan",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/30",
    glow: "shadow-sky-500/10",
  },
  Capo: {
    label: "Capo",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/30",
    glow: "shadow-violet-500/20",
  },
  Ultras: {
    label: "Ultras",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/40",
    glow: "shadow-primary/20 shadow-lg",
  },
};

interface ReputationBadgeProps {
  tier: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ReputationBadge({ tier, size = "md", className }: ReputationBadgeProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.Casual;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] tracking-widest",
    md: "px-3 py-1 text-xs tracking-widest",
    lg: "px-4 py-1.5 text-sm tracking-widest",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-heading font-bold uppercase rounded border",
        config.color,
        config.bg,
        config.border,
        config.glow,
        sizeClasses[size],
        className,
      )}
    >
      {config.label}
    </span>
  );
}

export function getTierConfig(tier: string) {
  return TIER_CONFIG[tier] ?? TIER_CONFIG.Casual;
}
