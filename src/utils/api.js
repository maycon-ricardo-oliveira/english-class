// src/utils/api.js
import { database } from './firebase';
import { ref, set, push, remove, update, get as getFirebaseData } from 'firebase/database';

/**
 * Cria a entrada inicial de dados para um novo professor no Firebase Realtime Database.
 * @param {string} uid - O UID do professor.
 * @param {string} name - O nome do professor.
 * @param {string} email - O email do professor.
 * @returns {Promise<void>}
 */
export const createTeacherDbEntry = async (uid, name, email) => {
  if (!uid || !name || !email) {
    throw new Error("UID, nome e email são necessários para criar a entrada do professor no DB.");
  }
  const teacherData = {
    id: uid,
    name: name.trim(),
    email: email.toLowerCase(),
    students: {}, // students é um objeto para armazenar múltiplos alunos
  };
  const teacherNodePath = `teachersData/${uid}`;
  try {
    await set(ref(database, teacherNodePath), teacherData);
    console.log(`api.js: Entrada no DB criada para professor: ${uid}`);
  } catch (error) {
    console.error(`api.js: ERRO AO CRIAR ENTRADA DO PROFESSOR NO DB (${teacherNodePath}):`, error);
    throw new Error(`Falha ao criar dados do professor: ${error.message || 'Erro desconhecido.'}`);
  }
};

/**
 * Adiciona um novo aluno para um professor específico.
 * @param {string} teacherId - O ID do professor.
 * @param {object} studentPayload - Dados do aluno com nomes de propriedade em inglês.
 * Ex: { name, studentEmail, lessonLink, lessonValue, paymentDay }
 * @returns {Promise<string>} O ID do novo aluno criado.
 */
export const addStudentToDb = async (teacherId, studentPayload) => {
  if (!teacherId) {
    throw new Error("ID do Professor é necessário para adicionar aluno.");
  }
  if (!studentPayload || !studentPayload.name) {
    throw new Error("Dados do aluno, incluindo nome, são necessários.");
  }
  console.log(`api.js: Adicionando aluno para teacherId: ${teacherId}`, studentPayload);
  
  const studentNodePath = `teachersData/${teacherId}/students`;
  const newStudentRef = push(ref(database, studentNodePath));
  const newStudentId = newStudentRef.key;

  if (!newStudentId) {
    throw new Error("Não foi possível gerar ID Firebase para o novo aluno.");
  }

  const studentDataForDb = { 
    id: newStudentId,
    name: studentPayload.name.trim(),
    studentEmail: studentPayload.studentEmail || null, // Novo campo
    lessonLink: studentPayload.lessonLink || null,   // Novo campo
    lessonValue: studentPayload.lessonValue || 0,
    paymentDay: studentPayload.paymentDay || null,
    lessons: {} // Lições/aulas começam como objeto vazio
  };
  
  const fullPathToNewStudent = `${studentNodePath}/${newStudentId}`;
  try {
    await set(ref(database, fullPathToNewStudent), studentDataForDb);
    console.log(`api.js: Aluno ${newStudentId} adicionado ao DB para o professor: ${teacherId}`);
    return newStudentId;
  } catch (error) {
    console.error(`api.js: ERRO AO ESCREVER ALUNO NO FIREBASE (${fullPathToNewStudent}):`, error);
    throw new Error(`Falha ao salvar aluno: ${error.message || 'Erro desconhecido.'}`);
  }
};

/**
 * Atualiza os dados de um aluno existente no Firebase Realtime Database.
 * @param {string} teacherId - O ID do professor.
 * @param {string} studentId - O ID do aluno a ser atualizado.
 * @param {object} studentPayload - Os dados do aluno a serem atualizados.
 * @returns {Promise<void>}
 * @throws {Error} Se a atualização falhar.
 */
