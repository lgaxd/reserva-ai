import { useEffect, useState } from 'react';

import { observarAgenda, observarOcupacao } from '@/services/reservaService';
import type { Reserva } from '@/types';

// Hooks de tempo real (onSnapshot). A inscrição é aberta quando a tela monta ou
// os parâmetros mudam, e fechada no cleanup do useEffect para não vazar listeners.

interface RealtimeState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

export function useOcupacao(areaId: string | undefined, data: string | undefined) {
  const [state, setState] = useState<RealtimeState<Record<string, Reserva>>>({
    data: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!areaId || !data) return;
    setState({ data: {}, loading: true, error: null });
    return observarOcupacao(
      areaId,
      data,
      (ocupados) => setState({ data: ocupados, loading: false, error: null }),
      (error) => setState({ data: {}, loading: false, error }),
    );
  }, [areaId, data]);

  return state;
}

export function useAgenda(data: string) {
  const [state, setState] = useState<RealtimeState<Reserva[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    setState({ data: [], loading: true, error: null });
    return observarAgenda(
      data,
      (reservas) => setState({ data: reservas, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [data, tentativa]);

  return { ...state, tentarDeNovo: () => setTentativa((n) => n + 1) };
}
