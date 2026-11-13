import type { Turno } from '@/types';
import {
  temErros,
  validarArea,
  validarCadastro,
  validarLogin,
  validarMotivo,
  validarTurnos,
} from '@/utils/validation';

const turno = (nome: string, inicio: string, fim: string, id = nome): Turno => ({ id, nome, inicio, fim });

describe('login', () => {
  it('exige e-mail válido e senha', () => {
    expect(validarLogin('', '')).toEqual({ email: 'Informe o e-mail.', senha: 'Informe a senha.' });
    expect(validarLogin('a@b', 'x').email).toBe('E-mail inválido.');
    expect(temErros(validarLogin('ana@email.com', '123456'))).toBe(false);
  });
});

describe('cadastro', () => {
  const valido = {
    nome: 'Ana Souza',
    email: 'ana@email.com',
    senha: '123456',
    confirmarSenha: '123456',
    bloco: 'A',
    apto: '101',
  };

  it('aceita dados válidos', () => {
    expect(validarCadastro(valido)).toEqual({});
  });

  it('aponta cada campo inválido', () => {
    const erros = validarCadastro({ ...valido, nome: 'A', senha: '123', bloco: '', apto: '12345678901' });
    expect(Object.keys(erros).sort()).toEqual(['apto', 'bloco', 'nome', 'senha']);
  });

  it('confere a confirmação de senha', () => {
    expect(validarCadastro({ ...valido, confirmarSenha: '654321' }).confirmarSenha).toBe('As senhas não conferem.');
  });
});

describe('turnos', () => {
  it('aceita turnos sem sobreposição', () => {
    expect(validarTurnos([turno('Manhã', '08:00', '12:00'), turno('Tarde', '12:00', '17:00')])).toBeUndefined();
  });

  it('exige pelo menos um e no máximo seis', () => {
    expect(validarTurnos([])).toMatch(/pelo menos um/);
    const sete = Array.from({ length: 7 }, (_, i) => turno(`T${i}`, `0${i}:00`, `0${i}:30`));
    expect(validarTurnos(sete)).toMatch(/Máximo de 6/);
  });

  it('rejeita horário inválido e início depois do fim', () => {
    expect(validarTurnos([turno('X', '8h', '12:00')])).toMatch(/Horário inválido/);
    expect(validarTurnos([turno('X', '14:00', '12:00')])).toMatch(/antes do fim/);
  });

  it('detecta sobreposição mesmo fora de ordem', () => {
    expect(validarTurnos([turno('Tarde', '13:00', '17:00'), turno('Manhã', '08:00', '13:30')])).toMatch(/se sobrepõem/);
  });
});

describe('área', () => {
  it('valida nome e capacidade', () => {
    const erros = validarArea({ nome: '', descricao: '', capacidade: '0', turnos: [turno('M', '08:00', '12:00')] });
    expect(Object.keys(erros).sort()).toEqual(['capacidade', 'nome']);
  });
});

describe('motivo do cancelamento', () => {
  it('exige ao menos 3 caracteres', () => {
    expect(validarMotivo(' a ')).toBeDefined();
    expect(validarMotivo('Manutenção')).toBeUndefined();
  });
});
