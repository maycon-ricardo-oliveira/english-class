'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, PlusCircle, Save, X } from 'lucide-react'; // Adicionado Save

export default function StudentForm({ 
  isOpen, 
  showToast, 
  onCloseModal, 
  addStudentAction, // Para criar novo aluno
  updateStudentAction, // Nova prop para atualizar aluno existente
  initialData = null, // Dados iniciais para edição
  isEditMode = false   // Flag para indicar modo de edição
}) {
  const [name, setName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [lessonLink, setLessonLink] = useState('');
  const [lessonValue, setLessonValue] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setName(initialData.name || '');
        setStudentEmail(initialData.studentEmail || '');
        setLessonLink(initialData.lessonLink || '');
        setLessonValue(initialData.lessonValue || '');
        setPaymentDay(initialData.paymentDay || '');
      } else {
        // Reset para modo de criação ou se não houver initialData
        setName('');
        setStudentEmail('');
        setLessonLink('');
        setLessonValue('');
        setPaymentDay('');
      }
    }
  }, [isOpen, isEditMode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name.trim()) {
      if (showToast) showToast('O nome do aluno é obrigatório.', 'error');
      setIsSubmitting(false);
      return;
    }
    if (studentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim())) {
        if (showToast) showToast('Formato de email do aluno inválido.', 'error');
        setIsSubmitting(false);
        return;
    }
    const lessonValueNum = parseFloat(lessonValue);
    if (isNaN(lessonValueNum) || lessonValueNum <= 0) {
      if (showToast) showToast('O valor da aula deve ser um número positivo.', 'error');
      setIsSubmitting(false);
      return;
    }
    const paymentDayNum = parseInt(paymentDay, 10);
    if (isNaN(paymentDayNum) || paymentDayNum < 1 || paymentDayNum > 31) {
      if (showToast) showToast('O dia de pagamento deve ser um número entre 1 e 31.', 'error');
      setIsSubmitting(false);
      return;
    }

    const studentPayload = {
      name: name.trim(),
      studentEmail: studentEmail.trim() || null,
      lessonLink: lessonLink.trim() || null,
      lessonValue: lessonValueNum,
      paymentDay: paymentDayNum,
    };

    try {
      if (isEditMode) {
        if (typeof updateStudentAction !== 'function') {
          console.error("StudentForm: A função updateStudentAction não foi fornecida para o modo de edição.");
          if (showToast) showToast('Erro de configuração: Ação de atualizar aluno não disponível.', 'error');
          setIsSubmitting(false);
          return;
        }
        // Para edição, precisamos do ID do aluno, que deve estar em initialData
        if (!initialData || !initialData.id) {
            console.error("StudentForm: ID do aluno ausente nos dados iniciais para edição.");
            if (showToast) showToast('Erro: ID do aluno não encontrado para edição.', 'error');
            setIsSubmitting(false);
            return;
        }
        await updateStudentAction(initialData.id, studentPayload);
        if (showToast) showToast(`Aluno "${studentPayload.name}" atualizado com sucesso!`, 'success');
      } else {
        if (typeof addStudentAction !== 'function') {
          console.error("StudentForm: A função addStudentAction não foi fornecida para o modo de criação.");
          if (showToast) showToast('Erro de configuração: Ação de adicionar aluno não disponível.', 'error');
          setIsSubmitting(false);
          return;
        }
        await addStudentAction(studentPayload); 
        if (showToast) showToast(`Aluno "${studentPayload.name}" adicionado com sucesso!`, 'success');
      }
      
      if (onCloseModal) {
        onCloseModal();
      }
    } catch (err) {
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'adicionar'} aluno (StudentForm):`, err);
      if (showToast) showToast(err.message || `Erro desconhecido ao ${isEditMode ? 'atualizar' : 'adicionar'} aluno.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8"> 
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center">
          {isEditMode ? <Save className="mr-2 text-indigo-600 h-6 w-6" /> : <UserPlus className="mr-2 text-indigo-600 h-6 w-6" />}
          {isEditMode ? 'Editar Dados do Aluno' : 'Cadastrar Novo Aluno'}
        </h2>
        {onCloseModal && (
            <button
                type="button"
                onClick={onCloseModal}
                disabled={isSubmitting}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                <X className="h-6 w-6" />
            </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="formStudentName" className="block text-sm font-medium text-gray-800 mb-1">Nome do Aluno:</label>
          <input
            type="text"
            id="formStudentName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Nome completo do aluno"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="formStudentEmail" className="block text-sm font-medium text-gray-800 mb-1">Email do Aluno (Opcional):</label>
          <input
            type="email"
            id="formStudentEmail"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            disabled={isSubmitting}
            placeholder="email@aluno.com"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="formLessonLink" className="block text-sm font-medium text-gray-800 mb-1">Link Padrão da Aula (Opcional):</label>
          <input
            type="url"
            id="formLessonLink"
            value={lessonLink}
            onChange={(e) => setLessonLink(e.target.value)}
            disabled={isSubmitting}
            placeholder="https://exemplo.com/aula"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="formLessonValue" className="block text-sm font-medium text-gray-800 mb-1">Valor/Aula (R$):</label>
            <input
              type="number"
              id="formLessonValue"
              value={lessonValue}
              onChange={(e) => setLessonValue(e.target.value)}
              step="0.01" min="0.01" required disabled={isSubmitting} placeholder="Ex: 50.00"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label htmlFor="formPaymentDay" className="block text-sm font-medium text-gray-800 mb-1">Dia de Pagamento (1-31):</label>
            <input
              type="number"
              id="formPaymentDay"
              value={paymentDay}
              onChange={(e) => setPaymentDay(e.target.value)}
              min="1" max="31" required disabled={isSubmitting} placeholder="Ex: 10"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row-reverse sm:gap-3 pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition-opacity">
              {isSubmitting ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) 
                           : (isEditMode ? <Save className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />)
              }
              {isSubmitting ? (isEditMode ? 'Salvando...' : 'Adicionando...') : (isEditMode ? 'Salvar Alterações' : 'Adicionar Aluno')}
            </button>
            {onCloseModal && (<button type="button" onClick={onCloseModal} disabled={isSubmitting} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-5 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">Cancelar</button>)}
        </div>
      </form>
    </div>
  );
}