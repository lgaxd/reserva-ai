import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { firebaseConfigurado } from '@/config/firebase';
import { queryClient } from '@/config/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { configurarNotificacoes } from '@/services/notificationService';
import { colors, spacing } from '@/theme/colors';

export default function RootLayout() {
  useEffect(() => {
    configurarNotificacoes().catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          {firebaseConfigurado ? (
            <Stack screenOptions={{ headerShown: false }} />
          ) : (
            <ConfiguracaoAusente />
          )}
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function ConfiguracaoAusente() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Firebase não configurado</Text>
      <Text style={styles.text}>
        Copie o arquivo .env.example para .env, preencha com os dados do seu projeto Firebase e
        reinicie o Expo (npx expo start -c).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
});
