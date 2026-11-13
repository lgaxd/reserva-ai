import type { Area, Reserva, UserProfile } from '@/types';
import { AppError } from '@/utils/errors';

// ---------- Firestore falso em memória ----------
// (variáveis usadas dentro de jest.mock precisam começar com "mock")
// Cada documento é guardado pelo caminho ("reservas/x", "users/u1/cotas/2026-11").
// O runTransaction falso executa o callback com um "tx" que lê e grava nesse mapa.

const mockBanco = new Map<string, Record<string, unknown>>();
const mockGravacoes: { tipo: 'set' | 'update'; path: string; data: Record<string, unknown> }[] = [];

jest.mock('@/config/firebase', () => ({ db: {} }));

jest.mock('firebase/firestore', () => {
  class Timestamp {
    private readonly d: Date;
    constructor(d: Date) {
      this.d = d;
    }
    static fromDate(d: Date) {
      return new Timestamp(d);
    }
    toDate() {
      return this.d;
    }
  }
  const snap = (path: string) => ({
    exists: () => mockBanco.has(path),
    data: () => mockBanco.get(path),
  });
  return {
    Timestamp,
    collection: jest.fn((_db: unknown, ...segs: string[]) => ({ path: segs.join('/') })),
    doc: jest.fn((_db: unknown, ...segs: string[]) => ({ path: segs.join('/') })),
    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
    runTransaction: jest.fn(async (_db: unknown, fn: (tx: unknown) => Promise<unknown>) => {
      const pendentes: typeof mockGravacoes = [];
      const tx = {
        get: async (ref: { path: string }) => snap(ref.path),
        set: (ref: { path: string }, data: Record<string, unknown>) => pendentes.push({ tipo: 'set', path: ref.path, data }),
        update: (ref: { path: string }, data: Record<string, unknown>) =>
          pendentes.push({ tipo: 'update', path: ref.path, data }),
      };
      const result = await fn(tx);
      // tudo ou nada: só aplica se o callback não lançou erro
      for (const g of pendentes) {
        mockBanco.set(g.path, g.tipo === 'set' ? g.data : { ...mockBanco.get(g.path), ...g.data });
        mockGravacoes.push(g);
      }
      return result;
    }),
  };
});

// importado depois dos mocks
import { cancelarReserva, criarReserva, idReserva } from '@/services/reservaService';

const agora = new Date(2026, 10, 13, 10, 0); // 13/11/2026 10h

const perfil: UserProfile = {
  uid: 'u1',
  nome: 'Ana',
  email: 'ana@email.com',
  role: 'morador',
  bloco: 'A',
  apto: '101',
};

const area: Area = {
  id: 'churrasqueira',
  nome: 'Churrasqueira',
  descricao: '',
  capacidade: 20,
  ativa: true,
  turnos: [
    { id: 'almoco', nome: 'Almoço', inicio: '11:00', fim: '16:00' },
    { id: 'noite', nome: 'Noite', inicio: '18:00', fim: '23:00' },
  ],
};

const [almoco, noite] = area.turnos;

function salvarAreaNoBanco(ativa = true) {
  mockBanco.set('areas/churrasqueira', {
    nome: area.nome,
    ativa,
    turnos: { almoco: { ...almoco }, noite: { ...noite } },
  });
}

beforeEach(() => {
  mockBanco.clear();
  mockGravacoes.length = 0;
  salvarAreaNoBanco();
});

