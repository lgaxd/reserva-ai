import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LoadingView } from '@/components/StateViews';
import { useAuth } from '@/contexts/AuthContext';
import { sair } from '@/services/authService';
import { colors, spacing } from '@/theme/colors';
import { mensagemDeErro } from '@/utils/errors';

/**
 * Ponto de entrada: decide para onde o usuário vai.
 * deslogado -> login | morador -> áreas | síndico -> agenda
 */
export default function Index() {
  const { user, perfil, carregando, erroPerfil } = useAuth();

  if (carregando) return <LoadingView message="Preparando o app..." />;
  if (!user) return <Redirect href="/login" />;
  if (!perfil) return <PerfilIndisponivel erro={erroPerfil} />;
  return <Redirect href={perfil.role === 'sindico' ? '/agenda' : '/areas'} />;
}

function PerfilIndisponivel({ erro }: { erro: Error | null }) {
  const [saindo, setSaindo] = useState(false);
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Perfil não encontrado</Text>
      <Text style={styles.text}>
        {erro
          ? mensagemDeErro(erro)
          : 'Sua conta existe, mas o perfil em users/{uid} não foi criado. Saia e cadastre-se novamente.'}
      </Text>
      <Button
        title="Sair"
        variant="secondary"
        loading={saindo}
        onPress={() => {
          setSaindo(true);
          sair().finally(() => setSaindo(false));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
});
