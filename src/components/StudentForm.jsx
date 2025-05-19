'use client'; // Necessário para hooks

import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore'; // Ajuste o caminho se necessário
import { UserPlus, PlusCircle, X } from 'lucide-react'; // Ícones (X adicionado)

// Recebe showToast e a nova prop onCloseModal
export default function StudentForm({ showToast, onCloseModal }) {
  // Ação do store para adicionar aluno
  const addStudent = useAppStore((state) => state.addStudent);

  // Estados locais para os campos do formulário
  const [nomeAluno, setNomeAluno] = useState('');
  const [valorAula, setValorAula] = useState('');
  const [diaPagamento, setDiaPagamento] = useState('');

  // Efeito para limpar o formulário se o modal for fechado e reaberto
  // ou se a prop onCloseModal mudar (indicando que o modal pode ter sido fechado por fora)
  useEffect(() => {
    if (onCloseModal) { // Verifica se a prop existe, indicando que está em um modal
        setNomeAluno('');
        setValorAula('');
        setDiaPagamento('');
    }
  }, [onCloseModal]);


  // Lida com o submit do formulário
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validações básicas
    if (!nomeAluno.trim()) {
      showToast('O nome do aluno é obrigatório.', 'error');
      return;
    }
    const valorAulaNum = parseFloat(valorAula);
    if (isNaN(valorAulaNum) || valorAulaNum <= 0) {
      showToast('O valor da aula deve ser um número positivo.', 'error');
      return;
    }
    const diaPagamentoNum = parseInt(diaPagamento, 10);
    if (isNaN(diaPagamentoNum) || diaPagamentoNum < 1 || diaPagamentoNum > 31) {
      showToast('O dia de pagamento deve ser um número entre 1 e 31.', 'error');
      return;
    }

    try {
      const studentData = {
        nome: nomeAluno.trim(),
        valorAula: valorAulaNum,
        diaPagamento: diaPagamentoNum,
      };
      addStudent(studentData);
      showToast(`Aluno "${studentData.nome}" adicionado com sucesso!`, 'success');
      // Limpa os campos do formulário
      setNomeAluno('');
      setValorAula('');
      setDiaPagamento('');
      if (onCloseModal) { // Fecha o modal se a função foi passada
        onCloseModal();
      }
    } catch (err) {
      console.error("Erro ao adicionar aluno:", err);
      showToast(err.message || 'Erro desconhecido ao adicionar aluno.', 'error');
    }
  };

  return (
    // Removido o div externo com bg-white, p-6, etc., pois o modal já terá seu próprio container
    // Adicionado padding diretamente ao form se necessário, ou o modal controla
    <div className="p-6"> {/* Adicionado padding aqui para o conteúdo do formulário dentro do modal */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <UserPlus className="mr-2 text-indigo-600 h-5 w-5" /> Cadastrar Novo Aluno
        </h2>
        {/* Botão de fechar no canto, se onCloseModal existir */}
        {onCloseModal && (
            <button
                type="button"
                onClick={onCloseModal}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <X className="h-6 w-6" />
            </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="formModalNomeAluno" // ID único para o label/input no modal
            className="block text-sm font-medium text-gray-700"
          >
            Nome do Aluno:
          </label>
          <input
            type="text"
            id="formModalNomeAluno"
            value={nomeAluno}
            onChange={(e) => setNomeAluno(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 text-gray-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="formModalValorAula"
              className="block text-sm font-medium text-gray-700"
            >
              Valor Padrão/Aula (R$):
            </label>
            <input
              type="number"
              id="formModalValorAula"
              value={valorAula}
              onChange={(e) => setValorAula(e.target.value)}
              step="0.01"
              min="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 text-gray-600"
            />
          </div>
          <div>
            <label
              htmlFor="formModalDiaPagamento"
              className="block text-sm font-medium text-gray-700"
            >
              Dia de Pagamento (1-31):
            </label>
            <input
              type="number"
              id="formModalDiaPagamento"
              value={diaPagamento}
              onChange={(e) => setDiaPagamento(e.target.value)}
              min="1"
              max="31"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 text-gray-600"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row-reverse sm:gap-3 pt-4">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Aluno
            </button>
            {/* Botão Cancelar, se onCloseModal existir */}
            {onCloseModal && (
                <button
                    type="button"
                    onClick={onCloseModal}
                    className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                >
                    Cancelar
                </button>
            )}
        </div>
      </form>
    </div>
  );
}