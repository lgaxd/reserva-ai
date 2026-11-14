import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Projeto Firebase padrão do ReservaAí (onde estão as contas de teste do README).
// A configuração web do Firebase não é secreta: ela vai embutida em qualquer app
// publicado. Quem protege os dados são as regras de segurança (firestore.rules).
const PROJETO_PADRAO = {
  apiKey: 'AIzaSyBztt_Y9m_FVMcdwzMRkUX2wXvrmpTTCUg',
  authDomain: 'reservaai-97f09.firebaseapp.com',
  projectId: 'reservaai-97f09',
  storageBucket: 'reservaai-97f09.firebasestorage.app',
  messagingSenderId: '183377062525',
  appId: '1:183377062525:web:f64342a0b8f5b913e49f14',
};

// Para usar outro projeto, defina as variáveis EXPO_PUBLIC_* no arquivo .env;
// o Expo as embute no bundle e elas têm prioridade sobre o projeto padrão.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || PROJETO_PADRAO.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || PROJETO_PADRAO.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || PROJETO_PADRAO.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || PROJETO_PADRAO.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || PROJETO_PADRAO.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || PROJETO_PADRAO.appId,
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
