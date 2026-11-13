import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
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

  const campo = (nome: keyof CadastroInput) => (valor: string) =>
    setForm((f) => ({ ...f, [nome]: valor }));

  async function onCadastrar() {
    const v = validarCadastro(form);
    setErros(v);
    setErroGeral(undefined);
    if (temErros(v)) return;
    setEnviando(true);
    try {
      await cadastrar(form);
      // Logado automaticamente: o layout redireciona para a área do morador.
    } catch (e) {
      setErroGeral(mensagemDeErro(e));
      setEnviando(false);
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
        <Input label="Bloco" value={form.bloco} onChangeText={campo('bloco')} error={erros.bloco} autoCapitalize="characters" maxLength={10} />
        <Input label="Apartamento" value={form.apto} onChangeText={campo('apto')} error={erros.apto} autoCapitalize="characters" maxLength={10} />
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
