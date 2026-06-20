import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch, formatKickoff } from '@/lib/api';
import type { Match, Poll, ReactionSummary, PredictionSummary, Prediction } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/LoadingState';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type Outcome = 'home' | 'draw' | 'away';

const REACTIONS = [
  { key: 'ecstatic', label: 'Ecstatic', icon: '🔥' },
  { key: 'happy', label: 'Happy', icon: '😄' },
  { key: 'neutral', label: 'Neutral', icon: '😐' },
  { key: 'disappointed', label: 'Disappointed', icon: '😞' },
  { key: 'devastated', label: 'Devastated', icon: '💔' },
];

export default function MatchDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = parseInt(id ?? '0', 10);
  const { getToken, isSignedIn } = useAuth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { data: match, isLoading, error, refetch } = useQuery<Match>({
    queryKey: ['/api/matches', matchId],
    queryFn: () => apiFetch(`/api/matches/${matchId}`),
  });

  const { data: polls, refetch: refetchPolls } = useQuery<Poll[]>({
    queryKey: ['/api/matches', matchId, 'polls'],
    queryFn: () => apiFetch(`/api/matches/${matchId}/polls`),
  });

  const { data: reactions, refetch: refetchReactions } = useQuery<ReactionSummary>({
    queryKey: ['/api/matches', matchId, 'reactions'],
    queryFn: () => apiFetch(`/api/matches/${matchId}/reactions`),
  });

  const { data: predSummary, refetch: refetchPredSummary } = useQuery<PredictionSummary>({
    queryKey: ['/api/matches', matchId, 'predictions/summary'],
    queryFn: () => apiFetch(`/api/matches/${matchId}/predictions/summary`),
  });

  const { data: myPrediction, refetch: refetchMyPred } = useQuery<Prediction | null>({
    queryKey: ['/api/matches', matchId, 'my-prediction'],
    queryFn: async () => {
      if (!isSignedIn) return null;
      const token = await getToken();
      try {
        return await apiFetch<Prediction>(`/api/matches/${matchId}/my-prediction`, token);
      } catch {
        return null;
      }
    },
    enabled: true,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPolls(), refetchReactions(), refetchPredSummary(), refetchMyPred()]);
    setRefreshing(false);
  };

  if (isLoading) return <LoadingState message="Loading match..." />;
  if (error || !match) return <ErrorState message={(error as Error)?.message ?? 'Match not found'} onRetry={refetch} />;

  const statusColor = match.status === 'live' ? colors.live : match.status === 'completed' ? colors.mutedForeground : colors.primary;
  const statusLabel = match.status === 'live' ? 'LIVE' : match.status === 'completed' ? 'FT' : formatKickoff(match.scheduledAt);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.mutedForeground }]}>{match.competition}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Match Header */}
      <View style={[styles.matchHeader, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.statusChip, { backgroundColor: match.status === 'live' ? colors.live + '22' : colors.muted }]}>
          {match.status === 'live' && <View style={[styles.liveDot, { backgroundColor: colors.live }]} />}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        <View style={styles.teamsSection}>
          <View style={styles.teamBlock}>
            <Text style={styles.bigFlag}>{match.homeNationFlag ?? '🏳'}</Text>
            <Text style={[styles.teamNameBig, { color: colors.foreground }]}>{match.homeNationName}</Text>
          </View>

          <View style={styles.scoreSection}>
            {match.status !== 'upcoming' ? (
              <Text style={[styles.bigScore, { color: colors.foreground }]}>
                {match.homeScore ?? 0} – {match.awayScore ?? 0}
              </Text>
            ) : (
              <Text style={[styles.bigVs, { color: colors.mutedForeground }]}>VS</Text>
            )}
          </View>

          <View style={[styles.teamBlock, styles.teamRight]}>
            <Text style={styles.bigFlag}>{match.awayNationFlag ?? '🏳'}</Text>
            <Text style={[styles.teamNameBig, { color: colors.foreground }]}>{match.awayNationName}</Text>
          </View>
        </View>

        {match.competition && (
          <Text style={[styles.venue, { color: colors.mutedForeground }]}>
            {match.competition}{match.stage ? ` · ${match.stage}` : ''}
          </Text>
        )}
      </View>

      {/* Fan Polls */}
      {(polls?.length ?? 0) > 0 && (
        <SectionCard title="Fan Polls" icon="bar-chart-outline" colors={colors}>
          {polls!.map((poll) => (
            <PollBlock
              key={poll.id}
              poll={poll}
              matchId={matchId}
              colors={colors}
              getToken={getToken}
              isSignedIn={!!isSignedIn}
              onVoted={() => qc.invalidateQueries({ queryKey: ['/api/matches', matchId, 'polls'] })}
            />
          ))}
        </SectionCard>
      )}

      {/* Mood Reactions */}
      {match.status !== 'upcoming' && (
        <SectionCard title="Fan Reactions" icon="heart-outline" colors={colors}>
          <ReactionBlock
            matchId={matchId}
            reactions={reactions}
            colors={colors}
            getToken={getToken}
            isSignedIn={!!isSignedIn}
            onReacted={() => {
              qc.invalidateQueries({ queryKey: ['/api/matches', matchId, 'reactions'] });
            }}
          />
        </SectionCard>
      )}

      {/* Score Prediction */}
      {match.status === 'upcoming' && (
        <SectionCard title="Score Prediction" icon="trophy-outline" colors={colors}>
          <PredictionBlock
            match={match}
            matchId={matchId}
            predSummary={predSummary}
            myPrediction={myPrediction}
            colors={colors}
            getToken={getToken}
            isSignedIn={!!isSignedIn}
            onPredicted={() => {
              qc.invalidateQueries({ queryKey: ['/api/matches', matchId, 'predictions/summary'] });
              qc.invalidateQueries({ queryKey: ['/api/matches', matchId, 'my-prediction'] });
            }}
          />
        </SectionCard>
      )}

      {/* Prediction Community Summary (all statuses) */}
      {predSummary && predSummary.totalPredictions > 0 && (
        <SectionCard title="Community Picks" icon="people-outline" colors={colors}>
          <CommunityPicks summary={predSummary} match={match} colors={colors} />
        </SectionCard>
      )}
    </ScrollView>
  );
}

