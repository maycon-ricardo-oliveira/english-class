'use client'; // Necessário para hooks

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDateToInput } from '../utils/formatters';
import { CalendarCheck, X } from 'lucide-react';

export default function AddAulaLoteModal({ isOpen, onClose, studentId }) {

  // Estados locais para os campos do formulário
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horaAula, setHoraAula] = useState(''); // String para permitir '08'
  const [minutoAula, setMinutoAula] = useState(''); // String para permitir '05'
  const [duracaoAula, setDuracaoAula] = useState(60); // Padrão 60 min
  const [valorAulaAluno, setValorAulaAluno] = useState(0);
  const [diasSemana, setDiasSemana] = useState([]); // Array para guardar os dias selecionados (0-Dom, 1-Seg, ...)
  const [error, setError] = useState('');

  // Nomes dos dias da semana para os checkboxes
  const weekdaysOptions = [
    { label: 'Dom', value: 0 }, { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 }, { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 }, { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 },
  ];

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
          console.warn(`Aluno com ID ${studentId} não encontrado no modal de adicionar aulas em lote.`);
        }
      } else {
        setValorAulaAluno(0);
         console.warn(`Professor ou lista de alunos não encontrados no modal de adicionar aulas em lote.`);
      }
      setDataInicio(formatDateToInput(new Date()));
      setDataFim('');
      setHoraAula('');
      setMinutoAula('');
      setDuracaoAula(60);
      setDiasSemana([]);
      setError('');
    }
  }, [isOpen, studentId, getLoggedInTeacher]);

  // Lida com a mudança nos checkboxes dos dias da semana
  const handleWeekdayChange = (dayValue) => {
    setDiasSemana(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue) // Remove se já estiver selecionado
        : [...prev, dayValue] // Adiciona se não estiver selecionado
    );
  };

  // Lida com o submit do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!studentId) {
      setError('ID do aluno não fornecido.');
      return;
    }
    if (!dataInicio || !dataFim) {
      setError('Data de início e data de fim são obrigatórias.');
      return;
    }
    const startDate = new Date(dataInicio + 'T00:00:00');
    const endDate = new Date(dataFim + 'T00:00:00');
    if (startDate > endDate) {
      setError('A data de início não pode ser posterior à data de fim.');
      return;
    }

    const horaNum = parseInt(horaAula, 10);
    const minutoNum = parseInt(minutoAula, 10);
    if (isNaN(horaNum) || horaNum < 0 || horaNum > 23) {
      setError('Hora inválida. Use um valor entre 00 e 23.');
      return;
    }
    if (isNaN(minutoNum) || minutoNum < 0 || minutoNum > 59) {
      setError('Minuto inválido. Use um valor entre 00 e 59.');
      return;
    }
    const horarioFormatado = `${String(horaNum).padStart(2, '0')}:${String(minutoNum).padStart(2, '0')}`;

    const duracaoNum = parseInt(String(duracaoAula), 10);
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      setError('A duração da aula deve ser um número positivo.');
      return;
    }
    if (diasSemana.length === 0) {
      setError('Selecione pelo menos um dia da semana.');
      return;
    }

    // Gera as aulas
    const novasAulas = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (diasSemana.includes(currentDate.getDay())) { // getDay() retorna 0 para Dom, 1 para Seg...
        novasAulas.push({
          data: formatDateToInput(currentDate),
          horario: horarioFormatado,
          duracao: duracaoNum,
          valor: valorAulaAluno,
          status: 'Pendente',
          // ID será adicionado pelo store
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (novasAulas.length === 0) {
      setError('Nenhuma aula foi gerada para o período e dias selecionados.');
      return;
    }

    try {
      addAulasLoteAction(studentId, novasAulas);
      alert(`${novasAulas.length} aula(s) adicionada(s) com sucesso!`);
      onClose(); // Fecha o modal
    } catch (err) {
      console.error("Erro ao adicionar aulas em lote:", err);
      setError(err.message || 'Erro desconhecido ao adicionar aulas em lote.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-xl leading-6 font-semibold text-gray-900">
              Adicionar Aulas em Lote
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
              <div>
                <label htmlFor="modalDataInicioLote" className="block text-sm font-medium text-gray-700 text-left">Data de Início:</label>
                <input type="date" id="modalDataInicioLote" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="modalDataFimLote" className="block text-sm font-medium text-gray-700 text-left">Data de Fim:</label>
                <input type="date" id="modalDataFimLote" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="modalHoraAulaLote" className="block text-sm font-medium text-gray-700 text-left">Hora Padrão (00-23):</label>
                <input type="number" id="modalHoraAulaLote" value={horaAula} onChange={(e) => setHoraAula(e.target.value.replace(/\D/g, '').slice(0, 2))} min="0" max="23" placeholder="HH" required className="mt-1 p-2 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder-gray-500"/>
              </div>
              <div>
                <label htmlFor="modalMinutoAulaLote" className="block text-sm font-medium text-gray-700 text-left">Minuto Padrão (00-59):</label>
                <input type="number" id="modalMinutoAulaLote" value={minutoAula} onChange={(e) => setMinutoAula(e.target.value.replace(/\D/g, '').slice(0, 2))} min="0" max="59" placeholder="MM" required className="mt-1 p-2 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder-gray-500"/>
              </div>
            </div>

            <div>
              <label htmlFor="modalDuracaoAulaLote" className="block text-sm font-medium text-gray-700 text-left">Duração Padrão (minutos):</label>
              <input type="number" id="modalDuracaoAulaLote" value={duracaoAula} onChange={(e) => setDuracaoAula(e.target.value)} min="15" step="15" required className="mt-1 p-2 text-gray-600 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Dias da Semana:</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {weekdaysOptions.map(day => (
                  <label key={day.value} className="weekday-checkbox-label text-gray-600">
                    <input
                      type="checkbox"
                      value={day.value}
                      checked={diasSemana.includes(day.value)}
                      onChange={() => handleWeekdayChange(day.value)}
                      className="weekday-checkbox text-indigo-600 focus:ring-indigo-500"
                    /> {day.label}
                  </label>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-600 text-left">
              Valor de cada aula: <span className="font-semibold">{formatCurrency(valorAulaAluno)}</span> (padrão do aluno)
            </p>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="items-center gap-4 pt-4">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
              >
                <CalendarCheck className="mr-2 h-5 w-5" /> Gerar Aulas em Lote
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