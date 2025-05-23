'use client';

import React, { useState, useEffect } from 'react';
// A importação de useAppStore foi removida anteriormente
import { UserPlus, PlusCircle, X } from 'lucide-react';

export default function StudentForm({ 
  isOpen, 
  showToast, 
  onCloseModal, 
  // teacherIdOverride = null, // Esta prop não é mais usada aqui se addStudentAction lida com o teacherId
  addStudentAction 
}) {
  const [name, setName] = useState('');
  const [studentEmail, setStudentEmail] = useState(''); // Novo campo
  const [lessonLink, setLessonLink] = useState('');   // Novo campo
  const [lessonValue, setLessonValue] = useState(''); // Renomeado de valorAula
  const [paymentDay, setPaymentDay] = useState('');   // Renomeado de diaPagamento
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setName('');
        setStudentEmail('');
        setLessonLink('');
        setLessonValue('');
        setPaymentDay('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name.trim()) {
      if (showToast) showToast('O nome do aluno é obrigatório.', 'error');
      setIsSubmitting(false);
      return;
    }
    // Validação opcional para email
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

    if (typeof addStudentAction !== 'function') {
        console.error("StudentForm: A função addStudentAction não foi fornecida como prop.");
        if (showToast) showToast('Erro de configuração: Ação de adicionar aluno não disponível.', 'error');
        setIsSubmitting(false);
        return;
    }

    try {
      const studentPayload = {
        name: name.trim(),
        studentEmail: studentEmail.trim() || null, // Envia null se vazio
        lessonLink: lessonLink.trim() || null,     // Envia null se vazio
        lessonValue: lessonValueNum,
        paymentDay: paymentDayNum,
      };
      // A prop teacherIdOverride foi removida daqui,
      // a função addStudentAction (passada pela página pai) deve lidar com o teacherId correto.
      await addStudentAction(studentPayload); 
      if (showToast) showToast(`Aluno "${studentPayload.name}" adicionado com sucesso!`, 'success');
      
      if (onCloseModal) {
        onCloseModal();
      } else { 
        setName('');
        setStudentEmail('');
        setLessonLink('');
        setLessonValue('');
        setPaymentDay('');
      }
    } catch (err) {
      console.error("Erro ao adicionar aluno (StudentForm):", err);
      if (showToast) showToast(err.message || 'Erro desconhecido ao adicionar aluno.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8"> 
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center">
          <UserPlus className="mr-2 text-indigo-600 h-6 w-6" />
          Cadastrar Novo Aluno
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
            id="formStudentName" // ID alterado para consistência
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
            <label htmlFor="formLessonValue" className="block text-sm font-medium text-gray-800 mb-1">Valor/Aula (R$):</label> {/* Renomeado para formLessonValue */}
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
            <label htmlFor="formPaymentDay" className="block text-sm font-medium text-gray-800 mb-1">Dia de Pagamento (1-31):</label> {/* Renomeado para formPaymentDay */}
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
              {isSubmitting ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<PlusCircle className="mr-2 h-5 w-5" />)}
              {isSubmitting ? 'Adicionando...' : 'Adicionar Aluno'}
            </button>
            {onCloseModal && (<button type="button" onClick={onCloseModal} disabled={isSubmitting} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-5 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">Cancelar</button>)}
        </div>
      </form>
    </div>
  );
}
