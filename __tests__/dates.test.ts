import {
  dentroDaJanela,
  formatarData,
  formatarDataCurta,
  horarioDoLembrete,
  inicioDoTurno,
  isDateKey,
  isHora,
  janelaDeReserva,
  monthKey,
  podeCancelar,
  toDateKey,
} from '@/utils/dates';

// 13/11/2026 (sexta) às 10h, horário local
const agora = new Date(2026, 10, 13, 10, 0, 0);

describe('chaves de data', () => {
  it('formata e valida AAAA-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(isDateKey('2026-02-28')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('26-2-1')).toBe(false);
  });

  it('extrai o mês', () => {
    expect(monthKey('2026-12-01')).toBe('2026-12');
  });

  it('formata para exibição', () => {
    expect(formatarData('2026-11-20')).toBe('20/11/2026');
    expect(formatarDataCurta('2026-11-20')).toBe('sex, 20 nov');
  });
});

describe('janela de reserva', () => {
  it('vai de amanhã até 30 dias à frente', () => {
    const janela = janelaDeReserva(agora);
    expect(janela).toHaveLength(30);
    expect(janela[0]).toBe('2026-11-14');
    expect(janela[29]).toBe('2026-12-13');
  });

  it('rejeita hoje, o passado e depois de 30 dias', () => {
    expect(dentroDaJanela('2026-11-13', agora)).toBe(false);
    expect(dentroDaJanela('2026-11-01', agora)).toBe(false);
    expect(dentroDaJanela('2026-12-14', agora)).toBe(false);
    expect(dentroDaJanela('2026-11-20', agora)).toBe(true);
  });

  it('atravessa a virada de ano', () => {
    const janela = janelaDeReserva(new Date(2026, 11, 20));
    expect(janela[0]).toBe('2026-12-21');
    expect(janela[29]).toBe('2027-01-19');
  });
});

describe('horários', () => {
  it('valida HH:mm', () => {
    expect(isHora('08:00')).toBe(true);
    expect(isHora('23:59')).toBe(true);
    expect(isHora('24:00')).toBe(false);
    expect(isHora('8:00')).toBe(false);
  });

  it('monta o início do turno na data', () => {
    const d = inicioDoTurno('2026-11-20', '18:30');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(20);
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(30);
  });
});

describe('prazo de cancelamento (24h)', () => {
  it('permite com mais de 24h de antecedência', () => {
    expect(podeCancelar(new Date(2026, 10, 14, 11, 0), agora)).toBe(true);
  });

  it('bloqueia com 24h ou menos', () => {
    expect(podeCancelar(new Date(2026, 10, 14, 10, 0), agora)).toBe(false);
    expect(podeCancelar(new Date(2026, 10, 13, 20, 0), agora)).toBe(false);
  });
});

describe('horário do lembrete', () => {
  it('é na véspera às 18h', () => {
    const lembrete = horarioDoLembrete(new Date(2026, 10, 20, 12, 0), agora);
    expect(lembrete).toEqual(new Date(2026, 10, 19, 18, 0, 0, 0));
  });

  it('cai para 2h antes quando a véspera já passou', () => {
    const tarde = new Date(2026, 10, 13, 21, 0);
    const lembrete = horarioDoLembrete(new Date(2026, 10, 14, 8, 0), tarde);
    expect(lembrete).toEqual(new Date(2026, 10, 14, 6, 0));
  });

  it('é null quando não há horário futuro', () => {
    expect(horarioDoLembrete(new Date(2026, 10, 13, 11, 0), agora)).toBeNull();
  });
});
