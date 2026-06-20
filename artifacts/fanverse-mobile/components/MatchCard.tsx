import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Match } from '@/lib/api';
import { formatKickoff } from '@/lib/api';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Props {
  match: Match;
  compact?: boolean;
}

export function MatchCard({ match, compact }: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push(`/match/${match.id}`);
  };

  const statusColor =
    match.status === 'live'
      ? colors.live
      : match.status === 'completed'
      ? colors.mutedForeground
      : colors.primary;

  const statusLabel =
    match.status === 'live'
      ? 'LIVE'
      : match.status === 'completed'
      ? 'FT'
      : formatKickoff(match.scheduledAt);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={styles.header}>
        <Text style={[styles.competition, { color: colors.mutedForeground }]}>
          {match.competition}{match.stage ? ` · ${match.stage}` : ''}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: match.status === 'live' ? colors.live + '22' : colors.muted }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.team}>
          <Text style={styles.flag}>{match.homeNationFlag}</Text>
          <Text style={[styles.teamName, { color: colors.foreground }]} numberOfLines={1}>
            {match.homeNationName}
          </Text>
        </View>

        <View style={styles.scoreBox}>
          {match.status !== 'upcoming' ? (
            <Text style={[styles.score, { color: colors.foreground }]}>
              {match.homeScore ?? 0} – {match.awayScore ?? 0}
            </Text>
          ) : (
            <Text style={[styles.vs, { color: colors.mutedForeground }]}>VS</Text>
          )}
        </View>

        <View style={[styles.team, styles.teamRight]}>
          <Text style={styles.flag}>{match.awayNationFlag}</Text>
          <Text style={[styles.teamName, { color: colors.foreground }]} numberOfLines={1}>
            {match.awayNationName}
          </Text>
        </View>
      </View>

      {!compact && match.status === 'upcoming' && (
        <Text style={[styles.kickoff, { color: colors.mutedForeground }]}>
          {formatKickoff(match.scheduledAt)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competition: {
    fontSize: 11,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  teamRight: {
    alignItems: 'center',
  },
  flag: {
    fontSize: 28,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  scoreBox: {
    minWidth: 64,
    alignItems: 'center',
  },
  score: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  vs: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  kickoff: {
    fontSize: 11,
    textAlign: 'center',
  },
});
