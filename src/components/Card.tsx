import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, accessibilityLabel }: Props) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
});
