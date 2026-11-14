import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth } from '@/config/firebase';
import { queryClient } from '@/config/queryClient';
import { observarPerfil } from '@/services/profileService';
import type { UserProfile } from '@/types';

type AuthState = {
  /** Usuário do Firebase Auth (null = deslogado). */
  user: User | null;
  /** Perfil em users/{uid} (null enquanto não carregou ou não existe). */
  perfil: UserProfile | null;
  /** true até sabermos se há sessão salva e, se houver, até o perfil chegar. */
  carregando: boolean;
  erroPerfil: Error | null;
};

type EstadoPerfil = {
  uid: string;
  perfil: UserProfile | null;
  carregado: boolean;
  erro: Error | null;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [iniciando, setIniciando] = useState(true);
  // O estado do perfil guarda o uid a que pertence: se o usuário mudar (logout ou
  // outra conta), o perfil antigo é ignorado sem precisar resetar estado no efeito.
  const [estadoPerfil, setEstadoPerfil] = useState<EstadoPerfil | null>(null);

  // 1) Escuta login/logout (inclusive a sessão restaurada do AsyncStorage).
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIniciando(false);
      if (!u) queryClient.clear(); // não deixa dados de um usuário para o próximo
    });
  }, []);

  // 2) Com o usuário logado, escuta o perfil dele em tempo real.
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = observarPerfil(
      uid,
      (perfil) => {
        clearTimeout(timer);
        setEstadoPerfil({ uid, perfil, carregado: perfil !== null, erro: null });
        if (!perfil) {
          // Logo após o cadastro o documento ainda não existe: esperamos alguns
          // segundos antes de concluir que o perfil realmente está faltando.
          timer = setTimeout(
            () => setEstadoPerfil({ uid, perfil: null, carregado: true, erro: null }),
            5000,
          );
        }
      },
      (erro) => setEstadoPerfil({ uid, perfil: null, carregado: true, erro }),
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [user]);

  const value = useMemo<AuthState>(() => {
    const atual = user !== null && estadoPerfil?.uid === user.uid ? estadoPerfil : null;
    return {
      user,
      perfil: atual?.perfil ?? null,
      carregando: iniciando || (user !== null && !atual?.carregado),
      erroPerfil: atual?.erro ?? null,
    };
  }, [user, estadoPerfil, iniciando]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}

/** Para telas que só aparecem com o usuário logado e o perfil carregado. */
export function usePerfil(): UserProfile {
  const { perfil } = useAuth();
  if (!perfil) throw new Error('usePerfil usado fora da área logada.');
  return perfil;
}
