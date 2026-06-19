import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMatchTime(utcDate: string, long = false): string {
  const d = new Date(utcDate);
  if (long) {
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function stageName(stage: string): string {
  const map: Record<string, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarter Finals",
    SEMI_FINALS: "Semi Finals",
    THIRD_PLACE: "3rd Place",
    FINAL: "Final",
  };
  return map[stage] ?? stage.replace(/_/g, " ");
}
