import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { useAreas, useDefinirAreaAtiva } from '@/hooks/queries';
import { colors, spacing } from '@/theme/colors';
import type { Area } from '@/types';
import { mensagemDeErro } from '@/utils/errors';

export default function GerenciarAreasScreen() {
  const areas = useAreas();
  const alternar = useDefinirAreaAtiva();
  const [alterandoId, setAlterandoId] = useState<string>();

  async function onAlternar(area: Area, ativa: boolean) {
    setAlterandoId(area.id);
    try {
      await alternar.mutateAsync({ id: area.id, ativa });
    } catch (e) {
      Alert.alert('Erro', mensagemDeErro(e));
    } finally {
      setAlterandoId(undefined);
    }
  }

  return (
    <Screen refreshing={areas.isRefetching} onRefresh={areas.refetch}>
      <Button
        title="Nova área"
        icon="add-circle-outline"
        onPress={() => router.push({ pathname: '/gerenciar-areas/[id]', params: { id: 'nova' } })}
      />

      {areas.isLoading ? (
        <LoadingView />
      ) : areas.isError ? (
        <ErrorView error={areas.error} onRetry={areas.refetch} />
      ) : (areas.data ?? []).length === 0 ? (
        <EmptyView title="Nenhuma área cadastrada" message="Crie a primeira área ou rode o script de seed." />
      ) : (
        areas.data!.map((area) => (
          <Card key={area.id}>
            <View style={styles.header}>
              <Text style={styles.nome}>{area.nome}</Text>
              <Badge label={area.ativa ? 'Ativa' : 'Desativada'} tone={area.ativa ? 'success' : 'neutral'} />
            </View>
            <Text style={styles.turnos}>
              {area.turnos.map((t) => `${t.nome} ${t.inicio}–${t.fim}`).join(' · ')}
            </Text>
            <View style={styles.acoes}>
              <View style={styles.switch}>
                <Switch
                  value={area.ativa}
                  onValueChange={(v) => onAlternar(area, v)}
                  disabled={alterandoId === area.id}
                  trackColor={{ true: colors.primary, false: colors.disabled }}
                  accessibilityLabel={`Área ${area.nome} ${area.ativa ? 'ativa' : 'desativada'}`}
                />
                <Text style={styles.switchLabel}>Aceita reservas</Text>
              </View>
              <Button
                title="Editar"
                variant="secondary"
                icon="create-outline"
                small
                onPress={() => router.push({ pathname: '/gerenciar-areas/[id]', params: { id: area.id } })}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  nome: { fontSize: 18, fontWeight: '700', color: colors.text, flexShrink: 1 },
  turnos: { fontSize: 13, color: colors.textMuted },
  acoes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switch: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  switchLabel: { fontSize: 14, color: colors.text },
});
