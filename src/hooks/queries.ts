import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buscarArea,
  definirAreaAtiva,
  listarAreas,
  salvarArea,
} from '@/services/areaService';
import { agendarLembrete, cancelarLembrete } from '@/services/notificationService';
import {
  buscarCota,
  cancelarReserva,
  criarReserva,
  listarMinhasReservas,
  type Cancelamento,
  type NovaReserva,
} from '@/services/reservaService';
import type { AreaInput } from '@/types';

// Chaves centralizadas: facilitam invalidar o cache depois de uma gravação.
export const keys = {
  areas: ['areas'] as const,
  area: (id: string) => ['areas', id] as const,
  minhasReservas: (uid: string) => ['reservas', 'morador', uid] as const,
  cota: (uid: string, mes: string) => ['cota', uid, mes] as const,
};

// ---------- Áreas ----------

export function useAreas() {
  return useQuery({ queryKey: keys.areas, queryFn: listarAreas });
}

export function useArea(id: string | undefined) {
  return useQuery({
    queryKey: keys.area(id ?? ''),
    queryFn: () => buscarArea(id!),
    enabled: Boolean(id),
  });
}

export function useSalvarArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, id }: { input: AreaInput; id?: string }) => salvarArea(input, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.areas }),
  });
}

export function useDefinirAreaAtiva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) => definirAreaAtiva(id, ativa),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.areas }),
  });
}

// ---------- Reservas ----------

export function useMinhasReservas(uid: string) {
  return useQuery({
    queryKey: keys.minhasReservas(uid),
    queryFn: () => listarMinhasReservas(uid),
  });
}

export function useCota(uid: string, mes: string | undefined) {
  return useQuery({
    queryKey: keys.cota(uid, mes ?? ''),
    queryFn: () => buscarCota(uid, mes!),
    enabled: Boolean(mes),
  });
}

/** Cria a reserva e agenda o lembrete local. Retorna se o lembrete foi agendado. */
export function useCriarReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nova: NovaReserva) => {
      const reserva = await criarReserva(nova);
      const lembrete = await agendarLembrete(reserva).catch(() => false);
      return { reserva, lembrete };
    },
    onSuccess: ({ reserva }) => {
      qc.invalidateQueries({ queryKey: keys.minhasReservas(reserva.moradorId) });
      qc.invalidateQueries({ queryKey: ['cota', reserva.moradorId] });
    },
  });
}

export function useCancelarReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Cancelamento) => {
      await cancelarReserva(c);
      // Só o aparelho do próprio morador tem o lembrete agendado.
      if (c.por === 'morador') await cancelarLembrete(c.reserva.id).catch(() => undefined);
    },
    onSuccess: (_data, { reserva }) => {
      qc.invalidateQueries({ queryKey: keys.minhasReservas(reserva.moradorId) });
      qc.invalidateQueries({ queryKey: ['cota', reserva.moradorId] });
    },
  });
}
