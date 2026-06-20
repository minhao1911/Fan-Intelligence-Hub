import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/react";

interface PredictionSnapshot {
  matchId: number;
  status: string;
  isResolved: boolean;
  xpEarned: number;
}

function getBaseUrl() {
  return window.location.origin + "/";
}

export function useMatchNotifications() {
  const { getToken, isSignedIn } = useAuth();
  const prevStateRef = useRef<Map<number, PredictionSnapshot>>(new Map());
  const initializedRef = useRef(false);

  const fetchAndNotify = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();
      const res = await fetch(`${getBaseUrl()}api/me/predictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const predictions: Array<{
        matchId: number;
        isResolved: boolean;
        xpEarned: number;
        match: {
          homeNationFlag: string;
          homeNationName: string;
          awayNationFlag: string;
          awayNationName: string;
          status: string;
        };
      }> = await res.json();

      const prev = prevStateRef.current;
      const isFirstLoad = !initializedRef.current;

      for (const p of predictions) {
        const { matchId, isResolved, xpEarned, match } = p;
        const { homeNationFlag, homeNationName, awayNationFlag, awayNationName, status } = match;
        const matchLabel = `${homeNationFlag} ${homeNationName} vs ${awayNationFlag} ${awayNationName}`;

        const existing = prev.get(matchId);

        if (!isFirstLoad && existing) {
          // Match just went live
          if (existing.status !== "live" && status === "live") {
            toast(`🔴 Match is LIVE!`, {
              description: `${matchLabel} has kicked off — your prediction is on the line!`,
              duration: 8000,
              action: {
                label: "View",
                onClick: () => { window.location.href = "/predictions"; },
              },
            });
          }

          // Prediction just got resolved
          if (!existing.isResolved && isResolved) {
            const baseXp = 5;
            const bonus = xpEarned - baseXp;
            if (bonus > 0) {
              toast(`✅ Correct prediction!`, {
                description: `${matchLabel} — you earned +${xpEarned} XP (incl. +${bonus} bonus)`,
                duration: 9000,
                action: {
                  label: "See results",
                  onClick: () => { window.location.href = "/predictions"; },
                },
              });
            } else {
              toast(`Match resolved`, {
                description: `${matchLabel} — better luck next time. +5 XP for participating.`,
                duration: 7000,
              });
            }
          }
        }

        prev.set(matchId, { matchId, status, isResolved, xpEarned });
      }

      initializedRef.current = true;
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;

    // Initial load — populate state without notifying
    fetchAndNotify();

    // Poll every 45 seconds
    const interval = setInterval(fetchAndNotify, 45_000);
    return () => clearInterval(interval);
  }, [isSignedIn, fetchAndNotify]);
}
