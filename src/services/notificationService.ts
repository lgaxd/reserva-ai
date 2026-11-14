import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reserva } from '@/types';
import { formatarDataCurta, horarioDoLembrete } from '@/utils/dates';

// Lembretes locais: agendados no próprio aparelho, sem servidor.
// Guardamos no AsyncStorage qual notificação pertence a qual reserva para poder cancelá-la.

const STORAGE_KEY = '@reservaai/lembretes';
const CANAL_ANDROID = 'lembretes';
const suportado = Platform.OS !== 'web';

type MapaLembretes = Record<string, string>; // reservaId -> notificationId

async function lerMapa(): Promise<MapaLembretes> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as MapaLembretes) : {};
}

async function salvarMapa(mapa: MapaLembretes): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapa));
}

/** Chamado uma vez na inicialização do app. */
export async function configurarNotificacoes(): Promise<void> {
  if (!suportado) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    // No Android 13+ o pedido de permissão só aparece depois que existe um canal.
    await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
      name: 'Lembretes de reserva',
      // eslint-disable-next-line import/namespace -- enum reexportado via `export *`; o tsc confirma que existe
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

async function temPermissao(pedirSeNecessario: boolean): Promise<boolean> {
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  if (!pedirSeNecessario || !atual.canAskAgain) return false;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

/**
 * Agenda o lembrete da reserva (véspera às 18h). Retorna false se o usuário
 * negou a permissão ou se não há horário futuro para avisar.
 */
export async function agendarLembrete(reserva: Reserva, pedirPermissao = true): Promise<boolean> {
  if (!suportado) return false;
  const quando = horarioDoLembrete(reserva.inicio);
  if (!quando) return false;
  if (!(await temPermissao(pedirPermissao))) return false;

  await cancelarLembrete(reserva.id);
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Lembrete: ${reserva.areaNome}`,
      body: `Sua reserva é ${formatarDataCurta(reserva.data)}, ${reserva.turnoNome} (${reserva.turnoInicio}–${reserva.turnoFim}).`,
      data: { reservaId: reserva.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: quando,
      channelId: CANAL_ANDROID,
    },
  });
  const mapa = await lerMapa();
  mapa[reserva.id] = notificationId;
  await salvarMapa(mapa);
  return true;
}

export async function cancelarLembrete(reservaId: string): Promise<void> {
  if (!suportado) return;
  const mapa = await lerMapa();
  const notificationId = mapa[reservaId];
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
  delete mapa[reservaId];
  await salvarMapa(mapa);
}

/**
 * Deixa os lembretes do aparelho iguais às reservas do morador:
 * cancela os de reservas canceladas (inclusive pelo síndico) e agenda os que faltam
 * (por exemplo, depois de entrar em outro celular), sem pedir permissão de novo.
 */
export async function sincronizarLembretes(reservas: Reserva[]): Promise<void> {
  if (!suportado) return;
  const mapa = await lerMapa();
  const agora = new Date();
  const ativas = new Set(
    reservas.filter((r) => r.status === 'confirmada' && r.inicio > agora).map((r) => r.id),
  );
  for (const reservaId of Object.keys(mapa)) {
    if (!ativas.has(reservaId)) await cancelarLembrete(reservaId);
  }
  for (const r of reservas) {
    if (ativas.has(r.id) && !mapa[r.id]) await agendarLembrete(r, false);
  }
}

/** Ao sair da conta, remove os lembretes daquele usuário do aparelho. */
export async function cancelarTodosLembretes(): Promise<void> {
  if (!suportado) return;
  const mapa = await lerMapa();
  for (const id of Object.values(mapa)) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}
