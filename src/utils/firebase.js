// src/utils/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; // Importar getAuth

// Cole aqui o objeto firebaseConfig que você copiou do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDxmjKJjZ1VKamCfnPtNYVH7mx0BFseSGE",
  authDomain: "class-flow-66e40.firebaseapp.com",
  databaseURL: "https://class-flow-66e40-default-rtdb.firebaseio.com",
  projectId: "class-flow-66e40",
  storageBucket: "class-flow-66e40.firebasestorage.app",
  messagingSenderId: "963919988704",
  appId: "1:963919988704:web:d5f8fc31334346cd748d85",
  measurementId: "G-BHX2T5LTLE"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); // Inicializa e exporta o Auth

export { database, app, auth }; // Exporta auth
