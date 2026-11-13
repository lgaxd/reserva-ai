import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';

export function AuthHeader({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.logo}>
        <Ionicons name="calendar" size={36} color={colors.white} />
      </View>
      <Text style={styles.title}>ReservaAí</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.lg },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
});
