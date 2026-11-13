import { AppError, mensagemDeErro } from '@/utils/errors';

describe('mensagemDeErro', () => {
  it('traduz códigos do Firebase Auth', () => {
    expect(mensagemDeErro({ code: 'auth/invalid-credential' })).toBe('E-mail ou senha incorretos.');
    expect(mensagemDeErro({ code: 'auth/email-already-in-use' })).toBe('Já existe uma conta com este e-mail.');
  });

  it('traduz códigos do Firestore', () => {
    expect(mensagemDeErro({ code: 'permission-denied' })).toMatch(/regras de segurança/);
  });

  it('usa a mensagem dos erros de regra de negócio', () => {
    expect(mensagemDeErro(new AppError('cota-esgotada'))).toMatch(/limite de 2 reservas/);
  });

  it('tem uma mensagem genérica para o resto', () => {
    expect(mensagemDeErro(new Error('boom'))).toBe('Algo deu errado. Tente novamente.');
    expect(mensagemDeErro(undefined)).toBe('Algo deu errado. Tente novamente.');
  });
});
