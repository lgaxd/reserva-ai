import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { recuperarSenha } from '@/services/authService';
import { colors } from '@/theme/colors';
import { mensagemDeErro } from '@/utils/errors';
import { validarEmail } from '@/utils/validation';

export default function EsqueciSenhaScreen() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onEnviar() {
    const e = validarEmail(email);
    setErro(e);
    if (e) return;
    setEnviando(true);
    try {
      await recuperarSenha(email);
      setEnviado(true);
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Screen>
        <Card>
          <Text style={styles.titulo}>Verifique seu e-mail</Text>
          <Text style={styles.texto}>
            Se existir uma conta para {email.trim()}, você receberá um link para criar uma nova senha.
            Confira também a caixa de spam.
          </Text>
        </Card>
        <Button title="Voltar para o login" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.texto}>Informe o e-mail da sua conta para receber o link de redefinição de senha.</Text>
      <Input
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        error={erro}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        onSubmitEditing={onEnviar}
      />
      <Button title="Enviar link" onPress={onEnviar} loading={enviando} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 18, fontWeight: '700', color: colors.text },
  texto: { fontSize: 15, color: colors.textMuted },
});
