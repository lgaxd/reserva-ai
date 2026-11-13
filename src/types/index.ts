export type Role = 'morador' | 'sindico';

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  role: Role;
  bloco: string;
  apto: string;
}

/** Turno fixo de uma área. Horários no formato "HH:mm". */
export interface Turno {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
}

export interface Area {
  id: string;
  nome: string;
  descricao: string;
  capacidade: number;
  ativa: boolean;
  /** Ordenados pelo horário de início. */
  turnos: Turno[];
}

export type AreaInput = Omit<Area, 'id'>;

export type StatusReserva = 'confirmada' | 'cancelada';

export interface Reserva {
  /** {areaId}_{AAAA-MM-DD}_{turnoId} */
  id: string;
  areaId: string;
  areaNome: string;
  /** Data no formato AAAA-MM-DD (fuso do aparelho). */
  data: string;
  turnoId: string;
  turnoNome: string;
  turnoInicio: string;
  turnoFim: string;
  /** Data e hora de início do turno. */
  inicio: Date;
  moradorId: string;
  moradorNome: string;
  bloco: string;
  apto: string;
  status: StatusReserva;
  canceladaPor?: Role;
  motivo?: string;
}

export interface Cota {
  mes: string;
  total: number;
}
