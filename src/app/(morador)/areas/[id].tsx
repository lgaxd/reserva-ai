import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DateStrip } from '@/components/DateStrip';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { HORA_LEMBRETE_VESPERA, LIMITE_RESERVAS_MES } from '@/config/constants';
import { usePerfil } from '@/contexts/AuthContext';
import { useArea, useCota, useCriarReserva } from '@/hooks/queries';
import { useOcupacao } from '@/hooks/useRealtime';
import { colors, spacing } from '@/theme/colors';
import type { Turno } from '@/types';
import { formatarDataCurta, janelaDeReserva, monthKey, nomeDoMes } from '@/utils/dates';
import { mensagemDeErro } from '@/utils/errors';

export default function ReservarAreaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const perfil = usePerfil();
  const area = useArea(id);

  const datas = useMemo(() => janelaDeReserva(), []);
  const [data, setData] = useState(datas[0]);
  const mes = monthKey(data);

  const cota = useCota(perfil.uid, mes);
  const ocupacao = useOcupacao(id, data); // tempo real (onSnapshot)
  const criar = useCriarReserva();
  const [turnoEmAndamento, setTurnoEmAndamento] = useState<string>();

  if (area.isLoading) return <LoadingView message="Carregando área..." />;
  if (area.isError || !area.data) return <ErrorView error={area.error} onRetry={area.refetch} />;

  const a = area.data;
  const cotaEsgotada = (cota.data?.total ?? 0) >= LIMITE_RESERVAS_MES;

  function confirmar(turno: Turno) {
    Alert.alert(
      'Confirmar reserva',
      `${a.nome}\n${formatarDataCurta(data)} · ${turno.nome} (${turno.inicio}–${turno.fim})`,
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Reservar', onPress: () => reservar(turno) },
      ],
    );
  }

  async function reservar(turno: Turno) {
    setTurnoEmAndamento(turno.id);
    try {
      const { lembrete } = await criar.mutateAsync({ perfil, area: a, turno, data });
      Alert.alert(
        'Reserva confirmada!',
        lembrete
          ? `Vamos te lembrar na véspera às ${HORA_LEMBRETE_VESPERA}h.`
          : 'Ative as notificações do app para receber o lembrete na véspera.',
      );
    } catch (e) {
      Alert.alert('Não foi possível reservar', mensagemDeErro(e));
    } finally {
      setTurnoEmAndamento(undefined);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: a.nome }} />

      {a.descricao ? <Text style={styles.descricao}>{a.descricao}</Text> : null}

      {!a.ativa && (
        <Card style={styles.alerta}>
          <Text style={styles.alertaTexto}>Esta área foi desativada pelo síndico e não aceita reservas.</Text>
        </Card>
      )}

      <Text style={styles.secao}>Escolha a data</Text>
      <DateStrip datas={datas} selecionada={data} onSelect={setData} />

      <View style={styles.cotaLinha}>
        <Ionicons name="ticket-outline" size={16} color={cotaEsgotada ? colors.danger : colors.textMuted} />
        <Text style={[styles.cotaTexto, cotaEsgotada && { color: colors.danger }]}>
          {cota.data
            ? `${cota.data.total} de ${LIMITE_RESERVAS_MES} reservas usadas em ${nomeDoMes(mes)}`
            : 'Carregando cota...'}
        </Text>
      </View>

      <Text style={styles.secao}>Turnos de {formatarDataCurta(data)}</Text>

      {ocupacao.loading ? (
        <LoadingView message="Verificando disponibilidade..." />
      ) : ocupacao.error ? (
        <ErrorView error={ocupacao.error} />
      ) : (
        a.turnos.map((turno) => {
          const reserva = ocupacao.data[turno.id];
          const minha = reserva?.moradorId === perfil.uid;
          return (
            <Card key={turno.id} style={styles.turno}>
              <View style={styles.flex}>
                <Text style={styles.turnoNome}>{turno.nome}</Text>
                <Text style={styles.turnoHora}>
                  {turno.inicio} – {turno.fim}
                </Text>
              </View>
              {reserva ? (
                <Badge label={minha ? 'Sua reserva' : 'Ocupado'} tone={minha ? 'success' : 'danger'} />
              ) : (
                <Button
                  title="Reservar"
                  small
                  onPress={() => confirmar(turno)}
                  disabled={!a.ativa || cotaEsgotada || !cota.data || Boolean(turnoEmAndamento)}
                  loading={turnoEmAndamento === turno.id}
                />
              )}
            </Card>
          );
        })
      )}

      {cotaEsgotada && (
        <Text style={styles.aviso}>
          Você já usou suas {LIMITE_RESERVAS_MES} reservas de {nomeDoMes(mes)}. Escolha uma data de outro mês ou
          cancele uma reserva.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  descricao: { fontSize: 15, color: colors.textMuted },
  alerta: { backgroundColor: colors.warningLight, borderColor: colors.warningLight },
  alertaTexto: { color: colors.warning, fontWeight: '600' },
  secao: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  cotaLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cotaTexto: { fontSize: 13, color: colors.textMuted },
  turno: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  turnoNome: { fontSize: 16, fontWeight: '700', color: colors.text },
  turnoHora: { fontSize: 14, color: colors.textMuted },
  aviso: { fontSize: 13, color: colors.danger, textAlign: 'center' },
});
