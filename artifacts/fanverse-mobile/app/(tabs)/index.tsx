import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, Platform, FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import type { Match, Nation, GlobalStats, LeaderboardEntry, Discussion } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { ReputationBadge } from '@/components/ReputationBadge';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: liveMatches, refetch: refetchLive } = useQuery<Match[]>({
    queryKey: ['/api/matches', 'live'],
    queryFn: () => apiFetch('/api/matches?status=live&limit=5'),
  });

  const { data: upcomingMatches, refetch: refetchUpcoming } = useQuery<Match[]>({
    queryKey: ['/api/matches', 'upcoming'],
    queryFn: () => apiFetch('/api/matches?status=upcoming&limit=4'),
  });

  const { data: stats } = useQuery<GlobalStats>({
    queryKey: ['/api/stats/global'],
    queryFn: () => apiFetch('/api/stats/global'),
  });

  const { data: nations } = useQuery<Nation[]>({
    queryKey: ['/api/nations'],
    queryFn: () => apiFetch('/api/nations'),
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard', 5],
    queryFn: () => apiFetch('/api/leaderboard?limit=5'),
  });

  const { data: discussions } = useQuery<Discussion[]>({
    queryKey: ['/api/discussions', 3],
    queryFn: () => apiFetch('/api/discussions?limit=3'),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLive(), refetchUpcoming()]);
    setRefreshing(false);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 34 : 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.logo, { color: colors.primary }]}>FANVERSE</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>United by Passion</Text>
        </View>
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); router.push('/discussions'); }}
          style={[styles.iconBtn, { backgroundColor: colors.muted }]}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Global Stats Banner */}
      {stats && (
        <View style={[styles.statsBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <StatPill label="Fans" value={(stats.totalFans ?? 0).toLocaleString()} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatPill label="Nations" value={(stats.totalNationsActive ?? 0).toString()} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatPill label="Matches" value={(stats.totalMatchesCovered ?? 0).toString()} colors={colors} />
        </View>
      )}

      {/* Live Matches */}
      {(liveMatches?.length ?? 0) > 0 && (
        <Section title="LIVE NOW" icon="radio-outline" iconColor={colors.live} colors={colors}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {liveMatches!.map((m) => (
              <View key={m.id} style={styles.hCard}>
                <MatchCard match={m} compact />
              </View>
            ))}
          </ScrollView>
        </Section>
      )}

      {/* Upcoming Matches */}
      <Section
        title="UPCOMING"
        icon="calendar-outline"
        colors={colors}
        action={{ label: 'All', onPress: () => router.push('/matches') }}
      >
        <View style={styles.list}>
          {(upcomingMatches ?? []).slice(0, 3).map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
          {(upcomingMatches?.length ?? 0) === 0 && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No upcoming matches</Text>
          )}
        </View>
      </Section>

      {/* Top Nations */}
      {(nations?.length ?? 0) > 0 && (
        <Section
          title="NATIONS"
          icon="flag-outline"
          colors={colors}
          action={{ label: 'All', onPress: () => router.push('/nations') }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {(nations ?? []).slice(0, 8).map((n) => (
              <TouchableOpacity
                key={n.code}
                onPress={() => { Haptics.selectionAsync(); router.push(`/nation/${n.code}`); }}
                style={[styles.nationPill, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <Text style={styles.nationFlag}>{n.flagEmoji}</Text>
                <Text style={[styles.nationName, { color: colors.foreground }]}>{n.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Section>
      )}

      {/* Leaderboard Preview */}
      {(leaderboard?.length ?? 0) > 0 && (
        <Section
          title="TOP FANS"
          icon="trophy-outline"
          colors={colors}
          action={{ label: 'Full', onPress: () => router.push('/leaderboard') }}
        >
          <View style={[styles.leaderCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {(leaderboard ?? []).slice(0, 3).map((e, i) => (
              <View key={e.user.id} style={[styles.leaderRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={[styles.rank, { color: i === 0 ? colors.primary : colors.mutedForeground }]}>
                  #{e.rank}
                </Text>
                <Text style={[styles.leaderName, { color: colors.foreground }]} numberOfLines={1}>
                  {e.user.username}
                </Text>
                <ReputationBadge points={e.user.reputationPoints} size="sm" />
                <Text style={[styles.leaderPts, { color: colors.primary }]}>
                  {e.user.reputationPoints.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Recent Discussions */}
      {(discussions?.length ?? 0) > 0 && (
        <Section
          title="DISCUSSIONS"
          icon="chatbubbles-outline"
          colors={colors}
          action={{ label: 'All', onPress: () => router.push('/discussions') }}
        >
          <View style={styles.list}>
            {(discussions ?? []).slice(0, 2).map((d) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => { Haptics.selectionAsync(); router.push(`/discussion/${d.id}`); }}
                style={[styles.discussCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={styles.discussMeta}>
                  <Text style={[styles.discussCategory, { color: colors.primary }]}>
                    {(d.category ?? '').toUpperCase()}
                  </Text>
                  <Text style={[styles.discussDate, { color: colors.mutedForeground }]}>
                    {new Date(d.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.discussTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {d.title}
                </Text>
                <View style={styles.discussFooter}>
                  <Ionicons name="arrow-up" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.discussStat, { color: colors.mutedForeground }]}>{d.upvotes}</Text>
                  <Ionicons name="chatbubble-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.discussStat, { color: colors.mutedForeground }]}>{d.commentCount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

function Section({
  title, icon, iconColor, colors, action, children,
}: {
  title: string;
  icon: string;
  iconColor?: string;
  colors: any;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <Ionicons name={icon as any} size={14} color={iconColor ?? colors.mutedForeground} />
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{title}</Text>
        </View>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={[styles.sectionAction, { color: colors.primary }]}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

function StatPill({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBanner: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingVertical: 14,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    marginVertical: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  list: { gap: 10 },
  hScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  hCard: { width: 260, marginRight: 12 },
  nationPill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  nationFlag: { fontSize: 24 },
  nationName: { fontSize: 11, fontWeight: '600' as const },
  leaderCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rank: {
    fontSize: 13,
    fontWeight: '700' as const,
    width: 28,
  },
  leaderName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  leaderPts: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  discussCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  discussMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discussCategory: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  discussDate: { fontSize: 10 },
  discussTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  discussFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discussStat: { fontSize: 12, marginRight: 6 },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});
