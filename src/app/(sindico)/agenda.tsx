import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { DateStrip } from '@/components/DateStrip';
import { MotivoModal } from '@/components/MotivoModal';
import { ReservaCard } from '@/components/ReservaCard';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { JANELA_DIAS } from '@/config/constants';
import { useCancelarReserva } from '@/hooks/queries';
import { useAgenda } from '@/hooks/useRealtime';
import { colors, spacing } from '@/theme/colors';
import type { Reserva } from '@/types';
import { addDays, formatarDataCurta, toDateKey } from '@/utils/dates';
import { mensagemDeErro } from '@/utils/errors';

export default function AgendaScreen() {
  // Hoje + os próximos 30 dias (toda a janela em que podem existir reservas).
  const datas = useMemo(() => {
    const hoje = new Date();
    return Array.from({ length: JANELA_DIAS + 1 }, (_, i) => toDateKey(addDays(hoje, i)));
  }, []);
  const [data, setData] = useState(datas[0]);
  const agenda = useAgenda(data); // tempo real (onSnapshot)
  const cancelar = useCancelarReserva();
  const [selecionada, setSelecionada] = useState<Reserva | null>(null);

  const confirmadas = agenda.data.filter((r) => r.status === 'confirmada');
  const canceladas = agenda.data.filter((r) => r.status === 'cancelada');

  async function onConfirmarCancelamento(motivo: string) {
    if (!selecionada) return;
    try {
      await cancelar.mutateAsync({ reserva: selecionada, por: 'sindico', motivo });
      setSelecionada(null);
    } catch (e) {
      Alert.alert('Não foi possível cancelar', mensagemDeErro(e));
    }
  }

  return (
    <Screen>
      <DateStrip datas={datas} selecionada={data} onSelect={setData} />

      <View style={styles.resumo}>
        <Text style={styles.titulo}>{formatarDataCurta(data)}</Text>
        <Badge label={`${confirmadas.length} confirmada(s)`} tone="success" />
        {canceladas.length > 0 && <Badge label={`${canceladas.length} cancelada(s)`} tone="danger" />}
      </View>

      {agenda.loading ? (
        <LoadingView message="Carregando agenda..." />
      ) : agenda.error ? (
        <ErrorView error={agenda.error} onRetry={agenda.tentarDeNovo} />
      ) : agenda.data.length === 0 ? (
        <EmptyView title="Nenhuma reserva neste dia" icon="calendar-clear-outline" />
      ) : (
        [...confirmadas, ...canceladas].map((r) => (
          <ReservaCard
            key={r.id}
            reserva={r}
            mostrarMorador
            onCancelar={() => setSelecionada(r)}
            cancelando={cancelar.isPending && selecionada?.id === r.id}
          />
        ))
      )}

      <MotivoModal
        key={selecionada?.id ?? 'fechado'}
        visible={selecionada !== null}
        titulo="Cancelar reserva"
        descricao={
          selecionada
            ? `${selecionada.areaNome} · ${selecionada.turnoNome} — ${selecionada.moradorNome} (bloco ${selecionada.bloco}, apto ${selecionada.apto}). O morador verá o motivo no app.`
            : undefined
        }
        loading={cancelar.isPending}
        onConfirm={onConfirmarCancelamento}
        onClose={() => setSelecionada(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  resumo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  titulo: { fontSize: 18, fontWeight: '700', color: colors.text, marginRight: spacing.xs },
});
