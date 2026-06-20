import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch, formatKickoff } from '@/lib/api';
import type { Match, Prediction } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/LoadingState';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

type Tab = 'upcoming' | 'history';
type Outcome = 'home' | 'draw' | 'away';

export default function PredictionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const [tab, setTab] = useState<Tab>('upcoming');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground, paddingHorizontal: 16 }]}>My Picks</Text>
        <View style={styles.authPrompt}>
          <Ionicons name="stats-chart" size={48} color={colors.mutedForeground} />
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Sign in to make predictions</Text>
          <Text style={[styles.authSub, { color: colors.mutedForeground }]}>
            Predict match outcomes and earn XP for correct picks
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/sign-in')}
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.authBtnText, { color: colors.primaryForeground }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Picks</Text>
        <View style={styles.tabs}>
          {(['upcoming', 'history'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tab,
                tab === t ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted },
              ]}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.primaryForeground : colors.mutedForeground }]}>
                {t === 'upcoming' ? 'Make Picks' : 'History'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'upcoming' ? (
        <UpcomingPredictions colors={colors} />
      ) : (
        <PredictionHistory colors={colors} />
      )}
    </View>
  );
}

function UpcomingPredictions({ colors }: { colors: any }) {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  const { data: matches, isLoading, error, refetch } = useQuery<Match[]>({
    queryKey: ['/api/matches', 'upcoming-predict'],
    queryFn: () => apiFetch('/api/matches?status=upcoming&limit=20'),
  });

  const { data: myPredictions } = useQuery<Prediction[]>({
    queryKey: ['/api/me/predictions'],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch('/api/me/predictions', token);
    },
  });

  const predictedSet = new Set((myPredictions ?? []).map((p) => p.matchId));

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <LoadingState message="Loading matches..." />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  return (
    <FlatList
      data={matches ?? []}
      keyExtractor={(m) => m.id.toString()}
      renderItem={({ item }) => (
        <PredictCard
          match={item}
          alreadyPredicted={predictedSet.has(item.id)}
          colors={colors}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['/api/me/predictions'] })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

function PredictCard({
  match, alreadyPredicted, colors, onSuccess,
}: {
  match: Match;
  alreadyPredicted: boolean;
  colors: any;
  onSuccess: () => void;
}) {
  const { getToken } = useAuth();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!outcome) throw new Error('Pick an outcome first');
      const token = await getToken();
      return apiFetch(`/api/matches/${match.id}/predict`, token, {
        method: 'POST',
        body: JSON.stringify({
          predictedOutcome: outcome,
          predictedHomeScore: homeScore ? parseInt(homeScore, 10) : undefined,
          predictedAwayScore: awayScore ? parseInt(awayScore, 10) : undefined,
        }),
      });
    },
    onSuccess,
  });

  if (alreadyPredicted) {
    return (
      <View style={[styles.predictCard, { backgroundColor: colors.card, borderColor: colors.success + '44' }]}>
        <View style={styles.matchRow}>
          <Text style={styles.matchFlag}>{match.homeNationFlag}</Text>
          <View style={styles.matchCenter}>
            <Text style={[styles.matchTeams, { color: colors.foreground }]}>
              {match.homeNationName} vs {match.awayNationName}
            </Text>
            <Text style={[styles.matchTime, { color: colors.mutedForeground }]}>{formatKickoff(match.scheduledAt)}</Text>
          </View>
          <Text style={styles.matchFlag}>{match.awayNationFlag}</Text>
        </View>
        <View style={[styles.predictedBadge, { backgroundColor: colors.success + '22' }]}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={[styles.predictedText, { color: colors.success }]}>Prediction locked in</Text>
        </View>
      </View>
    );
  }

  const OUTCOMES: { key: Outcome; label: string }[] = [
    { key: 'home', label: match.homeNationName.split(' ')[0] },
    { key: 'draw', label: 'Draw' },
    { key: 'away', label: match.awayNationName.split(' ')[0] },
  ];

  return (
    <View style={[styles.predictCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.matchRow}>
        <Text style={styles.matchFlag}>{match.homeNationFlag}</Text>
        <View style={styles.matchCenter}>
          <Text style={[styles.matchTeams, { color: colors.foreground }]}>
            {match.homeNationName} vs {match.awayNationName}
          </Text>
          <Text style={[styles.matchTime, { color: colors.mutedForeground }]}>{formatKickoff(match.scheduledAt)}</Text>
        </View>
        <Text style={styles.matchFlag}>{match.awayNationFlag}</Text>
      </View>

      <View style={styles.outcomeRow}>
        {OUTCOMES.map((o) => (
          <TouchableOpacity
            key={o.key}
            onPress={() => { Haptics.selectionAsync(); setOutcome(o.key); }}
            style={[
              styles.outcomeBtn,
              outcome === o.key
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.outcomeText, { color: outcome === o.key ? colors.primaryForeground : colors.foreground }]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.scoreRow}>
        <TextInput
          value={homeScore}
          onChangeText={setHomeScore}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.scoreInput, { backgroundColor: colors.muted, color: colors.foreground }]}
        />
        <Text style={[styles.scoreDash, { color: colors.mutedForeground }]}>–</Text>
        <TextInput
          value={awayScore}
          onChangeText={setAwayScore}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.scoreInput, { backgroundColor: colors.muted, color: colors.foreground }]}
        />
        <Text style={[styles.scoreHint, { color: colors.mutedForeground }]}>Optional score (+bonus XP)</Text>
      </View>

      {mutation.isError && (
        <Text style={[styles.errText, { color: colors.destructive }]}>
          {(mutation.error as Error).message}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); mutation.mutate(); }}
        disabled={!outcome || mutation.isPending}
        style={[
          styles.lockBtn,
          { backgroundColor: !outcome ? colors.muted : colors.primary },
        ]}
      >
        <Ionicons name="lock-closed" size={14} color={!outcome ? colors.mutedForeground : colors.primaryForeground} />
        <Text style={[styles.lockText, { color: !outcome ? colors.mutedForeground : colors.primaryForeground }]}>
          {mutation.isPending ? 'Locking in...' : 'Lock In Prediction'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function PredictionHistory({ colors }: { colors: any }) {
  const { getToken } = useAuth();
  const { data, isLoading, error, refetch } = useQuery<Prediction[]>({
    queryKey: ['/api/me/predictions', 'full'],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch('/api/me/predictions', token);
    },
  });

  if (isLoading) return <LoadingState message="Loading history..." />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;
  if ((data?.length ?? 0) === 0) {
    return (
      <View style={styles.emptyHistory}>
        <Ionicons name="trophy-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No predictions yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(p) => `${p.matchId}-${p.createdAt}`}
      renderItem={({ item: p }) => (
        <View style={[styles.histCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.histTop}>
            <Text style={styles.histFlag}>{p.match.homeNationFlag}</Text>
            <View style={styles.histMatchInfo}>
              <Text style={[styles.histTeams, { color: colors.foreground }]} numberOfLines={1}>
                {p.match.homeNationName} vs {p.match.awayNationName}
              </Text>
              <Text style={[styles.histStatus, { color: colors.mutedForeground }]}>
                {p.match.status === 'completed' ? `FT: ${p.match.homeScore ?? 0}–${p.match.awayScore ?? 0}` : formatKickoff(p.match.scheduledAt)}
              </Text>
            </View>
            <Text style={styles.histFlag}>{p.match.awayNationFlag}</Text>
          </View>

          <View style={styles.histHeader}>
            <Text style={[styles.histOutcome, { color: colors.foreground }]}>
              {p.predictedOutcome === 'home' ? 'Home Win' : p.predictedOutcome === 'draw' ? 'Draw' : 'Away Win'}
              {(p.predictedHomeScore !== null && p.predictedAwayScore !== null)
                ? ` (${p.predictedHomeScore}–${p.predictedAwayScore})`
                : ''}
            </Text>
            {p.isResolved ? (
              <View style={[styles.resultBadge, { backgroundColor: (p.xpEarned ?? 0) > 0 ? colors.success + '22' : colors.destructive + '22' }]}>
                <Ionicons
                  name={(p.xpEarned ?? 0) > 0 ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={(p.xpEarned ?? 0) > 0 ? colors.success : colors.destructive}
                />
                <Text style={[styles.resultText, { color: (p.xpEarned ?? 0) > 0 ? colors.success : colors.destructive }]}>
                  {(p.xpEarned ?? 0) > 0 ? `+${p.xpEarned} XP` : 'Miss'}
                </Text>
              </View>
            ) : (
              <View style={[styles.resultBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.resultText, { color: colors.mutedForeground }]}>Pending</Text>
              </View>
            )}
          </View>

          <Text style={[styles.histDate, { color: colors.mutedForeground }]}>
            {new Date(p.createdAt).toLocaleDateString()}
          </Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' as const },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: '600' as const },
  list: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'web' ? 34 : 16 },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  authTitle: { fontSize: 18, fontWeight: '700' as const, textAlign: 'center' },
  authSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  authBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  authBtnText: { fontSize: 16, fontWeight: '700' as const },
  predictCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchFlag: { fontSize: 24 },
  matchCenter: { flex: 1, alignItems: 'center', gap: 2 },
  matchTeams: { fontSize: 13, fontWeight: '600' as const, textAlign: 'center' },
  matchTime: { fontSize: 11, textAlign: 'center' },
  outcomeRow: { flexDirection: 'row', gap: 8 },
  outcomeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  outcomeText: { fontSize: 13, fontWeight: '600' as const },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreInput: {
    width: 48, height: 40, borderRadius: 8, textAlign: 'center' as const,
    fontSize: 16, fontWeight: '700' as const,
  },
  scoreDash: { fontSize: 16, fontWeight: '700' as const },
  scoreHint: { flex: 1, fontSize: 11 },
  lockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10,
  },
  lockText: { fontSize: 14, fontWeight: '700' as const },
  errText: { fontSize: 12, textAlign: 'center' },
  predictedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' as const,
  },
  predictedText: { fontSize: 13, fontWeight: '600' as const },
  histCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  histTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  histFlag: { fontSize: 20 },
  histMatchInfo: { flex: 1, gap: 2 },
  histTeams: { fontSize: 13, fontWeight: '600' as const },
  histStatus: { fontSize: 11 },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histOutcome: { fontSize: 14, fontWeight: '600' as const, flex: 1 },
  resultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  resultText: { fontSize: 12, fontWeight: '600' as const },
  histDate: { fontSize: 11 },
  emptyHistory: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14 },
});
