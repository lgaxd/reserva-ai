import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { db } from '@/config/firebase';
import type { UserProfile } from '@/types';

/**
 * Observa o perfil users/{uid} em tempo real.
 * `null` significa que o documento (ainda) não existe — acontece por alguns instantes
 * logo após o cadastro, até o perfil ser gravado.
 */
export function observarPerfil(
  uid: string,
  onChange: (perfil: UserProfile | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) return onChange(null);
      const d = snap.data();
      onChange({
        uid,
        nome: d.nome,
        email: d.email,
        role: d.role,
        bloco: d.bloco ?? '',
        apto: d.apto ?? '',
      });
    },
    onError,
  );
}
