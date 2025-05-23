'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Importa o hook useAuth
import { addAulaToDb } from '../utils/api'; // Importa a função de API
import { formatCurrency, formatDateToInput } from '../utils/formatters';
import { CalendarPlus, X } from 'lucide-react';

export default function AddAulaModal({ isOpen, onClose, studentId, showToast }) {
  // Usa o AuthContext
  const { currentUser, teacherData } = useAuth();

  // Estados locais para os campos do formulário
  const [dataAula, setDataAula] = useState('');
  const [horaAula, setHoraAula] = useState('');
  const [minutoAula, setMinutoAula] = useState('');
  const [duracaoAula, setDuracaoAula] = useState(60);
  const [valorAulaAluno, setValorAulaAluno] = useState(0);
  const [error, setError] = useState(''); // Erro local para o formulário
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para resetar o formulário e buscar valor da aula
  useEffect(() => {
    if (isOpen && studentId && teacherData && teacherData.students) {
      const student = teacherData.students.find(s => s.id === studentId);
      if (student) {
        setValorAulaAluno(student.valorAula);
      } else {
        setValorAulaAluno(0);
        console.warn(`AddAulaModal: Aluno com ID ${studentId} não encontrado nos dados do professor.`);
        if (showToast) showToast(`Aluno com ID ${studentId} não encontrado.`, 'error');
      }
      setDataAula(formatDateToInput(new Date()));
      setHoraAula('');
      setMinutoAula('');
      setDuracaoAula(60);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, studentId, teacherData, showToast]); // Adicionado showToast às dependências

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!currentUser) {
      setError('Professor não autenticado.');
      if (showToast) showToast('Professor não autenticado.', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!studentId) {
      setError('ID do aluno não fornecido.');
      if (showToast) showToast('ID do aluno não fornecido.', 'error');
      setIsSubmitting(false);
      return;
    }

    const horaNum = parseInt(horaAula, 10);
    const minutoNum = parseInt(minutoAula, 10);

    if (!dataAula) {
        setError('Data da aula é obrigatória.');
        setIsSubmitting(false);
        return;
    }
    if (isNaN(horaNum) || horaNum < 0 || horaNum > 23) {
      setError('Hora inválida. Use um valor entre 00 e 23.');
      setIsSubmitting(false);
      return;
    }
    if (isNaN(minutoNum) || minutoNum < 0 || minutoNum > 59) {
      setError('Minuto inválido. Use um valor entre 00 e 59.');
      setIsSubmitting(false);
      return;
    }
    const horarioFormatado = `${String(horaNum).padStart(2, '0')}:${String(minutoNum).padStart(2, '0')}`;

    const duracaoNum = parseInt(String(duracaoAula), 10);
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      setError('A duração da aula deve ser um número positivo.');
      setIsSubmitting(false);
      return;
    }

    try {
      await addAulaToDb(currentUser.uid, studentId, { // Usa currentUser.uid
        data: dataAula,
        horario: horarioFormatado,
        duracao: duracaoNum,
        valor: valorAulaAluno,
        status: 'Pendente',
      });
      if (showToast) showToast('Aula adicionada com sucesso!', 'success');
      onClose();
    } catch (err) {
      console.error("Erro ao adicionar aula (AddAulaModal):", err);
      const errorMessage = err.message || 'Erro desconhecido ao adicionar aula.';
      setError(errorMessage); // Define o erro local para exibição no modal
      // if (showToast) showToast(errorMessage, 'error'); // Opcional: pode usar toast ou o erro local
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-[70] flex items-center justify-center p-4">
      <div className="relative mx-auto border border-gray-200 w-full max-w-md shadow-xl rounded-lg bg-white">
        <div className="p-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
            <h3 className="text-xl leading-6 font-semibold text-gray-900">
              Adicionar Nova Aula
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="modalAddDataAula" className="block text-sm font-medium text-gray-700 text-left">Data:</label>
                <input
                  type="date"
                  id="modalAddDataAula"
                  value={dataAula}
                  onChange={(e) => setDataAula(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="modalAddHoraAula" className="block text-sm font-medium text-gray-700 text-left">Hora (00-23):</label>
                <input
                  type="number"
                  id="modalAddHoraAula"
                  value={horaAula}
                  onChange={(e) => setHoraAula(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  min="0" max="23" placeholder="HH" required disabled={isSubmitting}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Nova linha para minuto e duração */}
              <div>
                <label htmlFor="modalAddMinutoAula" className="block text-sm font-medium text-gray-700 text-left">Minuto (00-59):</label>
                <input
                  type="number"
                  id="modalAddMinutoAula"
                  value={minutoAula}
                  onChange={(e) => setMinutoAula(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  min="0" max="59" placeholder="MM" required disabled={isSubmitting}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="modalAddDuracaoAula" className="block text-sm font-medium text-gray-700 text-left">Duração (min):</label>
                <input
                  type="number"
                  id="modalAddDuracaoAula"
                  value={duracaoAula}
                  onChange={(e) => setDuracaoAula(e.target.value)}
                  min="15" step="15" required disabled={isSubmitting}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 text-left pt-2">
              Valor da aula: <span className="font-semibold text-gray-800">{formatCurrency(valorAulaAluno)}</span> (padrão do aluno)
            </p>

            {error && <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>}

            <div className="flex flex-col sm:flex-row-reverse sm:gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <CalendarPlus className="mr-2 h-5 w-5" />
                )}
                {isSubmitting ? 'Salvando...' : 'Salvar Aula'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}