function SectionCard({ title, icon, colors, children }: { title: string; icon: string; colors: any; children: React.ReactNode }) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={15} color={colors.mutedForeground} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function PollBlock({ poll, matchId, colors, getToken, isSignedIn, onVoted }: any) {
  const mutation = useMutation({
    mutationFn: async (optionValue: string) => {
      const token = await getToken();
      return apiFetch(`/api/matches/${matchId}/polls/${poll.id}/vote`, token, {
        method: 'POST',
        body: JSON.stringify({ optionValue }),
      });
    },
    onSuccess: onVoted,
  });

  const total = poll.options.reduce((s: number, o: any) => s + (o.voteCount ?? 0), 0);

  return (
    <View style={styles.pollWrap}>
      <Text style={[styles.pollQuestion, { color: colors.foreground }]}>{poll.question}</Text>
      {poll.options.map((opt: any) => {
        const pct = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
        const isVoted = poll.userVoteOptionValue === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => {
              if (!isSignedIn) { router.push('/sign-in'); return; }
              if (!poll.userVoteOptionValue) {
                Haptics.selectionAsync();
                mutation.mutate(opt.value);
              }
            }}
            disabled={!!poll.userVoteOptionValue}
            style={[
              styles.pollOption,
              { borderColor: isVoted ? colors.primary : colors.border },
            ]}
          >
            <View style={[styles.pollFill, { width: `${pct}%` as any, backgroundColor: isVoted ? colors.primary + '33' : colors.muted }]} />
            <Text style={[styles.pollOptionText, { color: isVoted ? colors.primary : colors.foreground }]}>{opt.label}</Text>
            <Text style={[styles.pollPct, { color: isVoted ? colors.primary : colors.mutedForeground }]}>{pct}%</Text>
          </TouchableOpacity>
        );
      })}
      <Text style={[styles.pollVotes, { color: colors.mutedForeground }]}>{total} votes</Text>
    </View>
  );
}

