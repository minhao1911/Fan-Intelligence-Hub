import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { fireMatchLiveToast, firePredictionCorrectToast } from "@/components/matchToasts";

interface PredictionSnapshot {
  matchId: number;
  status: string;
  isResolved: boolean;
  xpEarned: number;
}

interface LiveMatchSnapshot {
  id: number;
  homeNationFlag: string;
  homeNationName: string;
  homeNationCode: string;
  awayNationFlag: string;
  awayNationName: string;
  awayNationCode: string;
  stage: string | null;
}

function getBaseUrl() {
  return window.location.origin + "/";
}

export function useMatchNotifications() {
  const seenLiveRef = useRef<Set<number>>(new Set());
  const liveInitRef = useRef(false);
  const prevPredRef = useRef<Map<number, PredictionSnapshot>>(new Map());
  const predInitRef = useRef(false);

  const pollLiveMatches = useCallback(async () => {
    try {
      const res = await fetch(`${getBaseUrl()}api/matches?status=live&limit=20`);
      if (!res.ok) return;
      const matches: LiveMatchSnapshot[] = await res.json();

      if (!liveInitRef.current) {
        for (const m of matches) seenLiveRef.current.add(m.id);
        liveInitRef.current = true;
        return;
      }

      for (const m of matches) {
        if (!seenLiveRef.current.has(m.id)) {
          seenLiveRef.current.add(m.id);
          fireMatchLiveToast(m);
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  const pollPredictions = useCallback(async () => {
    try {
      const res = await fetch(`${getBaseUrl()}api/me/predictions`);
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

      const prev = prevPredRef.current;
      const isFirstLoad = !predInitRef.current;

      for (const p of predictions) {
        const { matchId, isResolved, xpEarned, match } = p;
        const { homeNationFlag, homeNationName, awayNationFlag, awayNationName, status } = match;
        const matchLabel = `${homeNationFlag} ${homeNationName} vs ${awayNationFlag} ${awayNationName}`;
        const existing = prev.get(matchId);

        if (!isFirstLoad && existing) {
          if (!existing.isResolved && isResolved) {
            const baseXp = 5;
            const bonus = xpEarned - baseXp;
            if (bonus > 0) {
              firePredictionCorrectToast(matchLabel, matchId, xpEarned, bonus);
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

      predInitRef.current = true;
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    pollLiveMatches();
    const interval = setInterval(pollLiveMatches, 30_000);
    return () => clearInterval(interval);
  }, [pollLiveMatches]);

  useEffect(() => {
    pollPredictions();
    const interval = setInterval(pollPredictions, 45_000);
    return () => clearInterval(interval);
  }, [pollPredictions]);
}
