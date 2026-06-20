import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TIERS, getTier } from '@/lib/api';
import { useColors } from '@/hooks/useColors';

interface Props {
  points: number;
  showPoints?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_ICONS: Record<string, string> = {
  casual: 'football-outline',
  fan: 'star',
  capo: 'trophy',
  ultras: 'flame',
};

export function ReputationBadge({ points, showPoints = false, size = 'md' }: Props) {
  const colors = useColors();
  const tierKey = getTier(points);
  const tier = TIERS[tierKey];
  const iconName = TIER_ICONS[tierKey] ?? 'star';

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;
  const padding = size === 'sm' ? { paddingHorizontal: 6, paddingVertical: 2 } : { paddingHorizontal: 10, paddingVertical: 4 };

  return (
    <View style={[styles.badge, padding, { backgroundColor: tier.color + '22', borderColor: tier.color + '44' }]}>
      <Ionicons name={iconName as any} size={iconSize} color={tier.color} />
      <Text style={[styles.label, { color: tier.color, fontSize }]}>{tier.label}</Text>
      {showPoints && (
        <Text style={[styles.points, { color: tier.color, fontSize }]}>{points.toLocaleString()} XP</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  points: {
    fontWeight: '500' as const,
  },
});
