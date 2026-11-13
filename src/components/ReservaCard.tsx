import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/colors';
import type { Reserva } from '@/types';
import { formatarDataCurta } from '@/utils/dates';

import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  reserva: Reserva;
  /** Mostra quem reservou (visão do síndico). */
  mostrarMorador?: boolean;
  onCancelar?: () => void;
  cancelando?: boolean;
  /** Texto explicando por que não dá para cancelar (ex.: prazo de 24h). */
  avisoCancelamento?: string;
}

export function ReservaCard({
  reserva,
  mostrarMorador = false,
  onCancelar,
  cancelando = false,
  avisoCancelamento,
}: Props) {
  const cancelada = reserva.status === 'cancelada';
  const passada = reserva.inicio < new Date();

  return (
    <Card style={cancelada ? styles.cancelada : undefined}>
      <View style={styles.header}>
        <Text style={styles.area}>{reserva.areaNome}</Text>
        {cancelada ? (
          <Badge label="Cancelada" tone="danger" />
        ) : passada ? (
          <Badge label="Realizada" tone="neutral" />
        ) : (
          <Badge label="Confirmada" tone="success" />
        )}
      </View>

      <View style={styles.linha}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={styles.texto}>{formatarDataCurta(reserva.data)}</Text>
        <Ionicons name="time-outline" size={16} color={colors.textMuted} />
        <Text style={styles.texto}>
          {reserva.turnoNome} · {reserva.turnoInicio}–{reserva.turnoFim}
        </Text>
      </View>

      {mostrarMorador && (
        <View style={styles.linha}>
          <Ionicons name="person-outline" size={16} color={colors.textMuted} />
          <Text style={styles.texto}>
            {reserva.moradorNome} · Bloco {reserva.bloco}, apto {reserva.apto}
          </Text>
        </View>
      )}

      {cancelada && (
        <Text style={styles.motivo}>
          Cancelada pelo {reserva.canceladaPor === 'sindico' ? 'síndico' : 'morador'}
          {reserva.motivo ? `: "${reserva.motivo}"` : '.'}
        </Text>
      )}

      {!cancelada && !passada && onCancelar && (
        <Button
          title="Cancelar reserva"
          variant="danger"
          icon="close-circle-outline"
          small
          onPress={onCancelar}
          loading={cancelando}
        />
      )}
      {!cancelada && !passada && avisoCancelamento && (
        <Text style={styles.aviso}>{avisoCancelamento}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cancelada: { opacity: 0.75 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  area: { fontSize: 17, fontWeight: '700', color: colors.text, flexShrink: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  texto: { fontSize: 14, color: colors.text, marginRight: spacing.sm },
  motivo: { fontSize: 13, color: colors.danger },
  aviso: { fontSize: 13, color: colors.textMuted },
});
