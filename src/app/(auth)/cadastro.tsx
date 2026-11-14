import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { cadastrar } from '@/services/authService';
import { colors, spacing } from '@/theme/colors';
import { mensagemDeErro } from '@/utils/errors';
import { temErros, validarCadastro, type CadastroInput, type Erros } from '@/utils/validation';

const vazio: CadastroInput = { nome: '', email: '', senha: '', confirmarSenha: '', bloco: '', apto: '' };

export default function CadastroScreen() {
  const [form, setForm] = useState<CadastroInput>(vazio);
  const [erros, setErros] = useState<Erros<keyof CadastroInput>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const { setCadastrando } = useAuth();

  const campo = (nome: keyof CadastroInput) => (valor: string) =>
    setForm((f) => ({ ...f, [nome]: valor }));

  async function onCadastrar() {
    const v = validarCadastro(form);
    setErros(v);
    setErroGeral(undefined);
    if (temErros(v)) return;
    setEnviando(true);
    // Segura o redirecionamento até a conta E o perfil estarem gravados.
    setCadastrando(true);
    try {
      await cadastrar(form);
      // Sucesso: ao liberar a flag, o layout redireciona para a área do morador.
    } catch (e) {
      setErroGeral(mensagemDeErro(e));
      setEnviando(false);
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.intro}>
        Cadastre-se como morador. O acesso de síndico é liberado pela administração do condomínio.
      </Text>

      <Input label="Nome completo" value={form.nome} onChangeText={campo('nome')} error={erros.nome} autoComplete="name" maxLength={80} />
      <Input
        label="E-mail"
        value={form.email}
        onChangeText={campo('email')}
        error={erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <View style={styles.row}>
        <Input flex label="Bloco" value={form.bloco} onChangeText={campo('bloco')} error={erros.bloco} autoCapitalize="characters" maxLength={10} />
        <Input flex label="Apartamento" value={form.apto} onChangeText={campo('apto')} error={erros.apto} autoCapitalize="characters" maxLength={10} />
      </View>
      <Input
        label="Senha"
        value={form.senha}
        onChangeText={campo('senha')}
        error={erros.senha}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Mínimo 6 caracteres"
      />
      <Input
        label="Confirmar senha"
        value={form.confirmarSenha}
        onChangeText={campo('confirmarSenha')}
        error={erros.confirmarSenha}
        secureTextEntry
        autoComplete="new-password"
      />

      {erroGeral ? <Text style={styles.erro}>{erroGeral}</Text> : null}

      <Button title="Criar conta" onPress={onCadastrar} loading={enviando} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', gap: spacing.md },
  erro: { color: colors.danger, textAlign: 'center', fontSize: 14 },
});
