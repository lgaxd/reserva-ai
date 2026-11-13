import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { usePerfil } from '@/contexts/AuthContext';
import { sair } from '@/services/authService';
import { cancelarTodosLembretes } from '@/services/notificationService';
import { colors, radius, spacing } from '@/theme/colors';
import { mensagemDeErro } from '@/utils/errors';

import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Screen } from './Screen';

/** Tela de perfil compartilhada entre morador e síndico. */
export function ProfileView({ children }: { children?: ReactNode }) {
  const perfil = usePerfil();
  const [saindo, setSaindo] = useState(false);

  function confirmarSaida() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setSaindo(true);
          try {
            await cancelarTodosLembretes().catch(() => undefined);
            await sair();
          } catch (e) {
            setSaindo(false);
            Alert.alert('Erro', mensagemDeErro(e));
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <Card style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.inicial}>{perfil.nome.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.nome}>{perfil.nome}</Text>
        <Badge
          label={perfil.role === 'sindico' ? 'Síndico' : 'Morador'}
          tone={perfil.role === 'sindico' ? 'warning' : 'primary'}
        />
      </Card>

      <Card>
        <Linha icon="mail-outline" label="E-mail" valor={perfil.email} />
        {perfil.role === 'morador' && (
          <Linha icon="home-outline" label="Unidade" valor={`Bloco ${perfil.bloco}, apto ${perfil.apto}`} />
        )}
      </Card>

      {children}

      <Button title="Sair da conta" variant="danger" icon="log-out-outline" onPress={confirmarSaida} loading={saindo} />
    </Screen>
  );
}

function Linha({
  icon,
  label,
  valor,
}: {
  icon: 'mail-outline' | 'home-outline';
  label: string;
  valor: string;
}) {
  return (
    <View style={styles.linha}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valor}>{valor}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: { fontSize: 30, fontWeight: '800', color: colors.primaryDark },
  nome: { fontSize: 20, fontWeight: '700', color: colors.text },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  label: { fontSize: 12, color: colors.textMuted },
  valor: { fontSize: 15, color: colors.text },
});
