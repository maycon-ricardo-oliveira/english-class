// src/utils/api.js
import { database } from './firebase'; // Importa a instância do database
import { ref, set, push, remove, update, get as getFirebaseData } from 'firebase/database';

/**
 * Adiciona um novo aluno para um professor específico no Firebase Realtime Database.
 * @param {string} teacherId - O ID do professor.
 * @param {object} studentData - Os dados do aluno (sem o ID, que será gerado).
 * @returns {Promise<string>} O ID do novo aluno criado.
 * @throws {Error} Se a escrita no DB falhar ou IDs não puderem ser gerados.
 */
export const addStudentToDb = async (teacherId, studentData) => {
  if (!teacherId) {
    throw new Error("ID do Professor é necessário para adicionar aluno.");
  }
  console.log(`api.js: Adicionando aluno para teacherId: ${teacherId}`);
  
  const studentNodePath = `teachersData/${teacherId}/students`;
  const newStudentRef = push(ref(database, studentNodePath));
  const newStudentId = newStudentRef.key;

  if (!newStudentId) {
    console.error("api.js: ERRO - Não foi possível gerar ID Firebase para o novo aluno.");
    throw new Error("Não foi possível gerar ID para o novo aluno.");
  }

  const studentWithId = { 
    ...studentData, 
    id: newStudentId,
    lessons: {} 
  };
  
  const fullPathToNewStudent = `${studentNodePath}/${newStudentId}`;
  try {
    await set(ref(database, fullPathToNewStudent), studentWithId);
    console.log(`api.js: Aluno ${newStudentId} adicionado ao DB para o professor: ${teacherId}`);
    return newStudentId;
  } catch (error) {
    console.error(`api.js: ERRO AO ESCREVER ALUNO NO FIREBASE (${fullPathToNewStudent}):`, error);
    throw new Error(`Falha ao salvar aluno no Firebase: ${error.message || 'Erro desconhecido.'}`);
  }
};

/**
 * Deleta um aluno do Firebase Realtime Database.
 * @param {string} teacherId - O ID do professor.
 * @param {string} studentId - O ID do aluno a ser deletado.
 * @returns {Promise<void>}
 * @throws {Error} Se a remoção falhar.
 */
export const deleteStudentFromDb = async (teacherId, studentId) => {
  if (!teacherId || !studentId) {
    throw new Error("IDs do Professor e do Aluno são necessários para deletar.");
  }
  console.log(`api.js: Deletando aluno ${studentId} do professor ${teacherId}`);
  try {
    await remove(ref(database, `teachersData/${teacherId}/students/${studentId}`));
    console.log(`api.js: Aluno ${studentId} deletado do DB.`);
  } catch (error) {
    console.error(`api.js: ERRO AO DELETAR ALUNO ${studentId}:`, error);
    throw new Error(`Falha ao deletar aluno: ${error.message || 'Erro desconhecido.'}`);
  }
};

/**
 * Adiciona uma nova aula para um aluno específico.
 * @param {string} teacherId - O ID do professor.
 * @param {string} studentId - O ID do aluno.
 * @param {object} aulaData - Os dados da aula (sem o ID).
 * @returns {Promise<string>} O ID da nova aula criada.
 * @throws {Error} Se a escrita falhar.
 */
export const addAulaToDb = async (teacherId, studentId, aulaData) => {
    if (!teacherId || !studentId) throw new Error("IDs do Professor e Aluno são necessários.");

    const aulaNodePath = `teachersData/${teacherId}/students/${studentId}/lessons`;
    const newAulaRef = push(ref(database, aulaNodePath));
    const newLessonId = newAulaRef.key;

    if (!newLessonId) throw new Error("Não foi possível gerar ID para a nova aula.");
    
    const newAula = { ...aulaData, id: newLessonId };
    try {
        await set(ref(database, `${aulaNodePath}/${newLessonId}`), newAula);
        console.log(`api.js: Aula ${newLessonId} adicionada para aluno ${studentId}`);
        return newLessonId;
    } catch (error) {
        console.error(`api.js: ERRO AO ADICIONAR AULA (${aulaNodePath}/${newLessonId}):`, error);
        throw new Error(`Falha ao salvar aula: ${error.message || 'Erro desconhecido.'}`);
    }
};

