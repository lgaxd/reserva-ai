import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// As variáveis EXPO_PUBLIC_* são lidas do arquivo .env e embutidas no bundle pelo Expo.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Evita inicializar duas vezes durante o Fast Refresh.
const jaInicializado = getApps().length > 0;
export const app = jaInicializado ? getApp() : initializeApp(firebaseConfig);

function criarAuth(): Auth {
  if (jaInicializado || Platform.OS === 'web') return getAuth(app);
  // No celular, a sessão é salva no AsyncStorage para o usuário continuar logado.
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export const auth = criarAuth();
export const db = getFirestore(app);
