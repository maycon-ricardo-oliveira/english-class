// src/utils/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Lê as variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Descomente se estiver a usar
};

// Verifica se todas as variáveis de ambiente necessárias foram carregadas
// Isso é útil para depuração, especialmente em produção.
const requiredConfigKeys = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error("Firebase config está com chaves em falta ou indefinidas:", missingKeys.join(', '));
  // Você pode querer lançar um erro aqui ou ter um comportamento de fallback,
  // dependendo de como quer lidar com configurações em falta.
  // Por exemplo: throw new Error(`Firebase config missing: ${missingKeys.join(', ')}`);
}


let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App inicializado pela primeira vez com variáveis de ambiente.");
  } catch (error) {
    console.error("Erro ao inicializar Firebase App:", error);
    console.error("Verifique se todas as variáveis de ambiente em firebaseConfig estão corretas e definidas.");
    // Pode ser útil mostrar um erro mais visível para o utilizador em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        alert(`Erro ao inicializar Firebase: ${error.message}. Verifique o console e as variáveis de ambiente.`);
    }
  }
} else {
  app = getApp();
  // console.log("Firebase App já existente reutilizado."); // Log menos verboso
}

// Só tenta obter database e auth se o app foi inicializado corretamente
const database = app ? getDatabase(app) : null;
const auth = app ? getAuth(app) : null;

if (!database || !auth) {
    console.error("Falha ao obter instâncias de Database ou Auth do Firebase. O app Firebase pode não ter sido inicializado corretamente.");
}

export { database, auth, app };
