/** Erro de regra de negócio do app, com uma mensagem pronta para o usuário. */
export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? MENSAGENS_APP[code]);
    this.name = 'AppError';
    this.code = code;
  }
}

export type AppErrorCode =
  | 'turno-ocupado'
  | 'cota-esgotada'
  | 'area-inativa'
  | 'area-inexistente'
  | 'turno-inexistente'
  | 'fora-da-janela'
  | 'prazo-cancelamento'
  | 'reserva-inexistente'
  | 'reserva-ja-cancelada';

const MENSAGENS_APP: Record<AppErrorCode, string> = {
  'turno-ocupado': 'Esse turno acabou de ser reservado por outro morador. Escolha outro horário.',
  'cota-esgotada': 'Você já atingiu o limite de 2 reservas neste mês.',
  'area-inativa': 'Esta área está desativada pelo síndico e não aceita novas reservas.',
  'area-inexistente': 'Área não encontrada.',
  'turno-inexistente': 'Turno não encontrado nesta área.',
  'fora-da-janela': 'Só é possível reservar de amanhã até 30 dias à frente.',
  'prazo-cancelamento': 'O cancelamento só é permitido até 24 horas antes do início.',
  'reserva-inexistente': 'Reserva não encontrada.',
  'reserva-ja-cancelada': 'Esta reserva já foi cancelada.',
};

const MENSAGENS_FIREBASE: Record<string, string> = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/missing-email': 'Informe o e-mail.',
  'auth/missing-password': 'Informe a senha.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
  'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/operation-not-allowed': 'Login por e-mail e senha não está habilitado no Firebase.',
  'auth/invalid-api-key': 'Configuração do Firebase inválida. Confira o arquivo .env.',
  'permission-denied': 'Operação não permitida pelas regras de segurança.',
  unavailable: 'Serviço indisponível. Verifique sua conexão.',
  'deadline-exceeded': 'A operação demorou demais. Tente de novo.',
  'failed-precondition': 'Falta criar um índice no Firestore. Veja o README.',
  aborted: 'Conflito ao gravar. Tente de novo.',
  'not-found': 'Registro não encontrado.',
};

/** Converte qualquer erro (Firebase, AppError ou desconhecido) em uma mensagem em português. */
export function mensagemDeErro(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    if (MENSAGENS_FIREBASE[code]) return MENSAGENS_FIREBASE[code];
  }
  return 'Algo deu errado. Tente novamente.';
}
