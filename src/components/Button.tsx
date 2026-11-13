import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  small?: boolean;
}

const paleta: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary },
  danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  small = false,
}: Props) {
  const p = paleta[variant];
  const inativo = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: loading }}
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: p.bg, borderColor: p.border },
        inativo && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={p.fg} />}
          <Text style={[styles.text, small && styles.textSmall, { color: p.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  small: { minHeight: 36, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { fontSize: 16, fontWeight: '600' },
  textSmall: { fontSize: 14 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
