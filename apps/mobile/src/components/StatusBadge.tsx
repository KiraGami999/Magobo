import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'destructive';

const TONE_COLORS: Record<StatusTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.muted, fg: colors.mutedForeground },
  info: { bg: `${colors.info}1A`, fg: colors.info },
  success: { bg: `${colors.success}1A`, fg: colors.success },
  warning: { bg: `${colors.warning}26`, fg: colors.warningForeground },
  destructive: { bg: `${colors.destructive}1A`, fg: colors.destructive },
};

export interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

/** Cross-platform equivalent of the web `StatusBadge` — same tones, same intent. */
export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const { bg, fg } = TONE_COLORS[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
