import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import type { Discussion, Comment } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/LoadingState';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function DiscussionDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const discussionId = parseInt(id ?? '0', 10);
  const { getToken, isSignedIn } = useAuth();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: discussion, isLoading, error, refetch } = useQuery<Discussion>({
    queryKey: ['/api/discussions', discussionId],
    queryFn: () => apiFetch(`/api/discussions/${discussionId}`),
  });

  const { data: comments, refetch: refetchComments } = useQuery<any[]>({
    queryKey: ['/api/discussions', discussionId, 'comments'],
    queryFn: () => apiFetch(`/api/discussions/${discussionId}/comments`),
  });

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch(`/api/discussions/${discussionId}/upvote`, token, { method: 'POST' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/discussions', discussionId] });
      Haptics.selectionAsync();
    },
  });

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await apiFetch(`/api/discussions/${discussionId}/comments`, token, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim() }),
      });
      setCommentText('');
      refetchComments();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading discussion..." />;
  if (error || !discussion) return <ErrorState message={(error as Error)?.message ?? 'Not found'} onRetry={refetch} />;

  const ListHeader = (
    <View>
      {/* Nav */}
      <View style={[styles.navBar, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>

      {/* Discussion Post */}
      <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.postMeta}>
          <View style={[styles.catBadge, { backgroundColor: colors.primary + '22' }]}>
            <Text style={[styles.catText, { color: colors.primary }]}>{discussion.category}</Text>
          </View>
          <Text style={[styles.postDate, { color: colors.mutedForeground }]}>
            {new Date(discussion.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={[styles.postTitle, { color: colors.foreground }]}>{discussion.title}</Text>
        <Text style={[styles.postContent, { color: colors.foreground }]}>{discussion.content}</Text>

        <View style={styles.postFooter}>
          <Text style={[styles.postAuthor, { color: colors.mutedForeground }]}>@{discussion.username}</Text>
          <TouchableOpacity
            onPress={() => {
              if (!isSignedIn) { router.push('/sign-in'); return; }
              upvoteMutation.mutate();
            }}
            style={[
              styles.upvoteBtn,
              { backgroundColor: discussion.hasUserUpvoted ? colors.primary + '22' : colors.muted },
            ]}
          >
            <Ionicons
              name={discussion.hasUserUpvoted ? 'arrow-up' : 'arrow-up-outline'}
              size={16}
              color={discussion.hasUserUpvoted ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.upvoteCount, { color: discussion.hasUserUpvoted ? colors.primary : colors.mutedForeground }]}>
              {discussion.upvotes}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Header */}
      <View style={styles.commentsHeader}>
        <Ionicons name="chatbubbles-outline" size={15} color={colors.mutedForeground} />
        <Text style={[styles.commentsTitle, { color: colors.foreground }]}>
          {(comments?.length ?? 0)} Comments
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={comments ?? []}
        keyExtractor={(c) => c.id.toString()}
        ListHeaderComponent={ListHeader}
        renderItem={({ item: c }) => (
          <View style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.commentHeader}>
              <Text style={[styles.commentAuthor, { color: colors.primary }]}>@{c.username ?? c.authorUsername ?? 'Anonymous'}</Text>
              <Text style={[styles.commentDate, { color: colors.mutedForeground }]}>
                {new Date(c.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.commentContent, { color: colors.foreground }]}>{c.content}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Comment Input */}
      {isSignedIn ? (
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomInset + 8 }]}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.commentInput, { backgroundColor: colors.muted, color: colors.foreground }]}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={submitComment}
            disabled={!commentText.trim() || submitting}
            style={[styles.sendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.muted }]}
          >
            <Ionicons name="send" size={16} color={commentText.trim() ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/sign-in')}
          style={[styles.signInBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomInset + 8 }]}
        >
          <Text style={[styles.signInBarText, { color: colors.mutedForeground }]}>Sign in to comment</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  catText: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.3 },
  postDate: { fontSize: 11 },
  postTitle: { fontSize: 18, fontWeight: '700' as const, lineHeight: 26 },
  postContent: { fontSize: 15, lineHeight: 22 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postAuthor: { fontSize: 13 },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upvoteCount: { fontSize: 14, fontWeight: '700' as const },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  commentsTitle: { fontSize: 14, fontWeight: '700' as const },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  commentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentAuthor: { fontSize: 13, fontWeight: '600' as const },
  commentDate: { fontSize: 11 },
  commentContent: { fontSize: 14, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  signInBarText: { fontSize: 14 },
});
