import { apiUrl } from './query-client';

export interface Match {
  id: number;
  homeNationCode: string;
  homeNationName: string;
  homeNationFlag: string;
  awayNationCode: string;
  awayNationName: string;
  awayNationFlag: string;
  competition: string;
  stage?: string;
  status: 'upcoming' | 'live' | 'completed';
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  homeConfidence?: number | null;
  awayConfidence?: number | null;
}

export interface Nation {
  code: string;
  name: string;
  flagEmoji: string;
  confederation: string;
  memberCount: number;
  confidenceScore: number;
  isUserMember?: boolean;
}

export interface User {
  id: number;
  clerkId: string;
  username: string;
  nationCode: string | null;
  nationName: string | null;
  reputationPoints: number;
  reputationTier: string;
  totalVotes: number;
  totalReactions: number;
  totalDiscussions: number;
  totalPredictions: number;
  avatarUrl?: string | null;
}

export interface Discussion {
  id: number;
  title: string;
  content: string;
  username: string;
  avatarUrl?: string | null;
  userNationCode?: string | null;
  reputationTier: string;
  upvotes: number;
  commentCount: number;
  category: string;
  nationCode?: string | null;
  matchId?: number | null;
  createdAt: string;
  hasUserUpvoted: boolean;
}

export interface Comment {
  id: number;
  content: string;
  username: string;
  avatarUrl?: string | null;
  reputationTier: string;
  createdAt: string;
}

export interface Prediction {
  matchId: number;
  predictedOutcome: 'home' | 'draw' | 'away';
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  isResolved: boolean;
  isCorrect: boolean | null;
  xpEarned: number | null;
  createdAt: string;
  match: {
    homeNationCode: string;
    homeNationName: string;
    homeNationFlag: string;
    awayNationCode: string;
    awayNationName: string;
    awayNationFlag: string;
    status: string;
    scheduledAt: string;
    homeScore: number | null;
    awayScore: number | null;
  };
}

export interface PredictionSummary {
  homePercent: number;
  drawPercent: number;
  awayPercent: number;
  totalPredictions: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: number;
    username: string;
    avatarUrl?: string | null;
    reputationPoints: number;
    reputationTier: string;
    nationCode: string | null;
  };
  totalVotes: number;
  totalReactions: number;
}

export interface GlobalStats {
  totalFans: number;
  totalNationsActive: number;
  totalMatchesCovered: number;
  totalVotesCast: number;
  totalDiscussions: number;
  liveMatchCount: number;
}

export interface NationPulse {
  nationCode: string;
  nationName: string;
  overallConfidence: number;
  winConfidence: number;
  drawConfidence: number;
  lossConfidence: number;
  sentimentScore: number;
  totalVoters: number;
  topContributors?: {
    id: number;
    username: string;
    reputationPoints: number;
    reputationTier: string;
    nationCode: string | null;
  }[];
}

export interface PollOption {
  value: string;
  label: string;
  voteCount: number;
}

export interface Poll {
  id: number;
  matchId: number;
  question: string;
  pollType: string;
  options: PollOption[];
  userVoteOptionValue: string | null;
  totalVotes: number;
  status: string;
}

export interface ReactionSummary {
  ecstatic: number;
  happy: number;
  neutral: number;
  disappointed: number;
  devastated: number;
  userReaction: string | null;
}

export async function apiFetch<T>(
  path: string,
  token?: string | null,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(path), { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const TIERS: Record<string, { label: string; color: string; minPoints: number }> = {
  casual: { label: 'Casual', color: '#9fa3a8', minPoints: 0 },
  fan: { label: 'Fan', color: '#60a5fa', minPoints: 50 },
  capo: { label: 'Capo', color: '#a855f7', minPoints: 200 },
  ultras: { label: 'Ultras', color: '#ffd600', minPoints: 500 },
};

export function getTier(points: number): string {
  if (points >= 500) return 'ultras';
  if (points >= 200) return 'capo';
  if (points >= 50) return 'fan';
  return 'casual';
}

export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 0) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (diffH < 24) return `Today ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  if (diffH < 48) return `Tomorrow ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