export const updateStudentInDb = async (teacherId, studentId, studentPayload) => {
  if (!teacherId || !studentId) {
    throw new Error("IDs do Professor e do Aluno são necessários para atualizar.");
  }
  if (!studentPayload) {
    throw new Error("Dados para atualização do aluno são necessários.");
  }
  console.log(`api.js: Atualizando aluno ${studentId} para o professor ${teacherId}`);

  const studentNodePath = `teachersData/${teacherId}/students/${studentId}`;
  const studentRef = ref(database, studentNodePath);

  // Prepara os dados para atualização. O método 'update' só modifica os campos fornecidos.
  const dataToUpdate = {
    name: studentPayload.name.trim(),
    studentEmail: studentPayload.studentEmail || null,
    lessonLink: studentPayload.lessonLink || null,
    lessonValue: studentPayload.lessonValue || 0,
    paymentDay: studentPayload.paymentDay || null,
  };

  try {
    await update(studentRef, dataToUpdate);
    console.log(`api.js: Aluno ${studentId} atualizado com sucesso.`);
  } catch (error) {
    console.error(`api.js: ERRO AO ATUALIZAR ALUNO NO FIREBASE (${studentNodePath}):`, error);
    throw new Error(`Falha ao atualizar aluno: ${error.message || 'Erro desconhecido.'}`);
  }
};

/**
 * Deleta um aluno.
 * @param {string} teacherId
 * @param {string} studentId
 */
export const deleteStudentFromDb = async (teacherId, studentId) => {
  if (!teacherId || !studentId) throw new Error("IDs do Professor e do Aluno são necessários.");
  await remove(ref(database, `teachersData/${teacherId}/students/${studentId}`));
  console.log(`api.js: Aluno ${studentId} deletado do DB do professor ${teacherId}.`);
};

/**
 * Adiciona uma nova lesson (aula) para um aluno.
 * @param {string} teacherId
 * @param {string} studentId
 * @param {object} lessonPayload - Dados da lesson com nomes de propriedade em inglês.
 * Ex: { date, time, duration, value, status }
 * @returns {Promise<string>} O ID da nova lesson criada.
 */
export const addLessonToDb = async (teacherId, studentId, lessonPayload) => {
    if (!teacherId || !studentId) throw new Error("IDs do Professor e Aluno são necessários.");
    if (!lessonPayload || !lessonPayload.date || !lessonPayload.time) { // Validação mínima
        throw new Error("Dados da lesson, incluindo data e hora, são necessários.");
    }

    const lessonNodePath = `teachersData/${teacherId}/students/${studentId}/lessons`;
    const newLessonRef = push(ref(database, lessonNodePath));
    const newLessonId = newLessonRef.key;

    if (!newLessonId) throw new Error("Não foi possível gerar ID para a nova lesson.");
    
    const lessonDataForDb = { 
        id: newLessonId,
        date: lessonPayload.date,
        time: lessonPayload.time,
        duration: lessonPayload.duration || 60, // Duração em minutos
        value: lessonPayload.value || 0,
        status: lessonPayload.status || 'Pendente',
     };
    try {
        await set(ref(database, `${lessonNodePath}/${newLessonId}`), lessonDataForDb);
        console.log(`api.js: Lesson ${newLessonId} adicionada para aluno ${studentId}`);
        return newLessonId;
    } catch (error) {
        console.error(`api.js: ERRO AO ADICIONAR LESSON (${lessonNodePath}/${newLessonId}):`, error);
        throw new Error(`Falha ao salvar lesson: ${error.message || 'Erro desconhecido.'}`);
    }
};

/**
 * Adiciona múltiplas lessons (aulas) em lote para um aluno.
 * @param {string} teacherId
 * @param {string} studentId
 * @param {Array<object>} lessonsPayload - Array de objetos de lesson (sem IDs).
 */
