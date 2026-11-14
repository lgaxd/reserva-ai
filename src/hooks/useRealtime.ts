import { useEffect, useState } from 'react';

import { observarAgenda, observarOcupacao } from '@/services/reservaService';
import type { Reserva } from '@/types';

// Hooks de tempo real (onSnapshot). A inscrição é aberta quando a tela monta ou
// os parâmetros mudam, e fechada no cleanup do useEffect para não vazar listeners.
//
// O estado guarda a "chave" da consulta que o produziu. Quando os parâmetros mudam,
// a chave deixa de bater e o hook devolve "carregando" sem precisar chamar setState
// dentro do efeito (o que causaria uma renderização extra).

interface Snapshot<T> {
  chave: string;
  data: T;
  error: Error | null;
}

export function useOcupacao(areaId: string | undefined, data: string | undefined) {
  const chave = areaId && data ? `${areaId}|${data}` : '';
  const [snap, setSnap] = useState<Snapshot<Record<string, Reserva>> | null>(null);

  useEffect(() => {
    if (!areaId || !data) return;
    const k = `${areaId}|${data}`;
    return observarOcupacao(
      areaId,
      data,
      (ocupados) => setSnap({ chave: k, data: ocupados, error: null }),
      (error) => setSnap({ chave: k, data: {}, error }),
    );
  }, [areaId, data]);

  const atual = snap !== null && snap.chave === chave;
  return {
    data: atual ? snap.data : {},
    loading: !atual,
    error: atual ? snap.error : null,
  };
}

export function useAgenda(data: string) {
  const [tentativa, setTentativa] = useState(0);
  const chave = `${data}|${tentativa}`;
  const [snap, setSnap] = useState<Snapshot<Reserva[]> | null>(null);

  useEffect(() => {
    const k = `${data}|${tentativa}`;
    return observarAgenda(
      data,
      (reservas) => setSnap({ chave: k, data: reservas, error: null }),
      (error) => setSnap({ chave: k, data: [], error }),
    );
  }, [data, tentativa]);

  const atual = snap !== null && snap.chave === chave;
  return {
    data: atual ? snap.data : [],
    loading: !atual,
    error: atual ? snap.error : null,
    tentarDeNovo: () => setTentativa((n) => n + 1),
  };
}
