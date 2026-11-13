import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

import { LIMITE_RESERVAS_MES } from '@/config/constants';
import { db } from '@/config/firebase';
import type { Area, Cota, Reserva, Role, Turno, UserProfile } from '@/types';
import { dentroDaJanela, inicioDoTurno, monthKey, podeCancelar } from '@/utils/dates';
import { AppError } from '@/utils/errors';

const reservasRef = collection(db, 'reservas');

/** Um único documento por área + data + turno: é isso que impede reservas duplicadas. */
export function idReserva(areaId: string, data: string, turnoId: string): string {
  return `${areaId}_${data}_${turnoId}`;
}

function cotaRef(uid: string, mes: string) {
  return doc(db, 'users', uid, 'cotas', mes);
}

export function reservaDoFirestore(id: string, d: DocumentData): Reserva {
  return {
    id,
    areaId: d.areaId,
    areaNome: d.areaNome,
    data: d.data,
    turnoId: d.turnoId,
    turnoNome: d.turnoNome,
    turnoInicio: d.turnoInicio,
    turnoFim: d.turnoFim,
    inicio: d.inicio instanceof Timestamp ? d.inicio.toDate() : new Date(d.inicio),
    moradorId: d.moradorId,
    moradorNome: d.moradorNome,
    bloco: d.bloco,
    apto: d.apto,
    status: d.status,
    canceladaPor: d.canceladaPor,
    motivo: d.motivo,
  };
}

export interface NovaReserva {
  perfil: UserProfile;
  area: Area;
  turno: Turno;
  data: string;
}

/**
 * Cria a reserva dentro de uma transação:
 * 1. lê a área, o documento do turno e a cota do mês;
 * 2. valida área ativa, turno livre e cota disponível;
 * 3. grava a reserva e incrementa a cota juntas (tudo ou nada).
 * Se outro morador reservar o mesmo turno ao mesmo tempo, o Firestore repete a
 * transação, ela encontra o turno ocupado e falha com "turno-ocupado".
 */
export async function criarReserva(
  { perfil, area, turno, data }: NovaReserva,
  agora: Date = new Date(),
): Promise<Reserva> {
  if (!dentroDaJanela(data, agora)) throw new AppError('fora-da-janela');

  const id = idReserva(area.id, data, turno.id);
  const mes = monthKey(data);
  const reservaRef = doc(db, 'reservas', id);
  const areaRef = doc(db, 'areas', area.id);
  const refCota = cotaRef(perfil.uid, mes);

  const nova = {
    areaId: area.id,
    areaNome: area.nome,
    data,
    turnoId: turno.id,
    turnoNome: turno.nome,
    turnoInicio: turno.inicio,
    turnoFim: turno.fim,
    inicio: Timestamp.fromDate(inicioDoTurno(data, turno.inicio)),
    moradorId: perfil.uid,
    moradorNome: perfil.nome,
    bloco: perfil.bloco,
    apto: perfil.apto,
    status: 'confirmada' as const,
  };

  await runTransaction(db, async (tx) => {
    const areaSnap = await tx.get(areaRef);
    const reservaSnap = await tx.get(reservaRef);
    const cotaSnap = await tx.get(refCota);

    if (!areaSnap.exists()) throw new AppError('area-inexistente');
    const areaAtual = areaSnap.data();
    if (areaAtual.ativa !== true) throw new AppError('area-inativa');
    if (!areaAtual.turnos?.[turno.id]) throw new AppError('turno-inexistente');

    if (reservaSnap.exists() && reservaSnap.data().status === 'confirmada') {
      throw new AppError('turno-ocupado');
    }

    const total: number = cotaSnap.exists() ? cotaSnap.data().total : 0;
    if (total >= LIMITE_RESERVAS_MES) throw new AppError('cota-esgotada');

    tx.set(reservaRef, { ...nova, createdAt: serverTimestamp() });
    tx.set(refCota, { total: total + 1, ultimaReserva: id });
  });

  return reservaDoFirestore(id, { ...nova, inicio: nova.inicio });
}

export interface Cancelamento {
  reserva: Reserva;
  por: Role;
  motivo?: string;
}

/**
 * Cancela a reserva e devolve a cota do morador na mesma transação.
 * O morador só cancela até 24h antes; o síndico cancela a qualquer momento com motivo.
 * O documento não é apagado: fica com status "cancelada" para manter o histórico
 * e libera o turno para uma nova reserva.
 */
export async function cancelarReserva(
  { reserva, por, motivo = '' }: Cancelamento,
  agora: Date = new Date(),
): Promise<void> {
  if (por === 'morador' && !podeCancelar(reserva.inicio, agora)) {
    throw new AppError('prazo-cancelamento');
  }

  const reservaRef = doc(db, 'reservas', reserva.id);
  const refCota = cotaRef(reserva.moradorId, monthKey(reserva.data));

  await runTransaction(db, async (tx) => {
    const reservaSnap = await tx.get(reservaRef);
    const cotaSnap = await tx.get(refCota);

    if (!reservaSnap.exists()) throw new AppError('reserva-inexistente');
    if (reservaSnap.data().status !== 'confirmada') throw new AppError('reserva-ja-cancelada');

    const total: number = cotaSnap.exists() ? cotaSnap.data().total : 0;

    tx.update(reservaRef, {
      status: 'cancelada',
      canceladaPor: por,
      motivo: motivo.trim(),
      canceladaEm: serverTimestamp(),
    });
    tx.set(refCota, { total: Math.max(total - 1, 0), ultimaReserva: reserva.id });
  });
}

/** Histórico do morador, da reserva mais distante para a mais antiga. */
export async function listarMinhasReservas(uid: string): Promise<Reserva[]> {
  const q = query(reservasRef, where('moradorId', '==', uid), orderBy('inicio', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => reservaDoFirestore(d.id, d.data()));
}

export async function buscarCota(uid: string, mes: string): Promise<Cota> {
  const snap = await getDoc(cotaRef(uid, mes));
  return { mes, total: snap.exists() ? snap.data().total : 0 };
}

/**
 * Tempo real: turnos já reservados de uma área em uma data.
 * Retorna um mapa turnoId -> reserva confirmada.
 */
export function observarOcupacao(
  areaId: string,
  data: string,
  onChange: (ocupados: Record<string, Reserva>) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(reservasRef, where('areaId', '==', areaId), where('data', '==', data));
  return onSnapshot(
    q,
    (snap) => {
      const ocupados: Record<string, Reserva> = {};
      for (const d of snap.docs) {
        const r = reservaDoFirestore(d.id, d.data());
        if (r.status === 'confirmada') ocupados[r.turnoId] = r;
      }
      onChange(ocupados);
    },
    onError,
  );
}

/** Tempo real: todas as reservas (de todas as áreas) em uma data, para o síndico. */
export function observarAgenda(
  data: string,
  onChange: (reservas: Reserva[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(reservasRef, where('data', '==', data));
  return onSnapshot(
    q,
    (snap) => {
      const lista = snap.docs
        .map((d) => reservaDoFirestore(d.id, d.data()))
        .sort(
          (a, b) =>
            a.inicio.getTime() - b.inicio.getTime() || a.areaNome.localeCompare(b.areaNome, 'pt-BR'),
        );
      onChange(lista);
    },
    onError,
  );
}
