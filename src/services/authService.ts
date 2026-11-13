import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/config/firebase';
import type { CadastroInput } from '@/utils/validation';

export async function entrar(email: string, senha: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), senha);
}

/**
 * Cria a conta no Firebase Auth e o perfil em users/{uid} (sempre como "morador").
 * Se o perfil não puder ser gravado, a conta recém-criada é apagada para não ficar
 * um usuário "órfão" sem perfil.
 */
export async function cadastrar(input: CadastroInput): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.senha);
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      nome: input.nome.trim(),
      email: cred.user.email,
      role: 'morador',
      bloco: input.bloco.trim().toUpperCase(),
      apto: input.apto.trim().toUpperCase(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    await deleteUser(cred.user).catch(() => undefined);
    throw error;
  }
}

export async function recuperarSenha(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function sair(): Promise<void> {
  await signOut(auth);
}
