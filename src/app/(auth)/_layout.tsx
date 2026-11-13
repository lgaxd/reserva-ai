import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';

/** Área pública. Quem já está logado é mandado para o ponto de entrada. */
export default function AuthLayout() {
  const { user } = useAuth();
  if (user) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      <Stack.Screen name="esqueci-senha" options={{ title: 'Recuperar senha' }} />
    </Stack>
  );
}
