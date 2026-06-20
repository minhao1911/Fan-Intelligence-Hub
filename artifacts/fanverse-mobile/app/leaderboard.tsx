import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import type { LeaderboardEntry, Nation } from '@/lib/api';
import { ReputationBadge } from '@/components/ReputationBadge';
import { LoadingState, ErrorState } from '@/components/LoadingState';
import { Ionicons } from '@expo/vector-icons';

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedNation, setSelectedNation] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, error, refetch } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard', selectedNation],
    queryFn: () =>
      apiFetch(`/api/leaderboard?limit=50${selectedNation ? `&nationCode=${selectedNation}` : ''}`),
  });

  const { data: nations } = useQuery<Nation[]>({
    queryKey: ['/api/nations'],
    queryFn: () => apiFetch('/api/nations'),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const rankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return colors.mutedForeground;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Leaderboard</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Nation Filter */}
      {(nations?.length ?? 0) > 0 && (
        <View style={{ marginBottom: 12 }}>
          <FlatList
            horizontal
            data={[{ code: null as string | null, name: 'All', flagEmoji: '🌍' }, ...(nations ?? [])]}
            keyExtractor={(n) => n.code ?? 'all'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item: n }) => (
              <TouchableOpacity
                onPress={() => setSelectedNation(n.code)}
                style={[
                  styles.filterChip,
                  selectedNation === n.code ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted },
                ]}
              >
                <Text style={styles.filterFlag}>{n.flagEmoji}</Text>
                <Text style={[styles.filterLabel, { color: selectedNation === n.code ? colors.primaryForeground : colors.foreground }]}>
                  {n.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {isLoading ? (
        <LoadingState message="Loading leaderboard..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(e) => e.user.id.toString()}
          renderItem={({ item: e, index }) => (
            <View style={[
              styles.row,
              { backgroundColor: index < 3 ? colors.card : 'transparent', borderColor: colors.cardBorder },
              index < 3 && { borderWidth: 1 },
            ]}>
              <Text style={[styles.rank, { color: rankColor(e.rank), fontSize: e.rank <= 3 ? 18 : 14 }]}>
                {e.rank <= 3 ? ['🥇', '🥈', '🥉'][e.rank - 1] : `#${e.rank}`}
              </Text>
              <View style={styles.userInfo}>
                <Text style={[styles.username, { color: colors.foreground }]} numberOfLines={1}>
                  {e.user.username}
                </Text>
                {e.user.nationCode && (
                  <Text style={[styles.nation, { color: colors.mutedForeground }]}>{e.user.nationCode}</Text>
                )}
              </View>
              <ReputationBadge points={e.user.reputationPoints} size="sm" />
              <Text style={[styles.pts, { color: colors.primary }]}>{e.user.reputationPoints.toLocaleString()}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' as const },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterFlag: { fontSize: 14 },
  filterLabel: { fontSize: 12, fontWeight: '600' as const },
  list: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'web' ? 34 : 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rank: { width: 32, fontWeight: '700' as const, textAlign: 'center' as const },
  userInfo: { flex: 1, gap: 2 },
  username: { fontSize: 14, fontWeight: '600' as const },
  nation: { fontSize: 11 },
  pts: { fontSize: 13, fontWeight: '700' as const },
});
