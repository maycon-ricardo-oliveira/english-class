// src/store/useAppStore.js
import { create } from 'zustand';
import { database, auth } from '../utils/firebase';
import {
  // Funções de autenticação não são mais importadas diretamente aqui
  // Elas serão chamadas a partir das funções em utils/auth.js
  onAuthStateChanged
} from 'firebase/auth';
import {
  ref, set, update, remove, push, query, orderByChild, equalTo, onValue,
  get as getFirebaseData // Importa 'get' do Firebase como 'getFirebaseData'
} from 'firebase/database';

// Importa as funções de autenticação refatoradas
import {
  handleFirebaseRegister,
  handleFirebaseLogin,
  handleFirebaseLogout
} from '../utils/auth';

const useAppStore = create((set, getZustandState) => ({ // Renomeado 'get' do Zustand para 'getZustandState'
  loggedInTeacherId: null,
  loggedInTeacherData: null,
  isLoadingAuth: true,
  isLoadingData: false,
  authListenerUnsubscribe: null,
  teacherDataUnsubscribe: null,

  initializeAuthListener: () => {
    if (getZustandState().authListenerUnsubscribe) {
      console.log("Store: Listener de autenticação (onAuthStateChanged) já existe.");
      return getZustandState().authListenerUnsubscribe;
    }
    console.log("Store: Configurando initializeAuthListener (onAuthStateChanged)...");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Store: onAuthStateChanged disparado. User:", user ? user.uid : "Nenhum usuário");
      if (user) {
        set({ loggedInTeacherId: user.uid, isLoadingAuth: false, isLoadingData: true });
        console.log(`Store: Usuário Auth ${user.uid} detectado. Buscando dados do professor no Realtime DB...`);
        const teacherDataRef = ref(database, `teachersData/${user.uid}`);

        try {
          const snapshot = await getFirebaseData(teacherDataRef); // CORREÇÃO CRUCIAL AQUI
          console.log("Store: Snapshot de getFirebaseData(teacherDataRef) para UID", user.uid, ":", snapshot);

          if (snapshot && typeof snapshot.exists === 'function') {
            if (snapshot.exists()) {
              const data = snapshot.val();
              console.log("Store: Dados do professor encontrados no DB:", data);
              set({
                loggedInTeacherData: {
                  ...data,
                  id: user.uid,
                  email: user.email, // Prioriza email do Auth
                  name: data.name || user.displayName || user.email.split('@')[0],
                  students: data.students ? Object.values(data.students).map(s => ({
                    ...s,
                    aulas: s.aulas ? Object.values(s.aulas) : []
                  })) : []
                },
                isLoadingData: false
              });
              getZustandState().listenToLoggedInTeacherData(); // Inicia listener para dados do professor
            } else {
              console.warn(`Store: Dados do professor UID ${user.uid} não encontrados no DB após login/auth state change. Isso pode ocorrer se o registro não criou o nó no DB ou se foi deletado.`);
              // Se o usuário está autenticado mas não tem dados no DB,
              // podemos considerar um estado onde o perfil precisa ser completado ou foi um erro.
              // A função registerTeacherWithFirebase já deve ter criado o nó.
              // Se não criou, houve uma falha no registro.
              // Por segurança, definimos um estado mínimo para evitar que loggedInTeacherData seja null
              // e tentamos iniciar o listener de dados (que pode criar o nó se ausente).
              set({
                loggedInTeacherData: {
                    id: user.uid,
                    email: user.email,
                    name: user.displayName || user.email.split('@')[0],
                    students: []
                },
                isLoadingData: false
              });
              getZustandState().listenToLoggedInTeacherData(); // Tenta iniciar listener mesmo assim
            }
          } else {
            console.error("Store: Snapshot inválido ou 'exists' não é uma função ao buscar dados do professor. Snapshot:", snapshot);
            set({ isLoadingData: false, loggedInTeacherData: null });
          }
        } catch (dbError) {
          console.error(`Store: Erro ao buscar dados do professor ${user.uid} no DB:`, dbError);
          set({ isLoadingData: false, loggedInTeacherData: null });
        }
      } else {
        console.log("Store: Usuário deslogado via onAuthStateChanged.");
        const oldUnsubscribeData = getZustandState().teacherDataUnsubscribe;
        if (oldUnsubscribeData) {
          oldUnsubscribeData();
          set({ teacherDataUnsubscribe: null });
        }
        set({ loggedInTeacherId: null, loggedInTeacherData: null, isLoadingAuth: false, isLoadingData: false });
      }
    });
    set({ authListenerUnsubscribe: unsubscribe });
    return unsubscribe;
  },

  // Ações de Autenticação agora chamam as funções de utils/auth.js
  registerTeacher: async (name, email, password) => {
    console.log("Store: Chamando handleFirebaseRegister de utils/auth.js");
    // A função em utils/auth.js já cria o usuário no Auth e o nó no DB.
    // O onAuthStateChanged cuidará de atualizar o estado do store.
    return await handleFirebaseRegister(name, email, password);
  },

  loginTeacher: async (email, password) => {
    console.log("Store: Chamando handleFirebaseLogin de utils/auth.js");
    // A função em utils/auth.js apenas faz o login no Auth.
    // O onAuthStateChanged cuidará de buscar os dados do DB e atualizar o estado do store.
    return await handleFirebaseLogin(email, password);
  },

  logoutTeacher: async () => {
    console.log("Store: Chamando handleFirebaseLogout de utils/auth.js");
    // O listener de dados do professor (onValue) é limpo pelo onAuthStateChanged quando user se torna null
    // e também explicitamente aqui para garantir.
    const oldUnsubscribeData = getZustandState().teacherDataUnsubscribe;
    if (oldUnsubscribeData) {
      console.log("Store: Limpando listener de dados do professor (logoutTeacher).");
      oldUnsubscribeData();
      set({ teacherDataUnsubscribe: null });
    }
    await handleFirebaseLogout();
    // onAuthStateChanged limpará os estados loggedInTeacherId e loggedInTeacherData
    console.log("Store: Logout action completa.");
  },

  listenToLoggedInTeacherData: () => {
    const teacherId = getZustandState().loggedInTeacherId;
    let oldUnsubscribe = getZustandState().teacherDataUnsubscribe;

    if (oldUnsubscribe) { oldUnsubscribe(); set({ teacherDataUnsubscribe: null }); }
    if (!teacherId) {
      console.log("Store: Nenhum professor logado, não iniciando listener de dados (onValue).");
      return;
    }
    
    console.log(`Store: Iniciando listener de dados (onValue) para o professor ID: ${teacherId}`);
    const teacherDataRef = ref(database, `teachersData/${teacherId}`);
    const newUnsubscribe = onValue(teacherDataRef, (snapshot) => {
      console.log(`Store: Dados recebidos do listener onValue para ${teacherId}:`, snapshot.val());
      if (snapshot && typeof snapshot.exists === 'function' && snapshot.exists()) {
        const data = snapshot.val();
        set({
          loggedInTeacherData: {
            ...data,
            id: teacherId,
            email: data.email || auth.currentUser?.email,
            name: data.name || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0],
            students: data.students ? Object.values(data.students).map(s => ({
              ...s,
              aulas: s.aulas ? Object.values(s.aulas) : []
            })) : []
          },
          isLoadingData: false
        });
      } else {
        console.warn(`Store: Dados do professor UID ${teacherId} não encontrados no Realtime Database via onValue (snapshot.exists() é false ou snapshot inválido). Tentando criar perfil básico se for o usuário atual.`);
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === teacherId) {
            // Se o nó não existe, mas o usuário está autenticado, pode ser um novo registro
            // onde a criação do nó no DB falhou ou foi assíncrona.
            // A função registerTeacherWithFirebase já deve ter criado.
            // Se ainda não existe, criamos um perfil básico para evitar erros.
            const basicProfile = { id: teacherId, email: currentUser.email, name: currentUser.displayName || currentUser.email.split('@')[0], students: {} };
            set(ref(database, `teachersData/${teacherId}`), basicProfile)
                .then(() => {
                    console.log("Store: Perfil básico criado no DB via listener onValue.");
                    set({ loggedInTeacherData: { ...basicProfile, students: [] }, isLoadingData: false });
                })
                .catch(err => console.error("Store: Erro ao criar perfil básico no DB via listener onValue:", err));
        } else {
             set({ isLoadingData: false, loggedInTeacherData: null });
        }
      }
    }, (error) => {
      console.error(`Store: Erro no listener onValue para o professor ${teacherId}:`, error);
      set({ isLoadingData: false });
    });
    set({ teacherDataUnsubscribe: newUnsubscribe });
  },

  // Ações CRUD (addStudent, deleteStudent, addAula, etc.)
  addStudent: async (studentData) => {
    const teacherId = getZustandState().loggedInTeacherId;
    if (!teacherId) throw new Error("Professor não logado.");
    const studentRef = ref(database, `teachersData/${teacherId}/students`);
    const newStudentRef = push(studentRef);
    const newStudentId = newStudentRef.key;
    if (!newStudentId) throw new Error("Não foi possível gerar ID para o novo aluno.");
    const newStudent = { ...studentData, id: newStudentId, aulas: {} };
    await set(ref(database, `teachersData/${teacherId}/students/${newStudentId}`), newStudent);
  },
  deleteStudent: async (studentId) => {
    const teacherId = getZustandState().loggedInTeacherId;
    if (!teacherId) throw new Error("Professor não logado.");
    await remove(ref(database, `teachersData/${teacherId}/students/${studentId}`));
  },
  addAula: async (studentId, aulaData) => {
    const teacherId = getZustandState().loggedInTeacherId;
    if (!teacherId) throw new Error("Professor não logado.");
    const aulaRef = ref(database, `teachersData/${teacherId}/students/${studentId}/aulas`);
    const newAulaRef = push(aulaRef);
    const newAulaId = newAulaRef.key;
    if (!newAulaId) throw new Error("Não foi possível gerar ID para a nova aula.");
    const newAula = { ...aulaData, id: newAulaId };
    await set(ref(database, `teachersData/${teacherId}/students/${studentId}/aulas/${newAulaId}`), newAula);
  },
  addAulasLote: async (studentId, aulas) => {
    const teacherId = getZustandState().loggedInTeacherId;
    if (!teacherId) throw new Error("Professor não logado.");
    const updates = {};
    aulas.forEach(aula => {
      const aulaPath = `teachersData/${teacherId}/students/${studentId}/aulas`;
      const newAulaRef = push(ref(database, aulaPath));
      if (newAulaRef.key) {
        updates[`${aulaPath}/${newAulaRef.key}`] = { ...aula, id: newAulaRef.key };
      }
    });
    if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
    } else {
        console.warn("Nenhuma aula para adicionar em lote após gerar IDs.");
    }
  },
  deleteAula: async (studentId, aulaId) => {
    const teacherId = getZustandState().loggedInTeacherId;
    if (!teacherId) throw new Error("Professor não logado.");
    await remove(ref(database, `teachersData/${teacherId}/students/${studentId}/aulas/${aulaId}`));
  },
  updateAulaStatus: async (studentId, aulaId, newStatus) => {
    const teacherId = getZustandState().loggedInTeacherId;
    if (!teacherId) throw new Error("Professor não logado.");
    const aulaPath = `teachersData/${teacherId}/students/${studentId}/aulas/${aulaId}`;
    const aulaRefPath = ref(database, aulaPath);
    const aulaSnapshot = await getFirebaseData(aulaRefPath);
    if (!(aulaSnapshot && typeof aulaSnapshot.exists === 'function' && aulaSnapshot.exists())) { 
        throw new Error("Aula não encontrada para atualizar status ou snapshot inválido."); 
    }
    const aulaAtual = aulaSnapshot.val();
    const statusAtual = aulaAtual.status || 'Pendente';
    if ((statusAtual === 'Completa' || statusAtual === 'Paga') && (newStatus === 'Falta' || newStatus === 'Pendente')) {
        throw new Error("Aulas Completas ou Pagas não podem ser marcadas como Falta ou Pendente.");
    }
    if (statusAtual === 'Falta' && (newStatus === 'Completa' || newStatus === 'Paga')) {
        throw new Error("Aulas marcadas como Falta não podem ser marcadas como Completa ou Paga.");
    }
    await update(aulaRefPath, { status: newStatus });
  },

  getLoggedInTeacher: () => {
      return getZustandState().loggedInTeacherData;
  }
}));

export default useAppStore;