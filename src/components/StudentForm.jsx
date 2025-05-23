'use client'; // Necessário para hooks

import React, { useState, useEffect } from 'react';
// A importação de useAppStore foi removida
// import useAppStore from '../store/useAppStore'; 
import { UserPlus, PlusCircle, X } from 'lucide-react'; // Ícones

// Recebe isOpen, showToast, onCloseModal, teacherIdOverride e a nova prop addStudentAction
export default function StudentForm({ 
  isOpen, 
  showToast, 
  onCloseModal, 
  teacherIdOverride = null, 
  addStudentAction // Nova prop para a função de adicionar aluno
}) {
  // Estados locais para os campos do formulário
  const [nomeAluno, setNomeAluno] = useState('');
  const [valorAula, setValorAula] = useState('');
  const [diaPagamento, setDiaPagamento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para limpar o formulário quando o modal é aberto (prop isOpen muda para true)
  useEffect(() => {
    if (isOpen) {
        setNomeAluno('');
        setValorAula('');
        setDiaPagamento('');
        // Se houvesse um estado de erro local, também seria resetado aqui.
    }
  }, [isOpen]);

  // Lida com o submit do formulário
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

    // Verifica se a função addStudentAction foi passada como prop
    if (typeof addStudentAction !== 'function') {
        console.error("StudentForm: A função addStudentAction não foi fornecida como prop.");
        if (showToast) showToast('Erro de configuração: Ação de adicionar aluno não disponível.', 'error');
        setIsSubmitting(false);
        return;
    }

    try {
      const studentData = {
        nome: nomeAluno.trim(),
        valorAula: valorAulaNum,
        diaPagamento: diaPagamentoNum,
      };
      // Chama a função addStudentAction passada via props
      await addStudentAction(studentData, teacherIdOverride); 
      if (showToast) showToast(`Aluno "${studentData.nome}" adicionado com sucesso!`, 'success');
      
      if (onCloseModal) {
        onCloseModal();
      } else { 
        // Se não estiver num modal, apenas limpa o formulário (caso de uso na DbTestPage sem modal)
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
    <div className="p-6 sm:p-8"> 
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center">
          <UserPlus className="mr-2 text-indigo-600 h-6 w-6" />
          {teacherIdOverride ? 'Cadastrar Aluno (Teste DB)' : 'Cadastrar Novo Aluno'}
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
          <label
            htmlFor="formModalNomeAluno"
            className="block text-sm font-medium text-gray-800 mb-1"
          >
            Nome do Aluno:
          </label>
          <input
            type="text"
            id="formModalNomeAluno"
            value={nomeAluno}
            onChange={(e) => setNomeAluno(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Nome completo do aluno"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="formModalValorAula"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Valor Padrão/Aula (R$):
            </label>
            <input
              type="number"
              id="formModalValorAula"
              value={valorAula}
              onChange={(e) => setValorAula(e.target.value)}
              step="0.01" min="0.01" required disabled={isSubmitting} placeholder="Ex: 50.00"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="formModalDiaPagamento"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Dia de Pagamento (1-31):
            </label>
            <input
              type="number"
              id="formModalDiaPagamento"
              value={diaPagamento}
              onChange={(e) => setDiaPagamento(e.target.value)}
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