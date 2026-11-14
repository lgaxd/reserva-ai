import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';
import { validarMotivo } from '@/utils/validation';

import { Button } from './Button';
import { Input } from './Input';

interface Props {
  visible: boolean;
  titulo: string;
  descricao?: string;
  loading?: boolean;
  onConfirm: (motivo: string) => void;
  onClose: () => void;
}

/**
 * Modal para o síndico informar o motivo do cancelamento (Alert.prompt só existe no iOS).
 * Quem usa deve passar uma `key` diferente a cada reserva: assim o React recria o
 * componente e o campo começa vazio, sem precisar resetar estado em um efeito.
 */
export function MotivoModal({ visible, titulo, descricao, loading, onConfirm, onClose }: Props) {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string>();

  function confirmar() {
    const e = validarMotivo(motivo);
    setErro(e);
    if (!e) onConfirm(motivo.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.box}>
          <Text style={styles.titulo}>{titulo}</Text>
          {descricao ? <Text style={styles.descricao}>{descricao}</Text> : null}
          <Input
            label="Motivo"
            placeholder="Ex.: manutenção na área"
            value={motivo}
            onChangeText={setMotivo}
            error={erro}
            maxLength={200}
            multiline
            autoFocus
          />
          <View style={styles.acoes}>
            <View style={styles.flex}>
              <Button title="Voltar" variant="secondary" onPress={onClose} disabled={loading} />
            </View>
            <View style={styles.flex}>
              <Button title="Cancelar reserva" variant="primary" onPress={confirmar} loading={loading} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  titulo: { fontSize: 18, fontWeight: '700', color: colors.text },
  descricao: { fontSize: 14, color: colors.textMuted },
  acoes: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
