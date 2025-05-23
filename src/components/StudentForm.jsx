'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, PlusCircle, X } from 'lucide-react';

// Recebe isOpen, showToast, onCloseModal e a nova prop teacherIdOverride
export default function StudentForm({ isOpen, showToast, onCloseModal, teacherIdOverride = null }) {

  const [nomeAluno, setNomeAluno] = useState('');
  const [valorAula, setValorAula] = useState('');
  const [diaPagamento, setDiaPagamento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setNomeAluno('');
        setValorAula('');
        setDiaPagamento('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!nomeAluno.trim()) {
      if (showToast) showToast('O nome do aluno é obrigatório.', 'error');
      setIsSubmitting(false);
      return;
    }
    const valorAulaNum = parseFloat(valorAula);
    if (isNaN(valorAulaNum) || valorAulaNum <= 0) {
      if (showToast) showToast('O valor da aula deve ser um número positivo.', 'error');
      setIsSubmitting(false);
      return;
    }
    const diaPagamentoNum = parseInt(diaPagamento, 10);
    if (isNaN(diaPagamentoNum) || diaPagamentoNum < 1 || diaPagamentoNum > 31) {
      if (showToast) showToast('O dia de pagamento deve ser um número entre 1 e 31.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const studentData = {
        nome: nomeAluno.trim(),
        valorAula: valorAulaNum,
        diaPagamento: diaPagamentoNum,
      };
      // Passa teacherIdOverride para a ação do store
      await addStudentAction(studentData, teacherIdOverride); 
      if (showToast) showToast(`Aluno "${studentData.nome}" adicionado com sucesso!`, 'success');
      
      if (onCloseModal) {
        onCloseModal();
      } else { // Se não estiver em um modal, apenas limpa o formulário
        setNomeAluno('');
        setValorAula('');
        setDiaPagamento('');
      }
    } catch (err) {
      console.error("Erro ao adicionar aluno (StudentForm):", err);
      if (showToast) showToast(err.message || 'Erro desconhecido ao adicionar aluno.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <UserPlus className="mr-2 text-indigo-600 h-5 w-5" /> 
          {teacherIdOverride ? 'Cadastrar Aluno (Teste DB)' : 'Cadastrar Novo Aluno'}
        </h2>
        {onCloseModal && (
            <button
                type="button"
                onClick={onCloseModal}
                disabled={isSubmitting}
                className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                <X className="h-6 w-6" />
            </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="formModalNomeAluno" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Aluno:</label>
          <input
            type="text"
            id="formModalNomeAluno"
            value={nomeAluno}
            onChange={(e) => setNomeAluno(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Nome completo do aluno"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-700/50"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="formModalValorAula" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Padrão/Aula (R$):</label>
            <input
              type="number"
              id="formModalValorAula"
              value={valorAula}
              onChange={(e) => setValorAula(e.target.value)}
              step="0.01" min="0.01" required disabled={isSubmitting} placeholder="Ex: 50.00"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-700/50"
            />
          </div>
          <div>
            <label htmlFor="formModalDiaPagamento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dia de Pagamento (1-31):</label>
            <input
              type="number"
              id="formModalDiaPagamento"
              value={diaPagamento}
              onChange={(e) => setDiaPagamento(e.target.value)}
              min="1" max="31" required disabled={isSubmitting} placeholder="Ex: 10"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-700/50"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row-reverse sm:gap-3 pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {isSubmitting ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<PlusCircle className="mr-2 h-5 w-5" />)}
              {isSubmitting ? 'Adicionando...' : 'Adicionar Aluno'}
            </button>
            {onCloseModal && (<button type="button" onClick={onCloseModal} disabled={isSubmitting} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50">Cancelar</button>)}
        </div>
      </form>
    </div>
  );
}