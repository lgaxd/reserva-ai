import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { LIMITE_RESERVAS_MES } from '@/config/constants';
import { usePerfil } from '@/contexts/AuthContext';
import { useAreas, useCota } from '@/hooks/queries';
import { colors, spacing } from '@/theme/colors';
import { addDays, monthKey, nomeDoMes, toDateKey } from '@/utils/dates';

export default function AreasScreen() {
  const perfil = usePerfil();
  const areas = useAreas();
  // A janela começa amanhã, então usamos o mês de amanhã para mostrar a cota.
  const mes = useMemo(() => monthKey(toDateKey(addDays(new Date(), 1))), []);
  const cota = useCota(perfil.uid, mes);

  const ativas = (areas.data ?? []).filter((a) => a.ativa);

  function recarregar() {
    areas.refetch();
    cota.refetch();
  }

  return (
    <Screen refreshing={areas.isRefetching} onRefresh={recarregar}>
      <Text style={styles.ola}>Olá, {perfil.nome.split(' ')[0]}!</Text>

      <Card style={styles.cota}>
        <Ionicons name="ticket-outline" size={22} color={colors.primaryDark} />
        <Text style={styles.cotaTexto}>
          {cota.data
            ? `Você usou ${cota.data.total} de ${LIMITE_RESERVAS_MES} reservas em ${nomeDoMes(mes)}.`
            : 'Carregando sua cota do mês...'}
        </Text>
      </Card>

      {areas.isLoading ? (
        <LoadingView message="Carregando áreas..." />
      ) : areas.isError ? (
        <ErrorView error={areas.error} onRetry={areas.refetch} />
      ) : ativas.length === 0 ? (
        <EmptyView title="Nenhuma área disponível" message="O síndico ainda não cadastrou áreas para reserva." />
      ) : (
        ativas.map((area) => (
          <Card
            key={area.id}
            onPress={() => router.push({ pathname: '/areas/[id]', params: { id: area.id } })}
            accessibilityLabel={`Reservar ${area.nome}`}
          >
            <View style={styles.header}>
              <Text style={styles.nome}>{area.nome}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
            {area.descricao ? <Text style={styles.descricao}>{area.descricao}</Text> : null}
            <View style={styles.badges}>
              <Badge label={`Até ${area.capacidade} pessoas`} tone="primary" />
              <Badge label={`${area.turnos.length} turno(s)`} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ola: { fontSize: 22, fontWeight: '700', color: colors.text },
  cota: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  cotaTexto: { flex: 1, color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nome: { fontSize: 18, fontWeight: '700', color: colors.text },
  descricao: { fontSize: 14, color: colors.textMuted },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
