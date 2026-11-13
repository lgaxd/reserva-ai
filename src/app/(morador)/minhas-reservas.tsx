import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { ReservaCard } from '@/components/ReservaCard';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { ANTECEDENCIA_CANCELAMENTO_HORAS } from '@/config/constants';
import { usePerfil } from '@/contexts/AuthContext';
import { useCancelarReserva, useMinhasReservas } from '@/hooks/queries';
import { sincronizarLembretes } from '@/services/notificationService';
import { colors, spacing } from '@/theme/colors';
import type { Reserva } from '@/types';
import { formatarDataCurta, podeCancelar } from '@/utils/dates';
import { mensagemDeErro } from '@/utils/errors';

export default function MinhasReservasScreen() {
  const perfil = usePerfil();
  const reservas = useMinhasReservas(perfil.uid);
  const cancelar = useCancelarReserva();
  const [cancelandoId, setCancelandoId] = useState<string>();
  const { refetch } = reservas;

  // Atualiza sempre que a aba ganha foco (ex.: depois de reservar na outra aba).
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Mantém os lembretes do aparelho iguais às reservas (inclusive as canceladas pelo síndico).
  useEffect(() => {
    if (reservas.data) sincronizarLembretes(reservas.data).catch(() => undefined);
  }, [reservas.data]);

  const { proximas, historico } = useMemo(() => {
    const agora = new Date();
    const lista = reservas.data ?? [];
    return {
      // a query vem em ordem decrescente; as próximas ficam mais legíveis em ordem crescente
      proximas: lista.filter((r) => r.status === 'confirmada' && r.inicio > agora).reverse(),
      historico: lista.filter((r) => r.status === 'cancelada' || r.inicio <= agora),
    };
  }, [reservas.data]);

  function confirmarCancelamento(reserva: Reserva) {
    Alert.alert(
      'Cancelar reserva',
      `${reserva.areaNome} · ${formatarDataCurta(reserva.data)} (${reserva.turnoNome}). A reserva volta para a sua cota do mês.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar reserva',
          style: 'destructive',
          onPress: async () => {
            setCancelandoId(reserva.id);
            try {
              await cancelar.mutateAsync({ reserva, por: 'morador' });
            } catch (e) {
              Alert.alert('Não foi possível cancelar', mensagemDeErro(e));
            } finally {
              setCancelandoId(undefined);
            }
          },
        },
      ],
    );
  }

  if (reservas.isLoading) return <LoadingView message="Carregando suas reservas..." />;
  if (reservas.isError) return <ErrorView error={reservas.error} onRetry={refetch} />;

  return (
    <Screen refreshing={reservas.isRefetching} onRefresh={refetch}>
      <Text style={styles.secao}>Próximas</Text>
      {proximas.length === 0 ? (
        <EmptyView title="Nenhuma reserva futura" message="Vá até a aba Áreas para reservar." icon="calendar-clear-outline" />
      ) : (
        proximas.map((r) => {
          const pode = podeCancelar(r.inicio);
          return (
            <ReservaCard
              key={r.id}
              reserva={r}
              onCancelar={pode ? () => confirmarCancelamento(r) : undefined}
              cancelando={cancelandoId === r.id}
              avisoCancelamento={
                pode
                  ? undefined
                  : `Cancelamento indisponível: faltam menos de ${ANTECEDENCIA_CANCELAMENTO_HORAS}h. Fale com o síndico.`
              }
            />
          );
        })
      )}

      {historico.length > 0 && (
        <>
          <Text style={styles.secao}>Histórico</Text>
          {historico.map((r) => (
            <ReservaCard key={r.id} reserva={r} />
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  secao: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
});
