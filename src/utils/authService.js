// src/utils/authService.js
import { auth, database } from './firebase'; // Importa as instâncias de auth e database
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, // Adicionada esta importação
  signOut as firebaseSignOut
} from 'firebase/auth';
import { ref, set } from 'firebase/database';

/**
 * Regista um novo professor no Firebase Authentication e
 * guarda os dados iniciais do professor no Realtime Database.
 * @param {string} name - Nome do professor.
 * @param {string} email - Email do professor.
 * @param {string} password - Senha do professor.
 * @returns {Promise<import('firebase/auth').User>} O objeto User do Firebase Auth.
 * @throws {Error} Se o registo ou a escrita no DB falhar.
 */
export const registerTeacherInFirebase = async (name, email, password) => {
  console.log("authService.js: Tentando registar professor com email:", email);
  try {
    // 1. Criar utilizador no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("authService.js: Utilizador criado no Firebase Auth com UID:", user.uid);

    // 2. Preparar dados para o Realtime Database
    const newTeacherData = {
      id: user.uid, 
      name: name.trim(),
      email: user.email, 
      students: {}, 
    };

    // 3. Salvar os dados do professor no Realtime Database
    await set(ref(database, `teachersData/${user.uid}`), newTeacherData);
    console.log("authService.js: Dados do professor salvos no Realtime Database para UID:", user.uid);

    return user;
  } catch (error) {
    console.error("Erro detalhado em registerTeacherInFirebase (src/utils/authService.js):", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este email já está em uso.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('O formato do email é inválido.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Registo com email/senha não está habilitado no Firebase.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Erro de rede. Verifique a sua ligação à internet.');
    }
    throw new Error(error.message || "Erro desconhecido ao registar. Verifique a configuração do Firebase.");
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
  console.log("authService.js: Tentando login com email:", email);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("authService.js: Utilizador logado com Firebase Auth:", userCredential.user.uid);
    // Os dados do Realtime Database serão buscados pelo listener no store/contexto
    return userCredential.user; // Retorna o objeto user completo do Firebase Auth
  } catch (error) {
    console.error("Erro detalhado em handleFirebaseLogin (src/utils/authService.js):", error);
    if (error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' || // Adicionado para cobrir mais casos de login inválido
        error.code === 'auth/invalid-email') {
      throw new Error('Email ou senha inválidos.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Erro de rede. Verifique a sua ligação à internet.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Muitas tentativas de login falhadas. Tente novamente mais tarde.');
    }
    throw new Error(error.message || "Erro desconhecido ao fazer login. Verifique a configuração do Firebase.");
  }
};

/**
 * Desloga o usuário atual do Firebase Authentication.
 * @throws {Error} Se o logout falhar.
 */
export const handleFirebaseLogout = async () => {
    console.log("authService.js: Iniciando handleFirebaseLogout.");
    try {
        await firebaseSignOut(auth); // Usa o signOut importado e renomeado
        console.log("authService.js: Utilizador deslogado do Firebase Auth com sucesso.");
    } catch (error) {
        console.error("Erro ao fazer logout (utils/authService.js):", error);
        throw new Error(error.message || "Erro ao fazer logout.");
    }
};