export const addLessonsLoteToDb = async (teacherId, studentId, lessonsPayload) => {
    if (!teacherId || !studentId) throw new Error("IDs do Professor e Aluno são necessários.");
    if (!Array.isArray(lessonsPayload) || lessonsPayload.length === 0) {
        console.warn("api.js: Nenhuma lesson fornecida para adicionar em lote.");
        return;
    }

    const updates = {};
    const lessonsBasePath = `teachersData/${teacherId}/students/${studentId}/lessons`;
    lessonsPayload.forEach(lesson => {
      const newLessonRef = push(ref(database, lessonsBasePath));
      if (newLessonRef.key) {
        updates[`${lessonsBasePath}/${newLessonRef.key}`] = { 
            ...lesson, 
            id: newLessonRef.key,
            // Garante campos padrão se não fornecidos no payload
            duration: lesson.duration || 60,
            value: lesson.value || 0,
            status: lesson.status || 'Pendente'
        };
      }
    });

    if (Object.keys(updates).length === 0) {
        console.warn("api.js: Nenhuma lesson para adicionar em lote após gerar IDs.");
        return;
    }
    try {
        await update(ref(database), updates);
        console.log(`api.js: ${Object.keys(updates).length} lessons adicionadas em lote para aluno ${studentId}`);
    } catch (error) {
        console.error(`api.js: ERRO AO ADICIONAR LESSONS EM LOTE para aluno ${studentId}:`, error);
        throw new Error(`Falha ao salvar lessons em lote: ${error.message || 'Erro desconhecido.'}`);
    }
};

/**
 * Deleta uma lesson (aula) específica.
 * @param {string} teacherId
 * @param {string} studentId
 * @param {string} lessonId - O ID da lesson a ser deletada.
 */
export const deleteLessonFromDb = async (teacherId, studentId, lessonId) => {
    if (!teacherId || !studentId || !lessonId) throw new Error("IDs do Professor, Aluno e Lesson são necessários.");
    await remove(ref(database, `teachersData/${teacherId}/students/${studentId}/lessons/${lessonId}`));
    console.log(`api.js: Lesson ${lessonId} deletada do aluno ${studentId}.`);
};

/**
 * Atualiza o status de uma lesson (aula) específica.
 * @param {string} teacherId
 * @param {string} studentId
 * @param {string} lessonId
 * @param {string} newStatus
 */
export const updateLessonStatusInDb = async (teacherId, studentId, lessonId, newStatus) => {
    if (!teacherId || !studentId || !lessonId || !newStatus) {
        throw new Error("IDs e novo Status são necessários.");
    }
    
    const lessonPath = `teachersData/${teacherId}/students/${studentId}/lessons/${lessonId}`;
    const lessonRefPath = ref(database, lessonPath);
    
    try {
        const lessonSnapshot = await getFirebaseData(lessonRefPath);
        if (!(lessonSnapshot && typeof lessonSnapshot.exists === 'function' && lessonSnapshot.exists())) { 
            throw new Error("Lesson não encontrada para atualizar status."); 
        }
        const currentLesson = lessonSnapshot.val();
        const currentStatus = currentLesson.status || 'Pendente';

        if ((currentStatus === 'Completa' || currentStatus === 'Paga') && (newStatus === 'Falta' || newStatus === 'Pendente')) {
            throw new Error("Lessons Completas ou Pagas não podem ser marcadas como Falta ou Pendente.");
        }
        if (currentStatus === 'Falta' && (newStatus === 'Completa' || newStatus === 'Paga')) {
            throw new Error("Lessons marcadas como Falta não podem ser marcadas como Completa ou Paga.");
        }

        await update(lessonRefPath, { status: newStatus });
        console.log(`api.js: Status da lesson ${lessonId} atualizado para ${newStatus}.`);
    } catch (error) {
        console.error(`api.js: ERRO AO ATUALIZAR STATUS DA LESSON ${lessonId}:`, error);
        if (error.message.includes("Lessons Completas ou Pagas") || error.message.includes("Lessons marcadas como Falta")) {
            throw error;
        }
        throw new Error(`Falha ao atualizar status da lesson: ${error.message || 'Erro desconhecido.'}`);
    }
};
