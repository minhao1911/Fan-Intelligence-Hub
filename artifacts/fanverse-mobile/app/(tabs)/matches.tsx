import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import type { Match } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { LoadingState, ErrorState, EmptyState } from '@/components/LoadingState';

type Filter = 'all' | 'live' | 'upcoming' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

export default function MatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const url = filter === 'all' ? '/api/matches' : `/api/matches?status=${filter}`;

  const { data, isLoading, error, refetch } = useQuery<Match[]>({
    queryKey: ['/api/matches', filter],
    queryFn: () => apiFetch(url),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Matches</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterBtn,
              filter === f.key
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.muted },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingState message="Loading matches..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState message="No matches found" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(m) => m.id.toString()}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          scrollEnabled={!!(data && data.length > 0)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'web' ? 34 : 16,
  },
});
