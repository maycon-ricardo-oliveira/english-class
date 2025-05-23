'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Importa o hook useAuth
import { addLessonsLoteToDb } from '../utils/api'; // Importa a função da API com nome corrigido
import { formatCurrency, formatDateToInput } from '../utils/formatters';
import { CalendarCheck, X } from 'lucide-react';

export default function AddAulaLoteModal({ isOpen, onClose, studentId, showToast }) {
  const { currentUser, teacherData } = useAuth(); // Usa o AuthContext

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [lessonHour, setLessonHour] = useState('');   // Renomeado de horaAula
  const [lessonMinute, setLessonMinute] = useState(''); // Renomeado de minutoAula
  const [lessonDuration, setLessonDuration] = useState(60); // Renomeado de duracaoAula
  const [studentLessonValue, setStudentLessonValue] = useState(0); // Renomeado de valorAulaAluno
  const [diasSemana, setDiasSemana] = useState([]);
  const [error, setError] = useState(''); // Erro local para o formulário
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekdaysOptions = [
    { label: 'Dom', value: 0 }, { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 }, { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 }, { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 },
  ];

  useEffect(() => {
    if (isOpen && studentId && teacherData && teacherData.students) {
      const student = teacherData.students.find(s => s.id === studentId);
      if (student) {
        setStudentLessonValue(student.lessonValue || 0); // Usa lessonValue do aluno
      } else {
        setStudentLessonValue(0);
        console.warn(`AddAulaLoteModal: Aluno com ID ${studentId} não encontrado.`);
        if(showToast) showToast(`Aluno com ID ${studentId} não encontrado.`, 'error');
      }
      setDataInicio(formatDateToInput(new Date()));
      setDataFim('');
      setLessonHour('');
      setLessonMinute('');
      setLessonDuration(60);
      setDiasSemana([]);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, studentId, teacherData, showToast]);

  const handleWeekdayChange = (dayValue) => {
    setDiasSemana(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

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
    if (!dataInicio || !dataFim) {
      setError('Data de início e data de fim são obrigatórias.');
      setIsSubmitting(false);
      return;
    }
    const startDate = new Date(dataInicio + 'T00:00:00');
    const endDate = new Date(dataFim + 'T00:00:00');
    if (startDate > endDate) {
      setError('A data de início não pode ser posterior à data de fim.');
      setIsSubmitting(false);
      return;
    }

    const hourNum = parseInt(lessonHour, 10);
    const minuteNum = parseInt(lessonMinute, 10);
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
      setError('Hora inválida. Use um valor entre 00 e 23.');
      setIsSubmitting(false);
      return;
    }
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      setError('Minuto inválido. Use um valor entre 00 e 59.');
      setIsSubmitting(false);
      return;
    }
    const formattedTime = `${String(hourNum).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`;

    const durationNum = parseInt(String(lessonDuration), 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError('A duração da aula deve ser um número positivo.');
      setIsSubmitting(false);
      return;
    }
    if (diasSemana.length === 0) {
      setError('Selecione pelo menos um dia da semana.');
      setIsSubmitting(false);
      return;
    }

    const newLessonsPayload = []; // Array para os payloads das lições
    let currentDateIter = new Date(startDate);
    while (currentDateIter <= endDate) {
      if (diasSemana.includes(currentDateIter.getDay())) {
        newLessonsPayload.push({
          date: formatDateToInput(currentDateIter),
          time: formattedTime,
          duration: durationNum,
          value: studentLessonValue,
          status: 'Pendente',
        });
      }
      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    if (newLessonsPayload.length === 0) {
      setError('Nenhuma aula foi gerada para o período e dias selecionados.');
      setIsSubmitting(false);
      return;
    }

    try {
      await addLessonsLoteToDb(currentUser.uid, studentId, newLessonsPayload);
      if (showToast) showToast(`${newLessonsPayload.length} aula(s) adicionada(s) com sucesso!`, 'success');
      onClose();
    } catch (err) {
      console.error("Erro ao adicionar aulas em lote:", err);
      setError(err.message || 'Erro desconhecido ao adicionar aulas em lote.');
      // if (showToast) showToast(err.message || 'Erro desconhecido...', 'error'); // Opcional
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-[70] flex items-center justify-center p-4">
      <div className="relative mx-auto border border-gray-200 w-full max-w-lg shadow-xl rounded-lg bg-white">
        <div className="p-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
            <h3 className="text-xl leading-6 font-semibold text-gray-900">
              Adicionar Aulas em Lote
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
                <label htmlFor="modalLoteDataInicio" className="block text-sm font-medium text-gray-700 text-left">Data de Início:</label>
                <input type="date" id="modalLoteDataInicio" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required disabled={isSubmitting} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"/>
              </div>
              <div>
                <label htmlFor="modalLoteDataFim" className="block text-sm font-medium text-gray-700 text-left">Data de Fim:</label>
                <input type="date" id="modalLoteDataFim" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required disabled={isSubmitting} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"/>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="modalLoteLessonHour" className="block text-sm font-medium text-gray-700 text-left">Hora Padrão (00-23):</label>
                <input type="number" id="modalLoteLessonHour" value={lessonHour} onChange={(e) => setLessonHour(e.target.value.replace(/\D/g, '').slice(0, 2))} min="0" max="23" placeholder="HH" required disabled={isSubmitting} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"/>
              </div>
              <div>
                <label htmlFor="modalLoteLessonMinute" className="block text-sm font-medium text-gray-700 text-left">Minuto Padrão (00-59):</label>
                <input type="number" id="modalLoteLessonMinute" value={lessonMinute} onChange={(e) => setLessonMinute(e.target.value.replace(/\D/g, '').slice(0, 2))} min="0" max="59" placeholder="MM" required disabled={isSubmitting} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"/>
              </div>
            </div>

            <div>
              <label htmlFor="modalLoteLessonDuration" className="block text-sm font-medium text-gray-700 text-left">Duração Padrão (minutos):</label>
              <input type="number" id="modalLoteLessonDuration" value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} min="15" step="15" required disabled={isSubmitting} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-100"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Dias da Semana:</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {weekdaysOptions.map(day => (
                  <label key={day.value} className="weekday-checkbox-label text-gray-700">
                    <input
                      type="checkbox"
                      value={day.value}
                      checked={diasSemana.includes(day.value)}
                      onChange={() => handleWeekdayChange(day.value)}
                      disabled={isSubmitting}
                      className="weekday-checkbox text-indigo-600 focus:ring-indigo-500 border-gray-300 disabled:opacity-70"
                    /> {day.label}
                  </label>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-600 text-left pt-2">
              Valor de cada aula: <span className="font-semibold text-gray-800">{formatCurrency(studentLessonValue)}</span>
            </p>

            {error && <p className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>}

            <div className="flex flex-col sm:flex-row-reverse sm:gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <CalendarCheck className="mr-2 h-5 w-5" />
                )}
                {isSubmitting ? 'Gerando...' : 'Gerar Aulas'}
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