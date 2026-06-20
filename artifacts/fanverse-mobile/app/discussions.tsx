import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, RefreshControl, TextInput, Modal, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import type { Discussion } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/LoadingState';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const CATEGORIES = ['All', 'General', 'Match Talk', 'Tactics', 'Nation'];

export default function DiscussionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getToken, isSignedIn } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, error, refetch } = useQuery<Discussion[]>({
    queryKey: ['/api/discussions', category],
    queryFn: () =>
      apiFetch(`/api/discussions${category !== 'All' ? `?category=${encodeURIComponent(category)}` : ''}`),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const upvoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken();
      return apiFetch(`/api/discussions/${id}/upvote`, token, { method: 'POST' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/discussions'] }),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Discussions</Text>
        {isSignedIn ? (
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setShowCreate(true); }}
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Category Filter */}
      <View style={{ marginBottom: 12 }}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              onPress={() => setCategory(c)}
              style={[
                styles.catChip,
                category === c ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted },
              ]}
            >
              <Text style={[styles.catText, { color: category === c ? colors.primaryForeground : colors.mutedForeground }]}>
                {c}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <LoadingState message="Loading discussions..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(d) => d.id.toString()}
          renderItem={({ item: d }) => (
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); router.push(`/discussion/${d.id}`); }}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.catBadge, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={[styles.catBadgeText, { color: colors.primary }]}>{d.category}</Text>
                </View>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>
                  {new Date(d.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{d.title}</Text>
              <Text style={[styles.cardContent, { color: colors.mutedForeground }]} numberOfLines={2}>{d.content}</Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.author, { color: colors.mutedForeground }]}>@{d.username}</Text>
                <View style={styles.footerRight}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation?.();
                      if (!isSignedIn) { router.push('/sign-in'); return; }
                      Haptics.selectionAsync();
                      upvoteMutation.mutate(d.id);
                    }}
                    style={[styles.upvoteBtn, d.hasUserUpvoted && { backgroundColor: colors.primary + '22' }]}
                  >
                    <Ionicons name="arrow-up" size={14} color={d.hasUserUpvoted ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.voteCount, { color: d.hasUserUpvoted ? colors.primary : colors.mutedForeground }]}>
                      {d.upvotes}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.commentCount}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.voteCount, { color: colors.mutedForeground }]}>{d.commentCount}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {showCreate && (
        <CreateModal
          colors={colors}
          insets={insets}
          getToken={getToken}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['/api/discussions'] });
          }}
        />
      )}
    </View>
  );
}

function CreateModal({ colors, insets, getToken, onClose, onSuccess }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) throw new Error('Title and content required');
      const token = await getToken();
      return apiFetch('/api/discussions', token, {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), content: content.trim(), category }),
      });
    },
    onSuccess,
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.modal, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Discussion</Text>
          <TouchableOpacity
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={[styles.postBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.postBtnText, { color: colors.primaryForeground }]}>
              {mutation.isPending ? '...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.catRow}>
            {['General', 'Match Talk', 'Tactics', 'Nation'].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.catChip,
                  category === c ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted },
                ]}
              >
                <Text style={[styles.catText, { color: category === c ? colors.primaryForeground : colors.mutedForeground }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Discussion title..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Content</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Share your thoughts..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={[styles.textarea, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          />

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  catText: { fontSize: 12, fontWeight: '600' as const },
  list: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'web' ? 34 : 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.3 },
  date: { fontSize: 11 },
  cardTitle: { fontSize: 15, fontWeight: '700' as const, lineHeight: 22 },
  cardContent: { fontSize: 13, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 12 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  commentCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  voteCount: { fontSize: 13, fontWeight: '600' as const },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { fontSize: 17, fontWeight: '700' as const },
  postBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  postBtnText: { fontSize: 14, fontWeight: '700' as const },
  modalBody: { padding: 16, gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3 },
  catRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' as const },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 120,
  },
  error: { fontSize: 13, textAlign: 'center' },
});
