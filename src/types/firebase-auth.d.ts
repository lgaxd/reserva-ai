// O pacote "firebase/auth" só expõe os tipos da versão web, mas no React Native
// o Metro carrega a versão RN, que exporta getReactNativePersistence.
// Esta declaração apenas informa o TypeScript sobre essa função.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
