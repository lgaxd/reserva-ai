import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { ProfileView } from '@/components/ProfileView';
import { ANTECEDENCIA_CANCELAMENTO_HORAS, JANELA_DIAS, LIMITE_RESERVAS_MES } from '@/config/constants';
import { colors } from '@/theme/colors';

export default function PerfilMoradorScreen() {
  return (
    <ProfileView>
      <Card>
        <Text style={styles.titulo}>Regras de reserva</Text>
        <Text style={styles.item}>• Reservas de amanhã até {JANELA_DIAS} dias à frente.</Text>
        <Text style={styles.item}>• No máximo {LIMITE_RESERVAS_MES} reservas por mês.</Text>
        <Text style={styles.item}>• Cancelamento pelo app até {ANTECEDENCIA_CANCELAMENTO_HORAS}h antes do início.</Text>
        <Text style={styles.item}>• Você recebe um lembrete na véspera da reserva.</Text>
      </Card>
    </ProfileView>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  item: { fontSize: 14, color: colors.textMuted },
});
