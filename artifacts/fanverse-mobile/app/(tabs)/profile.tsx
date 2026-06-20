import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch, TIERS, getTier } from '@/lib/api';
import type { User, Prediction } from '@/lib/api';
import { ReputationBadge } from '@/components/ReputationBadge';
import { LoadingState } from '@/components/LoadingState';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const { data: me, isLoading } = useQuery<User>({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch('/api/me', token);
    },
    enabled: !!isSignedIn,
  });

  const { data: predictions } = useQuery<Prediction[]>({
    queryKey: ['/api/me/predictions', 'profile'],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch('/api/me/predictions', token);
    },
    enabled: !!isSignedIn,
  });

  const handleSignOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (Platform.OS === 'web') {
      signOut();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground, paddingHorizontal: 16 }]}>Profile</Text>
        <View style={styles.authPrompt}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
            <Ionicons name="person" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>Join FanVerse</Text>
          <Text style={[styles.authSub, { color: colors.mutedForeground }]}>
            Sign in to track your reputation, predictions and nation allegiance
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/sign-in')}
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.signInText, { color: colors.primaryForeground }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) return <LoadingState message="Loading profile..." />;

  const correctPredictions = (predictions ?? []).filter((p) => p.isCorrect === true).length;
  const totalPredictions = (predictions ?? []).filter((p) => p.isCorrect !== null).length;
  const accuracy = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
  const points = me?.reputationPoints ?? 0;
  const tierKey = getTier(points);
  const tier = TIERS[tierKey];
  const nextTierKey = tierKey === 'casual' ? 'fan' : tierKey === 'fan' ? 'capo' : tierKey === 'capo' ? 'ultras' : null;
  const nextTier = nextTierKey ? TIERS[nextTierKey] : null;
  const progress = nextTier
    ? Math.min(((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100, 100)
    : 100;

  const initials = (me?.username ?? user?.firstName ?? '?').slice(0, 2).toUpperCase();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground, paddingHorizontal: 16, marginBottom: 20 }]}>Profile</Text>

      {/* User Card */}
      <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '22' }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.foreground }]}>{me?.username ?? 'Fan'}</Text>
          {me?.nationCode && (
            <Text style={[styles.nation, { color: colors.mutedForeground }]}>
              {me.nationCode} Supporter
            </Text>
          )}
          <ReputationBadge points={points} showPoints size="md" />
        </View>
      </View>

      {/* XP Progress */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reputation Progress</Text>
          {nextTier && (
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              {nextTier.minPoints - points} XP to {nextTier.label}
            </Text>
          )}
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: tier.color }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: tier.color }]}>{tier.label}</Text>
          {nextTier && <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{nextTier.label}</Text>}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stats</Text>
        <View style={styles.statsGrid}>
          <StatBox label="Total XP" value={points.toLocaleString()} color={colors.primary} colors={colors} />
          <StatBox label="Predictions" value={(predictions?.length ?? 0).toString()} color={colors.accent} colors={colors} />
          <StatBox label="Correct" value={correctPredictions.toString()} color={colors.success} colors={colors} />
          <StatBox label="Accuracy" value={`${accuracy}%`} color={colors.success} colors={colors} />
        </View>
      </View>

      {/* Quick Links */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore</Text>
        <LinkRow icon="trophy-outline" label="Leaderboard" onPress={() => router.push('/leaderboard')} colors={colors} />
        <LinkRow icon="chatbubbles-outline" label="Discussions" onPress={() => router.push('/discussions')} colors={colors} />
        <LinkRow icon="flag-outline" label="Nations" onPress={() => router.push('/nations')} colors={colors} />
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        onPress={handleSignOut}
        style={[styles.signOutBtn, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.muted }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress, colors }: { icon: string; label: string; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.linkRow}>
      <Ionicons name={icon as any} size={18} color={colors.mutedForeground} />
      <Text style={[styles.linkLabel, { color: colors.foreground }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  authTitle: { fontSize: 18, fontWeight: '700' as const, textAlign: 'center' },
  authSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  signInBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  signInText: { fontSize: 16, fontWeight: '700' as const },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontSize: 28, fontWeight: '700' as const },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userInfo: { flex: 1, gap: 6 },
  username: { fontSize: 20, fontWeight: '700' as const },
  nation: { fontSize: 13 },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const },
  sectionSub: { fontSize: 12 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' as const },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, fontWeight: '600' as const },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  statBox: { width: '47%', borderRadius: 10, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700' as const },
  statLabel: { fontSize: 11, fontWeight: '500' as const },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  linkLabel: { flex: 1, fontSize: 15 },
  signOutBtn: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: { fontSize: 15, fontWeight: '600' as const },
});
