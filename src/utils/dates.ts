import {
  ANTECEDENCIA_CANCELAMENTO_HORAS,
  HORA_LEMBRETE_VESPERA,
  JANELA_DIAS,
} from '@/config/constants';

// Todas as datas usam o fuso do aparelho. Uma "chave de data" é uma string AAAA-MM-DD.

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateKey(parseDateKey(value)) === value;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** "2026-11-20" -> "2026-11" */
export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** Datas que podem ser reservadas: de amanhã até JANELA_DIAS dias à frente. */
export function janelaDeReserva(agora: Date = new Date(), dias: number = JANELA_DIAS): string[] {
  return Array.from({ length: dias }, (_, i) => toDateKey(addDays(agora, i + 1)));
}

export function dentroDaJanela(dateKey: string, agora: Date = new Date()): boolean {
  return janelaDeReserva(agora).includes(dateKey);
}

/** Converte "HH:mm" em minutos desde a meia-noite. */
export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function isHora(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Data e hora de início de um turno ("HH:mm") em uma data (AAAA-MM-DD). */
export function inicioDoTurno(dateKey: string, hora: string): Date {
  const date = parseDateKey(dateKey);
  const [h, m] = hora.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
}

/** O morador só pode cancelar até ANTECEDENCIA_CANCELAMENTO_HORAS antes do início. */
export function podeCancelar(inicio: Date, agora: Date = new Date()): boolean {
  const limite = inicio.getTime() - ANTECEDENCIA_CANCELAMENTO_HORAS * 60 * 60 * 1000;
  return agora.getTime() < limite;
}

/**
 * Quando disparar o lembrete: na véspera às 18h. Se esse horário já passou
 * (reserva feita tarde da noite para o dia seguinte), 2h antes do início.
 * Retorna null se não houver horário futuro possível.
 */
export function horarioDoLembrete(inicio: Date, agora: Date = new Date()): Date | null {
  const vespera = addDays(inicio, -1);
  vespera.setHours(HORA_LEMBRETE_VESPERA, 0, 0, 0);
  if (vespera > agora) return vespera;
  const duasHorasAntes = new Date(inicio.getTime() - 2 * 60 * 60 * 1000);
  if (duasHorasAntes > agora) return duasHorasAntes;
  return null;
}

/** "sex, 20 nov" */
export function formatarDataCurta(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** "20/11/2026" */
export function formatarData(dateKey: string): string {
  const [y, m, d] = dateKey.split('-');
  return `${d}/${m}/${y}`;
}

export function diaDaSemana(dateKey: string): string {
  return DIAS_SEMANA[parseDateKey(dateKey).getDay()];
}

export function diaDoMes(dateKey: string): number {
  return parseDateKey(dateKey).getDate();
}

/** "2026-11" -> "nov/2026" */
export function nomeDoMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]}/${y}`;
}
