import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import type { Area, AreaInput, Turno } from '@/types';
import { horaParaMinutos } from '@/utils/dates';
import { AppError } from '@/utils/errors';

const areasRef = collection(db, 'areas');

/**
 * No Firestore os turnos ficam em um map { [turnoId]: { nome, inicio, fim } },
 * o que permite às regras de segurança checar `turnoId in area.turnos`.
 * No app trabalhamos com uma lista ordenada pelo horário.
 */
export function turnosDoFirestore(map: Record<string, Omit<Turno, 'id'>> | undefined): Turno[] {
  return Object.entries(map ?? {})
    .map(([id, t]) => ({ id, nome: t.nome, inicio: t.inicio, fim: t.fim }))
    .sort((a, b) => horaParaMinutos(a.inicio) - horaParaMinutos(b.inicio));
}

export function turnosParaFirestore(turnos: Turno[]): Record<string, Omit<Turno, 'id'>> {
  return Object.fromEntries(
    turnos.map((t) => [t.id, { nome: t.nome.trim(), inicio: t.inicio, fim: t.fim }]),
  );
}

export function areaDoFirestore(id: string, d: DocumentData): Area {
  return {
    id,
    nome: d.nome,
    descricao: d.descricao ?? '',
    capacidade: d.capacidade ?? 0,
    ativa: d.ativa === true,
    turnos: turnosDoFirestore(d.turnos),
  };
}

export async function listarAreas(): Promise<Area[]> {
  const snap = await getDocs(areasRef);
  return snap.docs
    .map((d) => areaDoFirestore(d.id, d.data()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function buscarArea(id: string): Promise<Area> {
  const snap = await getDoc(doc(db, 'areas', id));
  if (!snap.exists()) throw new AppError('area-inexistente');
  return areaDoFirestore(snap.id, snap.data());
}

/** Cria (sem id) ou substitui (com id) uma área. Retorna o id. */
export async function salvarArea(input: AreaInput, id?: string): Promise<string> {
  const ref = id ? doc(db, 'areas', id) : doc(areasRef);
  await setDoc(ref, {
    nome: input.nome.trim(),
    descricao: input.descricao.trim(),
    capacidade: input.capacidade,
    ativa: input.ativa,
    turnos: turnosParaFirestore(input.turnos),
    atualizadaEm: serverTimestamp(),
  });
  return ref.id;
}

export async function definirAreaAtiva(id: string, ativa: boolean): Promise<void> {
  await updateDoc(doc(db, 'areas', id), { ativa, atualizadaEm: serverTimestamp() });
}

/** Gera um id curto e estável para um turno novo (usado no id da reserva). */
export function novoTurnoId(): string {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}
