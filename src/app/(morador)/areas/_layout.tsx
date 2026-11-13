import { Stack } from 'expo-router';

import { colors } from '@/theme/colors';

export default function AreasStack() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerStyle: { backgroundColor: colors.surface },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Áreas comuns' }} />
      <Stack.Screen name="[id]" options={{ title: 'Reservar' }} />
    </Stack>
  );
}
