import type { Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';

interface Props extends Omit<TextInputProps, 'ref'> {
  label: string;
  error?: string;
  ref?: Ref<TextInputInstance>;
  /** Ocupa a largura disponível; use quando houver campos lado a lado numa linha. */
  flex?: boolean;
}

// No React 19, `ref` é uma prop comum: não precisamos mais de forwardRef.
export function Input({ label, error, style, ref, flex = false, ...rest }: Props) {
  return (
    <View style={[styles.wrapper, flex && styles.flex]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  flex: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
});
