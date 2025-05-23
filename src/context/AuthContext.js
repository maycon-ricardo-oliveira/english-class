// src/context/AuthContext.js
'use client'; 

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { auth, database } from '../utils/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, set as firebaseSet } from 'firebase/database'; // Renomeado 'set' para 'firebaseSet' para evitar conflito
import { handleFirebaseLogout } from '../utils/authService'; 

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); 
  const [teacherData, setTeacherData] = useState(null); 
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  const [isLoadingData, setIsLoadingData] = useState(false); 
  const [teacherDataUnsubscribe, setTeacherDataUnsubscribe] = useState(null);

  useEffect(() => {
    console.log("AuthContext: Configurando onAuthStateChanged listener...");
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: onAuthStateChanged disparado. User:", user ? user.uid : "Nenhum usuário");
      if (user) {
        setCurrentUser(user); 
        // Não definimos isLoadingAuth para false aqui imediatamente,
        // esperamos que teacherData seja carregado ou a tentativa de carregar termine.
        // No entanto, para o guardião de rota, isLoadingAuth deve ser false quando o user é determinado.
        setIsLoadingAuth(false); // Auth state determinado
        setIsLoadingData(true);  // Começa a carregar dados do DB

        if (teacherDataUnsubscribe) {
          console.log("AuthContext: Limpando listener de dados do professor anterior (onAuthStateChanged).");
          teacherDataUnsubscribe();
        }

        const teacherDataRef = ref(database, `teachersData/${user.uid}`);
        console.log(`AuthContext: Configurando listener onValue para teachersData/${user.uid}`);
        const newDbUnsubscribe = onValue(teacherDataRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("AuthContext: Dados do professor recebidos do DB (onValue):", data);
            setTeacherData({
              ...data,
              id: user.uid, 
              email: user.email, 
              name: data.name || user.displayName || user.email.split('@')[0],
              students: data.students ? Object.values(data.students).map(s => ({
                ...s,
                lessons: s.lessons ? Object.values(s.lessons) : [] 
              })) : []
            });
          } else {
            console.warn(`AuthContext: Dados do professor UID ${user.uid} não encontrados no DB (onValue). Criando perfil básico...`);
            // Cria um perfil básico se não existir (ex: logo após o registro)
            const basicProfile = {
                id: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                students: {} // Começa como objeto vazio para Firebase
            };
            firebaseSet(ref(database, `teachersData/${user.uid}`), basicProfile)
                .then(() => {
                    console.log("AuthContext: Perfil básico criado no DB para", user.uid);
                    // O listener onValue será acionado novamente com os novos dados
                    // e isLoadingData será definido como false lá.
                    // Se não, definimos aqui, mas o ideal é o listener tratar.
                    // setTeacherData({ ...basicProfile, students: [] }); // Converte para array
                })
                .catch(error => {
                    console.error("AuthContext: Erro ao criar perfil básico no DB:", error);
                    setTeacherData(null); // Falha ao criar, dados nulos
                })
                .finally(() => {
                     // Mesmo que a criação do perfil básico falhe ou o listener demore,
                     // é importante setar isLoadingData para false após a tentativa.
                     // No entanto, o listener onValue deve idealmente tratar isso.
                     // Se snapshot.exists() é false, onValue já chamou o callback e definiu isLoadingData.
                });
            // Se o nó não existe, o primeiro onValue o tratará e definirá teacherData
            // e isLoadingData = false.
          }
          setIsLoadingData(false); // Marca que o carregamento/tentativa dos dados do DB terminou
        }, (error) => {
          console.error("AuthContext: Erro no listener onValue para dados do professor:", error);
          setTeacherData(null);
          setIsLoadingData(false);
        });
        setTeacherDataUnsubscribe(() => newDbUnsubscribe);

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
        setIsLoadingAuth(false); // Marca que a verificação inicial de autenticação terminou
      }
    });

    return () => {
      console.log("AuthContext: Limpando onAuthStateChanged listener.");
      unsubscribeAuth();
      if (teacherDataUnsubscribe) { 
        console.log("AuthContext: Limpando listener de dados do professor (desmonte do AuthProvider).");
        teacherDataUnsubscribe();
      }
    };
  }, []); // teacherDataUnsubscribe foi removido das dependências para evitar loops

  const logout = async () => {
    try {
      await handleFirebaseLogout();
      // O onAuthStateChanged cuidará de limpar currentUser, teacherData, etc.
    } catch (error) {
      console.error("Erro no logout (AuthContext):", error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    currentUser,
    teacherData,
    isLoadingAuth,
    isLoadingData,
    logout,
  }), [currentUser, teacherData, isLoadingAuth, isLoadingData]); // Removido logout das dependências pois é estável

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
