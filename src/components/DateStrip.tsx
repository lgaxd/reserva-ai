import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';
import { diaDaSemana, diaDoMes, parseDateKey } from '@/utils/dates';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

interface Props {
  datas: string[];
  selecionada: string;
  onSelect: (data: string) => void;
}

/** Faixa horizontal de datas (substitui uma biblioteca de calendário). */
export function DateStrip({ datas, selecionada, onSelect }: Props) {
  return (
    <FlatList
      horizontal
      data={datas}
      keyExtractor={(d) => d}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const ativo = item === selecionada;
        return (
          <Pressable
            onPress={() => onSelect(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={item}
            style={[styles.item, ativo && styles.itemAtivo]}
          >
            <Text style={[styles.semana, ativo && styles.textoAtivo]}>{diaDaSemana(item)}</Text>
            <Text style={[styles.dia, ativo && styles.textoAtivo]}>{diaDoMes(item)}</Text>
            <Text style={[styles.semana, ativo && styles.textoAtivo]}>
              {MESES[parseDateKey(item).getMonth()]}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingVertical: spacing.xs },
  item: {
    width: 58,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  itemAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  semana: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' },
  dia: { fontSize: 20, fontWeight: '700', color: colors.text },
  textoAtivo: { color: colors.white },
});
