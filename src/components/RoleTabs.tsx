import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import type { Role } from '@/types';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface TabConfig {
  name: string;
  title: string;
  icon: IconName;
  /** Esconde o header das abas que têm Stack próprio. */
  headerShown?: boolean;
}

/**
 * Navegação protegida por perfil: só renderiza as abas se o usuário logado
 * tiver o papel esperado. Caso contrário, volta para o ponto de entrada,
 * que decide o destino certo (login ou a área do outro perfil).
 */
export function RoleTabs({ role, tabs }: { role: Role; tabs: TabConfig[] }) {
  const { user, perfil } = useAuth();
  if (!user || perfil?.role !== role) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.surface },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            headerShown: t.headerShown ?? true,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} color={color as string} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
