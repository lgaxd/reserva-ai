import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/colors';
import { mensagemDeErro } from '@/utils/errors';

import { Button } from './Button';

export function LoadingView({ message = 'Carregando...' }: { message?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
      <Text style={styles.title}>Não foi possível carregar</Text>
      <Text style={styles.muted}>{mensagemDeErro(error)}</Text>
      {onRetry && <Button title="Tentar de novo" onPress={onRetry} variant="secondary" small />}
    </View>
  );
}

export function EmptyView({
  title,
  message,
  icon = 'file-tray-outline',
}: {
  title: string;
  message?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={40} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.muted}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    minHeight: 220,
  },
  title: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
  muted: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
