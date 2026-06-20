import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import type { Nation } from '@/lib/api';
import { NationCard } from '@/components/NationCard';
import { LoadingState, ErrorState } from '@/components/LoadingState';
import { Ionicons } from '@expo/vector-icons';

const CONFEDS = ['All', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

export default function NationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [confed, setConfed] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<Nation[]>({
    queryKey: ['/api/nations'],
    queryFn: () => apiFetch('/api/nations'),
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (confed !== 'All') list = list.filter((n) => n.confederation === confed);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q));
    }
    return list;
  }, [data, confed, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Nations</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search nations..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Confederation filter */}
      <View style={styles.confedRow}>
        <FlatList
          horizontal
          data={CONFEDS}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              onPress={() => setConfed(c)}
              style={[
                styles.confedBtn,
                confed === c
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.muted },
              ]}
            >
              <Text style={[styles.confedText, { color: confed === c ? colors.primaryForeground : colors.mutedForeground }]}>
                {c}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <LoadingState message="Loading nations..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.code}
          renderItem={({ item }) => <NationCard nation={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          scrollEnabled={!!(filtered.length > 0)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  confedRow: { marginBottom: 16 },
  confedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confedText: { fontSize: 12, fontWeight: '600' as const },
  list: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'web' ? 34 : 16,
  },
});