describe('criarReserva', () => {
  it('grava a reserva com id determinístico e incrementa a cota', async () => {
    const r = await criarReserva({ perfil, area, turno: almoco, data: '2026-11-20' }, agora);

    expect(r.id).toBe('churrasqueira_2026-11-20_almoco');
    expect(mockBanco.get('reservas/churrasqueira_2026-11-20_almoco')).toMatchObject({
      status: 'confirmada',
      moradorId: 'u1',
      createdAt: 'SERVER_TIMESTAMP',
    });
    expect(mockBanco.get('users/u1/cotas/2026-11')).toEqual({ total: 1, ultimaReserva: r.id });
    expect(r.inicio).toEqual(new Date(2026, 10, 20, 11, 0));
  });

  it('falha com "turno-ocupado" se já existe reserva confirmada', async () => {
    mockBanco.set(`reservas/${idReserva('churrasqueira', '2026-11-20', 'almoco')}`, { status: 'confirmada' });

    await expect(criarReserva({ perfil, area, turno: almoco, data: '2026-11-20' }, agora)).rejects.toMatchObject({
      code: 'turno-ocupado',
    });
    expect(mockGravacoes).toHaveLength(0);
  });

  it('permite reservar um turno que foi cancelado', async () => {
    mockBanco.set(`reservas/${idReserva('churrasqueira', '2026-11-20', 'almoco')}`, { status: 'cancelada' });
    await expect(criarReserva({ perfil, area, turno: almoco, data: '2026-11-20' }, agora)).resolves.toBeDefined();
  });

  it('respeita o limite de 2 reservas no mês', async () => {
    mockBanco.set('users/u1/cotas/2026-11', { total: 2, ultimaReserva: 'x' });

    const erro = await criarReserva({ perfil, area, turno: noite, data: '2026-11-25' }, agora).catch((e) => e);
    expect(erro).toBeInstanceOf(AppError);
    expect(erro.code).toBe('cota-esgotada');
  });

  it('a cota é por mês: dezembro não é afetado por novembro', async () => {
    mockBanco.set('users/u1/cotas/2026-11', { total: 2, ultimaReserva: 'x' });
    await criarReserva({ perfil, area, turno: noite, data: '2026-12-02' }, agora);
    expect(mockBanco.get('users/u1/cotas/2026-12')).toMatchObject({ total: 1 });
  });

  it('bloqueia área desativada', async () => {
    salvarAreaNoBanco(false);
    await expect(criarReserva({ perfil, area, turno: almoco, data: '2026-11-20' }, agora)).rejects.toMatchObject({
      code: 'area-inativa',
    });
  });

  it('bloqueia datas fora da janela (hoje ou depois de 30 dias)', async () => {
    await expect(criarReserva({ perfil, area, turno: almoco, data: '2026-11-13' }, agora)).rejects.toMatchObject({
      code: 'fora-da-janela',
    });
    await expect(criarReserva({ perfil, area, turno: almoco, data: '2026-12-31' }, agora)).rejects.toMatchObject({
      code: 'fora-da-janela',
    });
  });
});

describe('cancelarReserva', () => {
  async function reservaCriada(data = '2026-11-20'): Promise<Reserva> {
    return criarReserva({ perfil, area, turno: almoco, data }, agora);
  }

  it('morador cancela com antecedência e recupera a cota', async () => {
    const r = await reservaCriada();
    await cancelarReserva({ reserva: r, por: 'morador' }, agora);

    expect(mockBanco.get(`reservas/${r.id}`)).toMatchObject({ status: 'cancelada', canceladaPor: 'morador' });
    expect(mockBanco.get('users/u1/cotas/2026-11')).toEqual({ total: 0, ultimaReserva: r.id });
  });

  it('morador não cancela com menos de 24h', async () => {
    const r = await reservaCriada('2026-11-14'); // amanhã 11h: faltam 25h
    const quaseNaHora = new Date(2026, 10, 13, 12, 0); // faltam 23h
    await expect(cancelarReserva({ reserva: r, por: 'morador' }, quaseNaHora)).rejects.toMatchObject({
      code: 'prazo-cancelamento',
    });
  });

  it('síndico cancela a qualquer momento, com motivo', async () => {
    const r = await reservaCriada('2026-11-14');
    const quaseNaHora = new Date(2026, 10, 13, 12, 0);
    await cancelarReserva({ reserva: r, por: 'sindico', motivo: ' Manutenção ' }, quaseNaHora);

    expect(mockBanco.get(`reservas/${r.id}`)).toMatchObject({
      status: 'cancelada',
      canceladaPor: 'sindico',
      motivo: 'Manutenção',
    });
  });

  it('não cancela duas vezes', async () => {
    const r = await reservaCriada();
    await cancelarReserva({ reserva: r, por: 'morador' }, agora);
    await expect(cancelarReserva({ reserva: r, por: 'morador' }, agora)).rejects.toMatchObject({
      code: 'reserva-ja-cancelada',
    });
  });
});
