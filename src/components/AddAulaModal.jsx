'use client'; // Necessário para hooks

import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore'; // Ajuste o caminho se necessário
import { formatCurrency, formatDateToInput } from '../utils/formatters';
import { CalendarPlus, X } from 'lucide-react';

export default function AddAulaModal({ isOpen, onClose, studentId }) {
  // Ações e seletores do store
  const addAulaAction = useAppStore((state) => state.addAula);
  const getLoggedInTeacher = useAppStore((state) => state.getLoggedInTeacher);

  // Estados locais para os campos do formulário
  const [dataAula, setDataAula] = useState('');
  // --- ESTADOS PARA HORA E MINUTO SEPARADOS ---
  const [horaAula, setHoraAula] = useState(''); // String para permitir '08'
  const [minutoAula, setMinutoAula] = useState(''); // String para permitir '05'
  // --- FIM DA ALTERAÇÃO DE ESTADO ---
  const [duracaoAula, setDuracaoAula] = useState(60); // Padrão 60 min
  const [valorAulaAluno, setValorAulaAluno] = useState(0);
  const [error, setError] = useState('');

  // Efeito para resetar o formulário e buscar valor da aula
  useEffect(() => {
    if (isOpen && studentId) {
      const teacher = getLoggedInTeacher();
      if (teacher && teacher.students) {
        const student = teacher.students.find(s => s.id === studentId);
        if (student) {
          setValorAulaAluno(student.valorAula);
        } else {
          setValorAulaAluno(0);
          console.warn(`Aluno com ID ${studentId} não encontrado no modal de adicionar aula.`);
        }
      } else {
        setValorAulaAluno(0);
        console.warn(`Professor ou lista de alunos não encontrados no modal de adicionar aula.`);
      }
      setDataAula(formatDateToInput(new Date()));
      // --- RESETAR HORA E MINUTO ---
      setHoraAula(''); // Ou um valor padrão, ex: "08"
      setMinutoAula(''); // Ou um valor padrão, ex: "00"
      // --- FIM DO RESET ---
      setDuracaoAula(60);
      setError('');
    }
  }, [isOpen, studentId, getLoggedInTeacher]);

  // Lida com o submit do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!studentId) {
      setError('ID do aluno não fornecido.');
      return;
    }

    // --- VALIDAÇÃO E COMBINAÇÃO DE HORA E MINUTO ---
    const horaNum = parseInt(horaAula, 10);
    const minutoNum = parseInt(minutoAula, 10);

    if (!dataAula) {
        setError('Data da aula é obrigatória.');
        return;
    }

    if (isNaN(horaNum) || horaNum < 0 || horaNum > 23) {
      setError('Hora inválida. Use um valor entre 00 e 23.');
      return;
    }
    if (isNaN(minutoNum) || minutoNum < 0 || minutoNum > 59) {
      setError('Minuto inválido. Use um valor entre 00 e 59.');
      return;
    }

    // Formata para HH:MM
    const horarioFormatado = `${String(horaNum).padStart(2, '0')}:${String(minutoNum).padStart(2, '0')}`;
    // --- FIM DA VALIDAÇÃO E COMBINAÇÃO ---

    const duracaoNum = parseInt(String(duracaoAula), 10);
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      setError('A duração da aula deve ser um número positivo.');
      return;
    }

    try {
      addAulaAction(studentId, {
        data: dataAula,
        horario: horarioFormatado, // Usa o horário formatado
        duracao: duracaoNum,
        valor: valorAulaAluno, // Usa o valor padrão do aluno
        status: 'Pendente',
      });
      onClose(); // Fecha o modal após adicionar
    } catch (err) {
      console.error("Erro ao adicionar aula:", err);
      setError(err.message || 'Erro desconhecido ao adicionar aula.');
    }
  };

  if (!isOpen) {
    return null; // Não renderiza nada se o modal não estiver aberto
  }

  return (
    <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="p-6">
          {/* Header do Modal */}
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-xl leading-6 font-semibold text-gray-900">
              Adicionar Nova Aula
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Data */}
            <div>
              <label
                htmlFor="modalDataAula"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Data:
              </label>
              <input
                type="date"
                id="modalDataAula"
                value={dataAula}
                onChange={(e) => setDataAula(e.target.value)}
                required
                className="mt-1 p-2 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* --- INPUTS DE HORA E MINUTO SEPARADOS --- */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="modalHoraAula"
                  className="block text-sm font-medium text-gray-700 text-left"
                >
                  Hora (00-23):
                </label>
                <input
                  type="number"
                  id="modalHoraAula"
                  value={horaAula}
                  onChange={(e) => {
                    // Limita a 2 caracteres e remove não numéricos
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setHoraAula(val);
                  }}
                  min="0"
                  max="23"
                  placeholder="HH"
                  required
                  className="mt-1 p-2 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor="modalMinutoAula"
                  className="block text-sm font-medium text-gray-700 text-left"
                >
                  Minuto (00-59):
                </label>
                <input
                  type="number"
                  id="modalMinutoAula"
                  value={minutoAula}
                  onChange={(e) => {
                     // Limita a 2 caracteres e remove não numéricos
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setMinutoAula(val);
                  }}
                  min="0"
                  max="59"
                  placeholder="MM"
                  required
                  className="mt-1 p-2 text-gray-900 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder-gray-500"
                />
              </div>
            </div>
            {/* --- FIM DOS INPUTS DE HORA E MINUTO --- */}


            {/* Campo Duração */}
            <div>
              <label
                htmlFor="modalDuracaoAula"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Duração (minutos):
              </label>
              <input
                type="number"
                id="modalDuracaoAula"
                value={duracaoAula}
                onChange={(e) => setDuracaoAula(e.target.value)}
                min="15"
                step="15"
                required
                className="mt-1 p-2 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <p className="text-sm text-gray-600 text-left">
              Valor da aula: <span className="font-semibold">{formatCurrency(valorAulaAluno)}</span> (padrão do aluno)
            </p>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="items-center gap-4 pt-4">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                <CalendarPlus className="mr-2 h-5 w-5" /> Salvar Aula
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
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
