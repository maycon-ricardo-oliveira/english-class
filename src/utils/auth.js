// src/utils/auth.js
import { auth, database } from './firebase'; // Importa as instâncias de auth e database
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut // Renomeia para evitar conflito se houver signOut local
} from 'firebase/auth';
import { ref, set } from 'firebase/database';

/**
 * Registra um novo professor no Firebase Authentication e
 * salva os dados iniciais do professor no Realtime Database.
 * @param {string} name - Nome do professor.
 * @param {string} email - Email do professor.
 * @param {string} password - Senha do professor.
 * @returns {Promise<import('firebase/auth').User>} O objeto User do Firebase Auth.
 * @throws {Error} Se o registro ou a escrita no DB falhar.
 */
export const handleFirebaseRegister = async (name, email, password) => {
  console.log("auth.js: Tentando registrar com", email);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("auth.js: Usuário criado no Firebase Auth:", user.uid);

    // Salva dados adicionais do professor no Realtime Database
    const newTeacherData = {
      id: user.uid, // Usa o UID do Firebase Auth como ID
      name,
      email: user.email, // Usa o email do Auth como fonte da verdade
      students: {}, // Inicializa students como um objeto vazio para o Firebase
    };
    await set(ref(database, `teachersData/${user.uid}`), newTeacherData);
    console.log("auth.js: Dados do professor salvos no Realtime Database para UID:", user.uid);
    return user; // Retorna o objeto user do Firebase Auth
  } catch (error) {
    console.error("Erro detalhado no handleFirebaseRegister (utils/auth.js):", error);
    // Converte códigos de erro do Firebase para mensagens amigáveis
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este email já está em uso.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('O formato do email é inválido.');
    } else if (error.code === 'auth/operation-not-allowed') {
      // Este erro geralmente significa que o método de login por email/senha não está habilitado no console do Firebase.
      throw new Error('Login com email/senha não está habilitado no Firebase.');
    } else if (error.code === 'auth/configuration-not-found') {
      console.error("ERRO CRÍTICO DE CONFIGURAÇÃO EM handleFirebaseRegister (utils/auth.js): auth/configuration-not-found.");
      throw new Error('Erro de configuração do Firebase. Verifique o console e o arquivo firebase.js.');
    }
    // Para outros erros, lança a mensagem original do Firebase ou uma genérica
    throw new Error(error.message || "Erro desconhecido ao registrar.");
  }
};

/**
 * Autentica um professor usando Firebase Authentication.
 * @param {string} email - Email do professor.
 * @param {string} password - Senha do professor.
 * @returns {Promise<import('firebase/auth').User>} O objeto User do Firebase Auth.
 * @throws {Error} Se o login falhar.
 */
export const handleFirebaseLogin = async (email, password) => {
  console.log("auth.js: Tentando login com", email);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("auth.js: Usuário logado com Firebase Auth:", userCredential.user.uid);
    // Os dados do Realtime Database serão buscados pelo listener no store
    return userCredential.user; // Retorna o objeto user do Firebase Auth
  } catch (error) {
    console.error("Erro detalhado no handleFirebaseLogin (utils/auth.js):", error);
    if (error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/invalid-credential' || // Novo código de erro para credenciais inválidas
        error.code === 'auth/invalid-email') {
      throw new Error('Email ou senha inválidos.');
    } else if (error.code === 'auth/configuration-not-found') {
      console.error("ERRO CRÍTICO DE CONFIGURAÇÃO EM handleFirebaseLogin (utils/auth.js): auth/configuration-not-found.");
      throw new Error('Erro de configuração do Firebase. Verifique o console e o arquivo firebase.js.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Erro de rede. Verifique sua conexão com a internet.');
    }
    // Para outros erros, lança a mensagem original do Firebase ou uma genérica
    throw new Error(error.message || "Erro desconhecido ao fazer login.");
  }
};

/**
 * Desloga o usuário atual do Firebase Authentication.
 * @throws {Error} Se o logout falhar.
 */
export const handleFirebaseLogout = async () => {
  try {
    await firebaseSignOut(auth); // Usa o signOut importado e renomeado
    console.log("auth.js: Usuário deslogado do Firebase Auth.");
  } catch (error) {
    console.error("Erro ao fazer logout (utils/auth.js):", error);
    throw new Error(error.message || "Erro ao fazer logout.");
  }
};