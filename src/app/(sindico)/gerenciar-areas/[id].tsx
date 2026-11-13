import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { useArea, useSalvarArea } from '@/hooks/queries';
import { novoTurnoId } from '@/services/areaService';
import { colors, spacing } from '@/theme/colors';
import type { Turno } from '@/types';
import { mensagemDeErro } from '@/utils/errors';
import { temErros, validarArea, type AreaFormInput, type Erros } from '@/utils/validation';

const TURNOS_PADRAO: Omit<Turno, 'id'>[] = [
  { nome: 'Manhã', inicio: '08:00', fim: '12:00' },
  { nome: 'Tarde', inicio: '13:00', fim: '17:00' },
  { nome: 'Noite', inicio: '18:00', fim: '22:00' },
];

interface Form extends AreaFormInput {
  ativa: boolean;
}

export default function AreaFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nova = id === 'nova';
  const area = useArea(nova ? undefined : id);
  const salvar = useSalvarArea();

  const [form, setForm] = useState<Form | null>(
    nova
      ? {
          nome: '',
          descricao: '',
          capacidade: '20',
          ativa: true,
          turnos: TURNOS_PADRAO.map((t) => ({ ...t, id: novoTurnoId() })),
        }
      : null,
  );
  const [erros, setErros] = useState<Erros<'nome' | 'descricao' | 'capacidade' | 'turnos'>>({});

  // Ao editar, preenche o formulário quando a área chega do Firestore.
  useEffect(() => {
    if (!nova && area.data && !form) {
      const a = area.data;
      setForm({
        nome: a.nome,
        descricao: a.descricao,
        capacidade: String(a.capacidade),
        ativa: a.ativa,
        turnos: a.turnos,
      });
    }
  }, [nova, area.data, form]);

  if (!nova && area.isLoading) return <LoadingView />;
  if (!nova && area.isError) return <ErrorView error={area.error} onRetry={area.refetch} />;
  if (!form) return <LoadingView />;

  const set = <K extends keyof Form>(campo: K, valor: Form[K]) =>
    setForm((f) => (f ? { ...f, [campo]: valor } : f));

  const setTurno = (turnoId: string, campo: keyof Omit<Turno, 'id'>, valor: string) =>
    set(
      'turnos',
      form.turnos.map((t) => (t.id === turnoId ? { ...t, [campo]: valor } : t)),
    );

  async function onSalvar() {
    if (!form) return;
    const v = validarArea(form);
    setErros(v);
    if (temErros(v)) return;
    try {
      await salvar.mutateAsync({
        id: nova ? undefined : id,
        input: {
          nome: form.nome,
          descricao: form.descricao,
          capacidade: Number(form.capacidade),
          ativa: form.ativa,
          turnos: form.turnos,
        },
      });
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', mensagemDeErro(e));
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: nova ? 'Nova área' : 'Editar área' }} />

      <Input label="Nome" value={form.nome} onChangeText={(v) => set('nome', v)} error={erros.nome} maxLength={60} placeholder="Ex.: Salão de Festas" />
      <Input
        label="Descrição"
        value={form.descricao}
        onChangeText={(v) => set('descricao', v)}
        error={erros.descricao}
        multiline
        maxLength={300}
        placeholder="Regras de uso, itens disponíveis..."
      />
      <Input
        label="Capacidade (pessoas)"
        value={form.capacidade}
        onChangeText={(v) => set('capacidade', v.replace(/\D/g, ''))}
        error={erros.capacidade}
        keyboardType="number-pad"
        maxLength={4}
      />
      <View style={styles.switch}>
        <Switch
          value={form.ativa}
          onValueChange={(v) => set('ativa', v)}
          trackColor={{ true: colors.primary, false: colors.disabled }}
        />
        <Text style={styles.switchLabel}>{form.ativa ? 'Aceitando reservas' : 'Desativada'}</Text>
      </View>

      <Text style={styles.secao}>Turnos</Text>
      <Text style={styles.ajuda}>
        Horários no formato HH:mm, sem sobreposição. Reservas já feitas mantêm o horário original.
      </Text>
      {erros.turnos ? <Text style={styles.erro}>{erros.turnos}</Text> : null}

      {form.turnos.map((t) => (
        <Card key={t.id}>
          <View style={styles.turnoHeader}>
            <View style={styles.flex}>
              <Input label="Nome do turno" value={t.nome} onChangeText={(v) => setTurno(t.id, 'nome', v)} maxLength={30} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover turno ${t.nome}`}
              onPress={() => set('turnos', form.turnos.filter((x) => x.id !== t.id))}
              style={styles.remover}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          </View>
          <View style={styles.row}>
            <Input label="Início" value={t.inicio} onChangeText={(v) => setTurno(t.id, 'inicio', v)} placeholder="08:00" maxLength={5} keyboardType="numbers-and-punctuation" />
            <Input label="Fim" value={t.fim} onChangeText={(v) => setTurno(t.id, 'fim', v)} placeholder="12:00" maxLength={5} keyboardType="numbers-and-punctuation" />
          </View>
        </Card>
      ))}

      {form.turnos.length < 6 && (
        <Button
          title="Adicionar turno"
          variant="secondary"
          icon="add"
          onPress={() =>
            set('turnos', [...form.turnos, { id: novoTurnoId(), nome: '', inicio: '', fim: '' }])
          }
        />
      )}

      <Button title="Salvar área" icon="checkmark-circle-outline" onPress={onSalvar} loading={salvar.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switch: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  switchLabel: { fontSize: 15, color: colors.text },
  secao: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  ajuda: { fontSize: 13, color: colors.textMuted },
  erro: { fontSize: 14, color: colors.danger },
  turnoHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  flex: { flex: 1 },
  remover: { padding: spacing.sm, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
});
