import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';

type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';

const tons: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successLight, fg: colors.success },
  danger: { bg: colors.dangerLight, fg: colors.danger },
  warning: { bg: colors.warningLight, fg: colors.warning },
  neutral: { bg: colors.border, fg: colors.textMuted },
  primary: { bg: colors.primaryLight, fg: colors.primaryDark },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tons[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
