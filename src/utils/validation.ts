import { horaParaMinutos, isHora } from './dates';
import type { Turno } from '@/types';

export type Erros<T extends string> = Partial<Record<T, string>>;

export function validarEmail(email: string): string | undefined {
  if (!email.trim()) return 'Informe o e-mail.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'E-mail inválido.';
  return undefined;
}

export function validarSenha(senha: string): string | undefined {
  if (!senha) return 'Informe a senha.';
  if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  return undefined;
}

export function validarLogin(email: string, senha: string): Erros<'email' | 'senha'> {
  return limpar({
    email: validarEmail(email),
    senha: senha ? undefined : 'Informe a senha.',
  });
}

export interface CadastroInput {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  bloco: string;
  apto: string;
}

export function validarCadastro(input: CadastroInput): Erros<keyof CadastroInput> {
  const erros: Erros<keyof CadastroInput> = {};
  const nome = input.nome.trim();
  if (nome.length < 2) erros.nome = 'Informe seu nome (mínimo 2 letras).';
  else if (nome.length > 80) erros.nome = 'Nome muito longo.';
  erros.email = validarEmail(input.email);
  erros.senha = validarSenha(input.senha);
  if (!erros.senha && input.senha !== input.confirmarSenha) {
    erros.confirmarSenha = 'As senhas não conferem.';
  }
  if (!input.bloco.trim()) erros.bloco = 'Informe o bloco.';
  else if (input.bloco.trim().length > 10) erros.bloco = 'Máximo 10 caracteres.';
  if (!input.apto.trim()) erros.apto = 'Informe o apartamento.';
  else if (input.apto.trim().length > 10) erros.apto = 'Máximo 10 caracteres.';
  return limpar(erros);
}

export interface AreaFormInput {
  nome: string;
  descricao: string;
  capacidade: string;
  turnos: Turno[];
}

type CampoArea = 'nome' | 'descricao' | 'capacidade' | 'turnos';

export function validarArea(input: AreaFormInput): Erros<CampoArea> {
  const erros: Erros<CampoArea> = {};
  const nome = input.nome.trim();
  if (nome.length < 2) erros.nome = 'Informe o nome da área.';
  else if (nome.length > 60) erros.nome = 'Máximo 60 caracteres.';
  if (input.descricao.trim().length > 300) erros.descricao = 'Máximo 300 caracteres.';
  const capacidade = Number(input.capacidade.trim());
  if (!/^\d+$/.test(input.capacidade.trim()) || capacidade < 1 || capacidade > 1000) {
    erros.capacidade = 'Capacidade deve ser um número entre 1 e 1000.';
  }
  erros.turnos = validarTurnos(input.turnos);
  return limpar(erros);
}

/** Valida a lista de turnos: 1 a 6, horários válidos, início antes do fim e sem sobreposição. */
export function validarTurnos(turnos: Turno[]): string | undefined {
  if (turnos.length === 0) return 'Cadastre pelo menos um turno.';
  if (turnos.length > 6) return 'Máximo de 6 turnos por área.';
  for (const t of turnos) {
    if (!t.nome.trim()) return 'Todo turno precisa de um nome.';
    if (!isHora(t.inicio) || !isHora(t.fim)) return `Horário inválido em "${t.nome}". Use HH:mm.`;
    if (horaParaMinutos(t.inicio) >= horaParaMinutos(t.fim)) {
      return `Em "${t.nome}", o início deve ser antes do fim.`;
    }
  }
  const ordenados = [...turnos].sort((a, b) => horaParaMinutos(a.inicio) - horaParaMinutos(b.inicio));
  for (let i = 1; i < ordenados.length; i++) {
    if (horaParaMinutos(ordenados[i].inicio) < horaParaMinutos(ordenados[i - 1].fim)) {
      return `Os turnos "${ordenados[i - 1].nome}" e "${ordenados[i].nome}" se sobrepõem.`;
    }
  }
  return undefined;
}

export function validarMotivo(motivo: string): string | undefined {
  const m = motivo.trim();
  if (m.length < 3) return 'Informe o motivo (mínimo 3 caracteres).';
  if (m.length > 200) return 'Máximo 200 caracteres.';
  return undefined;
}

/** Remove as chaves sem erro, para que `temErros` funcione com Object.keys. */
function limpar<T extends Record<string, string | undefined>>(erros: T): T {
  for (const k of Object.keys(erros)) if (!erros[k]) delete erros[k];
  return erros;
}

export function temErros(erros: object): boolean {
  return Object.keys(erros).length > 0;
}