/**
 * Adiciona múltiplas aulas em lote para um aluno.
 * @param {string} teacherId - O ID do professor.
 * @param {string} studentId - O ID do aluno.
 * @param {Array<object>} aulas - Array de objetos de aula (sem IDs).
 * @returns {Promise<void>}
 * @throws {Error} Se a escrita falhar.
 */
export const addAulasLoteToDb = async (teacherId, studentId, aulas) => {
    if (!teacherId || !studentId) throw new Error("IDs do Professor e Aluno são necessários.");
    if (!Array.isArray(aulas) || aulas.length === 0) {
        console.warn("api.js: Nenhuma aula fornecida para adicionar em lote.");
        return;
    }

    const updates = {};
    const aulasBasePath = `teachersData/${teacherId}/students/${studentId}/lessons`;
    aulas.forEach(aula => {
      const newAulaRef = push(ref(database, aulasBasePath));
      if (newAulaRef.key) {
        updates[`${aulasBasePath}/${newAulaRef.key}`] = { ...aula, id: newAulaRef.key };
      }
    });

    if (Object.keys(updates).length === 0) {
        console.warn("api.js: Nenhuma aula para adicionar em lote após gerar IDs.");
        return;
    }
    try {
        await update(ref(database), updates);
        console.log(`api.js: ${Object.keys(updates).length} aulas adicionadas em lote para aluno ${studentId}`);
    } catch (error) {
        console.error(`api.js: ERRO AO ADICIONAR AULAS EM LOTE para aluno ${studentId}:`, error);
        throw new Error(`Falha ao salvar aulas em lote: ${error.message || 'Erro desconhecido.'}`);
    }
};

/**
 * Deleta uma aula específica.
 * @param {string} teacherId - O ID do professor.
 * @param {string} studentId - O ID do aluno.
 * @param {string} lessonId - O ID da aula a ser deletada.
 * @returns {Promise<void>}
 * @throws {Error} Se a remoção falhar.
 */
export const deleteAulaFromDb = async (teacherId, studentId, lessonId) => {
    if (!teacherId || !studentId || !lessonId) throw new Error("IDs do Professor, Aluno e Aula são necessários.");
    console.log(`api.js: Deletando aula ${lessonId} do aluno ${studentId}`);
    try {
        await remove(ref(database, `teachersData/${teacherId}/students/${studentId}/lessons/${lessonId}`));
        console.log(`api.js: Aula ${lessonId} deletada.`);
    } catch (error) {
        console.error(`api.js: ERRO AO DELETAR AULA ${lessonId}:`, error);
        throw new Error(`Falha ao deletar aula: ${error.message || 'Erro desconhecido.'}`);
    }
};

/**
 * Atualiza o status de uma aula específica.
 * @param {string} teacherId - O ID do professor.
 * @param {string} studentId - O ID do aluno.
 * @param {string} lessonId - O ID da aula.
 * @param {string} newStatus - O novo status da aula.
 * @returns {Promise<void>}
 * @throws {Error} Se a atualização falhar ou as regras de status forem violadas.
 */
export const updateAulaStatusInDb = async (teacherId, studentId, lessonId, newStatus) => {
    if (!teacherId || !studentId || !lessonId || !newStatus) {
        throw new Error("IDs do Professor, Aluno, Aula e novo Status são necessários.");
    }
    
    const aulaPath = `teachersData/${teacherId}/students/${studentId}/lessons/${lessonId}`;
    const aulaRefPath = ref(database, aulaPath);
    
    console.log(`api.js: Atualizando status da aula ${lessonId} para ${newStatus}`);
    try {
        const aulaSnapshot = await getFirebaseData(aulaRefPath); // Usa getFirebaseData importado
        if (!(aulaSnapshot && typeof aulaSnapshot.exists === 'function' && aulaSnapshot.exists())) { 
            throw new Error("Aula não encontrada para atualizar status."); 
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
        console.log(`api.js: Status da aula ${lessonId} atualizado para ${newStatus}.`);
    } catch (error) {
        console.error(`api.js: ERRO AO ATUALIZAR STATUS DA AULA ${lessonId}:`, error);
        if (error.message.includes("Aulas Completas ou Pagas") || error.message.includes("Aulas marcadas como Falta")) {
            throw error;
        }
        throw new Error(`Falha ao atualizar status da aula: ${error.message || 'Erro desconhecido.'}`);
    }
};
