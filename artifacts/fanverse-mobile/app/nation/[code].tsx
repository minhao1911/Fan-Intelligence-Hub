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
import { apiFetch } from '@/lib/api';
import type { Nation, NationPulse, User } from '@/lib/api';
import { ReputationBadge } from '@/components/ReputationBadge';
import { LoadingState, ErrorState } from '@/components/LoadingState';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function NationDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { getToken, isSignedIn } = useAuth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { data: nation, isLoading, error, refetch } = useQuery<Nation & {
    recentMatches?: any[];
    upcomingMatches?: any[];
  }>({
    queryKey: ['/api/nations', code],
    queryFn: () => apiFetch(`/api/nations/${code}`),
  });

  const { data: pulse, refetch: refetchPulse } = useQuery<NationPulse>({
    queryKey: ['/api/nations', code, 'pulse'],
    queryFn: () => apiFetch(`/api/nations/${code}/pulse`),
  });

  const { data: me } = useQuery<User>({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch('/api/me', token);
    },
    enabled: !!isSignedIn,
  });

  const isJoined = me?.nationCode === code;

  const joinMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/api/nations/${code}/join`, token, { method: 'POST' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/me'] });
      qc.invalidateQueries({ queryKey: ['/api/nations', code] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/api/nations/${code}/leave`, token, { method: 'POST' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/me'] });
      qc.invalidateQueries({ queryKey: ['/api/nations', code] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPulse()]);
    setRefreshing(false);
  };

  if (isLoading) return <LoadingState message="Loading nation..." />;
  if (error || !nation) return <ErrorState message={(error as Error)?.message ?? 'Not found'} onRetry={refetch} />;

  const pulseMetrics = [
    { label: 'Win Confidence', value: pulse?.winConfidence ?? 0, color: colors.success },
    { label: 'Draw Confidence', value: pulse?.drawConfidence ?? 0, color: colors.primary },
    { label: 'Loss Confidence', value: pulse?.lossConfidence ?? 0, color: colors.destructive },
  ];

  const sentimentRaw = pulse?.sentimentScore ?? 0;
  const moodScore = sentimentRaw <= 1 ? Math.round(sentimentRaw * 100) : Math.round(sentimentRaw);
  const moodColor = moodScore >= 70 ? colors.success : moodScore >= 40 ? colors.primary : colors.destructive;

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
        <Text style={[styles.navTitle, { color: colors.mutedForeground }]}>{nation.confederation}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Nation Hero */}
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={styles.heroFlag}>{nation.flagEmoji}</Text>
        <Text style={[styles.heroName, { color: colors.foreground }]}>{nation.name}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Ionicons name="people" size={14} color={colors.mutedForeground} />
            <Text style={[styles.heroStatText, { color: colors.foreground }]}>
              {(nation.memberCount ?? 0).toLocaleString()} fans
            </Text>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroStat}>
            <Ionicons name="globe" size={14} color={colors.mutedForeground} />
            <Text style={[styles.heroStatText, { color: colors.foreground }]}>{nation.confederation}</Text>
          </View>
        </View>

        {isSignedIn ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              isJoined ? leaveMutation.mutate() : joinMutation.mutate();
            }}
            disabled={joinMutation.isPending || leaveMutation.isPending}
            style={[
              styles.joinBtn,
              isJoined
                ? { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }
                : { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons
              name={isJoined ? 'exit-outline' : 'add'}
              size={16}
              color={isJoined ? colors.foreground : colors.primaryForeground}
            />
            <Text style={[styles.joinText, { color: isJoined ? colors.foreground : colors.primaryForeground }]}>
              {isJoined ? 'Leave Nation' : 'Join Nation'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/sign-in')}
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={16} color={colors.primaryForeground} />
            <Text style={[styles.joinText, { color: colors.primaryForeground }]}>Join Nation</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Nation Pulse */}
      {pulse && (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse" size={15} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nation Pulse</Text>
            <View style={[styles.moodBadge, { backgroundColor: moodColor + '22' }]}>
              <Text style={[styles.moodText, { color: moodColor }]}>Mood {moodScore}/100</Text>
            </View>
          </View>

          {pulseMetrics.map((m) => (
            <View key={m.label} style={styles.pulseRow}>
              <Text style={[styles.pulseLabel, { color: colors.foreground }]}>{m.label}</Text>
              <View style={[styles.pulseTrack, { backgroundColor: colors.muted }]}>
                <View style={[styles.pulseFill, { width: `${Math.min(m.value, 100)}%` as any, backgroundColor: m.color }]} />
              </View>
              <Text style={[styles.pulsePct, { color: m.color }]}>{Math.round(m.value)}%</Text>
            </View>
          ))}

          {(pulse.totalVoters ?? 0) > 0 && (
            <Text style={[styles.pulseVotes, { color: colors.mutedForeground }]}>
              Based on {(pulse.totalVoters ?? 0).toLocaleString()} voters
            </Text>
          )}
        </View>
      )}

      {/* Top Contributors */}
      {(pulse?.topContributors?.length ?? 0) > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={15} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Fans</Text>
          </View>
          {pulse!.topContributors!.slice(0, 5).map((c, i) => (
            <View
              key={c.id}
              style={[styles.contributorRow, i < (pulse!.topContributors!.length - 1) && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Text style={[styles.contributorRank, { color: i === 0 ? colors.primary : colors.mutedForeground }]}>
                #{i + 1}
              </Text>
              <Text style={[styles.contributorName, { color: colors.foreground }]} numberOfLines={1}>
                {c.username}
              </Text>
              <ReputationBadge points={c.reputationPoints} size="sm" />
              <Text style={[styles.contributorPts, { color: colors.primary }]}>
                {c.reputationPoints.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Upcoming Matches */}
      {(nation.upcomingMatches?.length ?? 0) > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={15} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Matches</Text>
          </View>
          {nation.upcomingMatches!.slice(0, 3).map((m: any) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => { Haptics.selectionAsync(); router.push(`/match/${m.id}`); }}
              style={[styles.matchRow, { borderTopWidth: 1, borderTopColor: colors.border }]}
            >
              <Text style={styles.matchFlag}>{m.homeNationFlag}</Text>
              <View style={styles.matchInfo}>
                <Text style={[styles.matchTeams, { color: colors.foreground }]}>
                  {m.homeNationName} vs {m.awayNationName}
                </Text>
                <Text style={[styles.matchTime, { color: colors.mutedForeground }]}>
                  {new Date(m.scheduledAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.matchFlag}>{m.awayNationFlag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 13, fontWeight: '500' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  heroCard: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1,
    padding: 24, alignItems: 'center', gap: 12,
  },
  heroFlag: { fontSize: 64 },
  heroName: { fontSize: 24, fontWeight: '700' as const, textAlign: 'center' },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatText: { fontSize: 13, fontWeight: '500' as const },
  heroDivider: { width: 1, height: 16 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, marginTop: 4,
  },
  joinText: { fontSize: 15, fontWeight: '700' as const },
  sectionCard: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: '700' as const },
  moodBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  moodText: { fontSize: 11, fontWeight: '700' as const },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pulseLabel: { width: 120, fontSize: 12, fontWeight: '500' as const },
  pulseTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' as const },
  pulseFill: { height: '100%', borderRadius: 4 },
  pulsePct: { width: 40, fontSize: 12, fontWeight: '700' as const, textAlign: 'right' as const },
  pulseVotes: { fontSize: 11, textAlign: 'right' as const },
  contributorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  contributorRank: { fontSize: 13, fontWeight: '700' as const, width: 28 },
  contributorName: { flex: 1, fontSize: 14, fontWeight: '500' as const },
  contributorPts: { fontSize: 13, fontWeight: '700' as const },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  matchFlag: { fontSize: 20 },
  matchInfo: { flex: 1, gap: 2 },
  matchTeams: { fontSize: 13, fontWeight: '600' as const },
  matchTime: { fontSize: 11 },
});
