// Cadastra as áreas comuns de exemplo no Firestore.
// Uso: npm run seed   (lê o .env; precisa de SEED_SINDICO_EMAIL e SEED_SINDICO_SENHA)
// A conta informada precisa ter role "sindico" em users/{uid} — veja o README.

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, terminate } from 'firebase/firestore';

const env = process.env;
const config = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!config.apiKey || !config.projectId) {
  console.error('Preencha o .env com as credenciais do Firebase (veja .env.example).');
  process.exit(1);
}
if (!env.SEED_SINDICO_EMAIL || !env.SEED_SINDICO_SENHA) {
  console.error('Defina SEED_SINDICO_EMAIL e SEED_SINDICO_SENHA no .env.');
  process.exit(1);
}

const AREAS = {
  'salao-festas': {
    nome: 'Salão de Festas',
    descricao: 'Salão com cozinha equipada, mesas e cadeiras. Limpeza por conta do morador.',
    capacidade: 80,
    turnos: {
      tarde: { nome: 'Tarde', inicio: '12:00', fim: '17:00' },
      noite: { nome: 'Noite', inicio: '18:00', fim: '23:00' },
    },
  },
  churrasqueira: {
    nome: 'Churrasqueira',
    descricao: 'Churrasqueira coberta com pia e geladeira. Traga seu carvão.',
    capacidade: 25,
    turnos: {
      almoco: { nome: 'Almoço', inicio: '11:00', fim: '16:00' },
      noite: { nome: 'Noite', inicio: '18:00', fim: '23:00' },
    },
  },
  quadra: {
    nome: 'Quadra Poliesportiva',
    descricao: 'Quadra para futsal, vôlei e basquete. Uso de tênis obrigatório.',
    capacidade: 20,
    turnos: {
      manha: { nome: 'Manhã', inicio: '08:00', fim: '12:00' },
      tarde: { nome: 'Tarde', inicio: '13:00', fim: '17:00' },
      noite: { nome: 'Noite', inicio: '18:00', fim: '22:00' },
    },
  },
};

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  const cred = await signInWithEmailAndPassword(auth, env.SEED_SINDICO_EMAIL, env.SEED_SINDICO_SENHA);
  const perfil = await getDoc(doc(db, 'users', cred.user.uid));
  if (!perfil.exists() || perfil.data().role !== 'sindico') {
    throw new Error(
      `A conta ${env.SEED_SINDICO_EMAIL} não é síndico. No console, edite users/${cred.user.uid} e mude role para "sindico".`,
    );
  }

  for (const [id, area] of Object.entries(AREAS)) {
    await setDoc(doc(db, 'areas', id), { ...area, ativa: true, atualizadaEm: serverTimestamp() });
    console.log(`✔ ${area.nome}`);
  }
  console.log('Seed concluído.');
  await signOut(auth);
} catch (error) {
  console.error('Falha no seed:', error.message ?? error);
  process.exitCode = 1;
} finally {
  await terminate(db);
  process.exit();
}
