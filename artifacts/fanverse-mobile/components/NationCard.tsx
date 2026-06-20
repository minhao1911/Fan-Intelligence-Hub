import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Nation } from '@/lib/api';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  nation: Nation;
  compact?: boolean;
}

export function NationCard({ nation, compact }: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push(`/nation/${nation.code}`);
  };

  const confidence = Math.round(nation.confidenceScore ?? 0);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <Text style={styles.flag}>{nation.flagEmoji}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {nation.name}
        </Text>
        <Text style={[styles.conf, { color: colors.mutedForeground }]}>{nation.confederation}</Text>
        {!compact && (
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="people" size={12} color={colors.mutedForeground} />
              <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                {(nation.memberCount ?? 0).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.confBar, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.confFill,
                  { width: `${Math.min(confidence, 100)}%` as any, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>
        )}
      </View>
      {nation.isUserMember && (
        <View style={[styles.joinedBadge, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name="checkmark" size={12} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  conf: {
    fontSize: 11,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
  },
  confBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  confFill: {
    height: '100%',
    borderRadius: 2,
  },
  joinedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
