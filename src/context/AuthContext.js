// src/context/AuthContext.js
'use client'; // Necessário para Context API com hooks no App Router

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { auth, database } from '../utils/firebase'; // Ajuste o caminho se necessário
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get as getFirebaseData, onValue } from 'firebase/database';
import { handleFirebaseLogout } from '../utils/authService'; // Para a função de logout

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Guarda o objeto user do Firebase Auth
  const [teacherData, setTeacherData] = useState(null); // Guarda os dados do Realtime DB
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Para o estado inicial de autenticação
  const [isLoadingData, setIsLoadingData] = useState(false); // Para carregar dados do DB
  const [teacherDataUnsubscribe, setTeacherDataUnsubscribe] = useState(null); // Para o listener do DB

  useEffect(() => {
    console.log("AuthContext: Configurando onAuthStateChanged listener...");
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: onAuthStateChanged disparado. User:", user ? user.uid : "Nenhum usuário");
      if (user) {
        setCurrentUser(user); // Define o usuário do Firebase Auth
        setIsLoadingData(true); // Começa a carregar dados do DB

        // Limpa listener de dados anterior, se houver
        if (teacherDataUnsubscribe) {
          console.log("AuthContext: Limpando listener de dados do professor anterior (onAuthStateChanged).");
          teacherDataUnsubscribe();
        }

        // Configura novo listener para os dados do professor no Realtime Database
        const teacherDataRef = ref(database, `teachersData/${user.uid}`);
        console.log(`AuthContext: Configurando listener onValue para teachersData/${user.uid}`);
        const newDbUnsubscribe = onValue(teacherDataRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("AuthContext: Dados do professor recebidos do DB (onValue):", data);
            setTeacherData({
              ...data,
              id: user.uid, // Garante que o ID é o UID do Auth
              email: user.email, // Garante que o email do Auth é usado
              name: data.name || user.displayName || user.email.split('@')[0],
              students: data.students ? Object.values(data.students).map(s => ({
                ...s,
                lessons: s.lessons ? Object.values(s.lessons) : []
              })) : []
            });
          } else {
            console.warn(`AuthContext: Dados do professor UID ${user.uid} não encontrados no DB (onValue). Pode ser um novo registro.`);
            // Se o nó não existe, mas o usuário está autenticado (ex: logo após registro),
            // a função registerTeacherInFirebase em authService.js já deve ter criado o nó.
            // Se ainda não existir, pode ser um problema ou um delay.
            // Por segurança, definimos um estado mínimo.
            setTeacherData({
                id: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                students: []
            });
          }
          setIsLoadingData(false);
        }, (error) => {
          console.error("AuthContext: Erro no listener onValue para dados do professor:", error);
          setTeacherData(null);
          setIsLoadingData(false);
        });
        setTeacherDataUnsubscribe(() => newDbUnsubscribe); // Guarda a função de unsubscribe do DB

      } else {
        // Usuário deslogado
        if (teacherDataUnsubscribe) {
          console.log("AuthContext: Limpando listener de dados do professor (onAuthStateChanged -> logout).");
          teacherDataUnsubscribe();
          setTeacherDataUnsubscribe(null);
        }
        setCurrentUser(null);
        setTeacherData(null);
        setIsLoadingData(false);
      }
      setIsLoadingAuth(false); // Marca que a verificação inicial de autenticação terminou
    });

    // Limpa o listener de autenticação quando o AuthProvider desmontar
    return () => {
      console.log("AuthContext: Limpando onAuthStateChanged listener.");
      unsubscribeAuth();
      if (teacherDataUnsubscribe) { // Limpa também o listener do DB se ainda existir
        console.log("AuthContext: Limpando listener de dados do professor (desmonte do AuthProvider).");
        teacherDataUnsubscribe();
      }
    };
  }, []); // Array de dependências vazio para rodar apenas uma vez

  const logout = async () => {
    try {
      await handleFirebaseLogout();
      // O onAuthStateChanged cuidará de limpar currentUser, teacherData, etc.
    } catch (error) {
      console.error("Erro no logout (AuthContext):", error);
      // Tratar o erro de logout, talvez com um toast
      throw error; // Relança para o componente que chamou
    }
  };

  // O valor fornecido pelo contexto
  const value = useMemo(() => ({
    currentUser,      // Objeto user do Firebase Auth (ou null)
    teacherData,      // Dados do professor do Realtime DB (ou null)
    isLoadingAuth,    // Booleano: true enquanto onAuthStateChanged não rodou pela primeira vez
    isLoadingData,    // Booleano: true enquanto teacherData está a ser carregado do DB
    logout,           // Função para deslogar
    // Adicione aqui outras funções ou estados que queira expor, ex: login, register
    // mas por enquanto, as páginas de login/registro chamam diretamente as funções do authService.js
  }), [currentUser, teacherData, isLoadingAuth, isLoadingData]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook customizado para usar o AuthContext.
 * @returns O valor do AuthContext.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};