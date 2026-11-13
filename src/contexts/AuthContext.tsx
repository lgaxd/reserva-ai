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

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [perfilCarregado, setPerfilCarregado] = useState(false);
  const [erroPerfil, setErroPerfil] = useState<Error | null>(null);

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
    setPerfil(null);
    setPerfilCarregado(false);
    setErroPerfil(null);
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = observarPerfil(
      user.uid,
      (p) => {
        clearTimeout(timer);
        setPerfil(p);
        if (p) {
          setPerfilCarregado(true);
        } else {
          // Logo após o cadastro o documento ainda não existe: esperamos alguns
          // segundos antes de concluir que o perfil realmente está faltando.
          timer = setTimeout(() => setPerfilCarregado(true), 5000);
        }
      },
      (e) => {
        setErroPerfil(e);
        setPerfilCarregado(true);
      },
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      perfil,
      carregando: iniciando || (user !== null && !perfilCarregado),
      erroPerfil,
    }),
    [user, perfil, iniciando, perfilCarregado, erroPerfil],
  );

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
