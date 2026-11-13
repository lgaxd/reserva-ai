import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type TextInputInstance } from 'react-native';

import { AuthHeader } from '@/components/AuthHeader';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { entrar } from '@/services/authService';
import { colors, spacing } from '@/theme/colors';
import { mensagemDeErro } from '@/utils/errors';
import { temErros, validarLogin, type Erros } from '@/utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<Erros<'email' | 'senha'>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const senhaRef = useRef<TextInputInstance>(null);

  async function onEntrar() {
    const v = validarLogin(email, senha);
    setErros(v);
    setErroGeral(undefined);
    if (temErros(v)) return;
    setEnviando(true);
    try {
      await entrar(email, senha);
      // O redirecionamento acontece sozinho: o AuthContext percebe o login.
    } catch (e) {
      setErroGeral(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <AuthHeader subtitle="Reserve as áreas comuns do seu condomínio" />

      <Input
        label="E-mail"
        placeholder="voce@email.com"
        value={email}
        onChangeText={setEmail}
        error={erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => senhaRef.current?.focus()}
      />
      <Input
        ref={senhaRef}
        label="Senha"
        placeholder="Sua senha"
        value={senha}
        onChangeText={setSenha}
        error={erros.senha}
        secureTextEntry
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={onEntrar}
      />

      {erroGeral ? <Text style={styles.erro}>{erroGeral}</Text> : null}

      <Button title="Entrar" onPress={onEntrar} loading={enviando} />

      <View style={styles.links}>
        <Link href="/esqueci-senha" style={styles.link}>
          Esqueci minha senha
        </Link>
        <Text style={styles.muted}>
          Novo por aqui?{' '}
          <Link href="/cadastro" style={styles.link}>
            Criar conta
          </Link>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  erro: { color: colors.danger, textAlign: 'center', fontSize: 14 },
  links: { alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  link: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  muted: { color: colors.textMuted, fontSize: 15 },
});