function ReactionBlock({ matchId, reactions, colors, getToken, isSignedIn, onReacted }: any) {
  const mutation = useMutation({
    mutationFn: async (reaction: string) => {
      const token = await getToken();
      return apiFetch(`/api/matches/${matchId}/reactions`, token, {
        method: 'POST',
        body: JSON.stringify({ reaction }),
      });
    },
    onSuccess: onReacted,
  });

  const total = reactions
    ? Object.values(reactions).filter((v) => typeof v === 'number').reduce((s: number, v) => s + (v as number), 0)
    : 0;

  return (
    <View style={styles.reactionWrap}>
      <View style={styles.reactionGrid}>
        {REACTIONS.map((r) => {
          const count = reactions?.[r.key] ?? 0;
          const isSelected = reactions?.userReaction === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              onPress={() => {
                if (!isSignedIn) { router.push('/sign-in'); return; }
                Haptics.selectionAsync();
                mutation.mutate(r.key);
              }}
              style={[
                styles.reactionBtn,
                { backgroundColor: isSelected ? colors.primary + '22' : colors.muted },
                isSelected && { borderColor: colors.primary, borderWidth: 1 },
              ]}
            >
              <Text style={styles.reactionEmoji}>{r.icon}</Text>
              <Text style={[styles.reactionCount, { color: isSelected ? colors.primary : colors.mutedForeground }]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {total > 0 && (
        <Text style={[styles.reactionTotal, { color: colors.mutedForeground }]}>{total} fan reactions</Text>
      )}
    </View>
  );
}

function PredictionBlock({ match, matchId, predSummary, myPrediction, colors, getToken, isSignedIn, onPredicted }: any) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!outcome) throw new Error('Pick an outcome');
      const token = await getToken();
      return apiFetch(`/api/matches/${matchId}/predict`, token, {
        method: 'POST',
        body: JSON.stringify({
          predictedOutcome: outcome,
          predictedHomeScore: homeScore ? parseInt(homeScore, 10) : undefined,
          predictedAwayScore: awayScore ? parseInt(awayScore, 10) : undefined,
        }),
      });
    },
    onSuccess: onPredicted,
  });

  if (myPrediction) {
    return (
      <View style={[styles.lockedBox, { backgroundColor: colors.success + '11' }]}>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        <Text style={[styles.lockedText, { color: colors.success }]}>
          Your pick: {myPrediction.predictedOutcome === 'home' ? match.homeNationName + ' Win' : myPrediction.predictedOutcome === 'draw' ? 'Draw' : match.awayNationName + ' Win'}
        </Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <TouchableOpacity
        onPress={() => router.push('/sign-in')}
        style={[styles.signInPrompt, { backgroundColor: colors.muted }]}
      >
        <Text style={[styles.signInPromptText, { color: colors.foreground }]}>Sign in to make a prediction</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  const OUTCOMES: { key: Outcome; label: string }[] = [
    { key: 'home', label: match.homeNationName.split(' ')[0] + ' Win' },
    { key: 'draw', label: 'Draw' },
    { key: 'away', label: match.awayNationName.split(' ')[0] + ' Win' },
  ];

  return (
    <View style={styles.predWrap}>
      <View style={styles.predOutcomes}>
        {OUTCOMES.map((o) => (
          <TouchableOpacity
            key={o.key}
            onPress={() => { Haptics.selectionAsync(); setOutcome(o.key); }}
            style={[
              styles.predOutcomeBtn,
              outcome === o.key ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted },
            ]}
          >
            <Text style={[styles.predOutcomeText, { color: outcome === o.key ? colors.primaryForeground : colors.foreground }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mutation.isError && (
        <Text style={[styles.errText, { color: colors.destructive }]}>
          {(mutation.error as Error).message}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); mutation.mutate(); }}
        disabled={!outcome || mutation.isPending}
        style={[styles.lockBtn, { backgroundColor: outcome ? colors.primary : colors.muted }]}
      >
        <Ionicons name="lock-closed" size={14} color={outcome ? colors.primaryForeground : colors.mutedForeground} />
        <Text style={[styles.lockText, { color: outcome ? colors.primaryForeground : colors.mutedForeground }]}>
          {mutation.isPending ? 'Locking...' : 'Lock In Prediction'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CommunityPicks({ summary, match, colors }: { summary: PredictionSummary; match: Match; colors: any }) {
  const bars = [
    { label: match.homeNationName.split(' ')[0], pct: summary.homePercent, color: colors.success },
    { label: 'Draw', pct: summary.drawPercent, color: colors.mutedForeground },
    { label: match.awayNationName.split(' ')[0], pct: summary.awayPercent, color: colors.primary },
  ];

  return (
    <View style={styles.communityWrap}>
      {bars.map((b) => (
        <View key={b.label} style={styles.communityRow}>
          <Text style={[styles.communityLabel, { color: colors.foreground }]}>{b.label}</Text>
          <View style={[styles.communityTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.communityFill, { width: `${b.pct}%` as any, backgroundColor: b.color }]} />
          </View>
          <Text style={[styles.communityPct, { color: b.color }]}>{Math.round(b.pct)}%</Text>
        </View>
      ))}
      <Text style={[styles.communityTotal, { color: colors.mutedForeground }]}>
        {summary.totalPredictions.toLocaleString()} predictions
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 13, fontWeight: '500' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  matchHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5 },
  teamsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  teamBlock: { flex: 1, alignItems: 'center', gap: 6 },
  teamRight: { alignItems: 'center' },
  bigFlag: { fontSize: 44 },
  teamNameBig: { fontSize: 13, fontWeight: '700' as const, textAlign: 'center' },
  scoreSection: { minWidth: 80, alignItems: 'center' },
  bigScore: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1 },
  bigVs: { fontSize: 18, fontWeight: '700' as const, letterSpacing: 2 },
  venue: { fontSize: 11, textAlign: 'center' },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const },
  pollWrap: { gap: 10 },
  pollQuestion: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  pollOption: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden' as const,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative' as const,
    minHeight: 42,
  },
  pollFill: {
    position: 'absolute' as const,
    top: 0, left: 0, bottom: 0,
    borderRadius: 8,
  },
  pollOptionText: { flex: 1, fontSize: 13, fontWeight: '500' as const, zIndex: 1 },
  pollPct: { fontSize: 12, fontWeight: '700' as const, zIndex: 1 },
  pollVotes: { fontSize: 11, textAlign: 'right' as const },
  reactionWrap: { gap: 10 },
  reactionGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' as const },
  reactionBtn: {
    flex: 1,
    minWidth: 56,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  reactionEmoji: { fontSize: 22 },
  reactionCount: { fontSize: 12, fontWeight: '600' as const },
  reactionTotal: { fontSize: 11, textAlign: 'right' as const },
  predWrap: { gap: 12 },
  predOutcomes: { flexDirection: 'row', gap: 8 },
  predOutcomeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  predOutcomeText: { fontSize: 12, fontWeight: '600' as const },
  errText: { fontSize: 12, textAlign: 'center' },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  lockText: { fontSize: 14, fontWeight: '700' as const },
  lockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
  },
  lockedText: { fontSize: 14, fontWeight: '600' as const },
  signInPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
  },
  signInPromptText: { fontSize: 14, fontWeight: '500' as const },
  communityWrap: { gap: 10 },
  communityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  communityLabel: { width: 70, fontSize: 12, fontWeight: '600' as const },
  communityTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' as const },
  communityFill: { height: '100%', borderRadius: 4 },
  communityPct: { width: 38, fontSize: 12, fontWeight: '700' as const, textAlign: 'right' as const },
  communityTotal: { fontSize: 11, textAlign: 'right' as const },
});
