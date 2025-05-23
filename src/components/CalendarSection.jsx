'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { formatCurrency, formatDate, formatDateToInput, formatDuration, getInitials } from '../utils/formatters';
import { CalendarDays, ChevronLeft, ChevronRight, CheckCircle, DollarSign, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { updateAulaStatusInDb, deleteAulaFromDb } from '../utils/api';


export default function CalendarSection({ showToast }) { 
  const { teacherData, isLoadingAuth, isLoadingData, currentUser } = useAuth(); 

  const allTeacherLessons = useMemo(() => {
    let lessons = [];
    if (teacherData && teacherData.students) {
      teacherData.students.forEach(student => {
        const studentLessons = Array.isArray(student.lessons) ? student.lessons : [];
        studentLessons.forEach(lesson => {
          lessons.push({ ...lesson, studentName: student.nome, studentId: student.id });
        });
      });
    }
    return lessons;
  }, [teacherData]); 

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');

  const handlePrev = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
      else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
      else if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
      else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
      else if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const getCalendarTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${formatDate(formatDateToInput(startOfWeek))} - ${formatDate(formatDateToInput(endOfWeek))}`;
    } else if (viewMode === 'day') {
      return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    return '';
  };

  const handleDayClick = (dayDate) => {
    setCurrentDate(new Date(dayDate));
    setViewMode('day');
  };

  const renderCalendarView = () => {
    const formatterProps = { formatCurrency, formatDate, formatDateToInput, formatDuration, getInitials };
    if (isLoadingAuth || (currentUser && isLoadingData && !teacherData)) {
        return <p className="text-center text-gray-500 py-10">Carregando dados do calendário...</p>;
    }
    if (!currentUser || !teacherData) { 
        return <p className="text-center text-gray-500 py-10">Não foi possível carregar os dados do calendário.</p>;
    }

    switch (viewMode) {
      case 'week':
        return <WeekView date={currentDate} lessons={allTeacherLessons} {...formatterProps} showToast={showToast} teacherId={currentUser.uid} />;
      case 'day':
        return <DayView date={currentDate} lessons={allTeacherLessons} {...formatterProps} showToast={showToast} teacherId={currentUser.uid} />;
      case 'month':
      default:
        return <MonthView date={currentDate} lessons={allTeacherLessons} onDayClick={handleDayClick} {...formatterProps} />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <CalendarDays className="mr-2 text-purple-600 h-5 w-5" /> Calendário de Aulas
        </h2>
        <div className="flex space-x-1  p-0.5">
          
          <button onClick={() => setViewMode('month')} className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2  focus:ring-gray-400 view-button ${viewMode === 'month' ? 'active' : ''}`}>Mês</button>
          <button onClick={() => setViewMode('week')} className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 view-button ${viewMode === 'week' ? 'active' : ''}`}>Semana</button>
          <button onClick={() => setViewMode('day')} className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 view-button ${viewMode === 'day' ? 'active' : ''}`}>Dia</button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrev} type="button" className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"><ChevronLeft className="h-5 w-5 text-gray-600" /></button>
        <h3 className="text-lg font-semibold text-gray-800 text-center">
          {getCalendarTitle()}
        </h3>
        <button onClick={handleNext} type="button" className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"><ChevronRight className="h-5 w-5 text-gray-600" /></button>
      </div>
      {renderCalendarView()}
    </div>
  );
}

// --- Componente de Visualização Mensal ---
function MonthView({ date, lessons, onDayClick, formatDuration, getInitials, formatDateToInput }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayWeekday = firstDayOfMonth.getDay();
  const today = new Date(); 
  today.setHours(0,0,0,0); // Normaliza 'hoje' para comparação de data apenas

  const dayCells = [];

  for (let i = 0; i < firstDayWeekday; i++) {
    dayCells.push(<div key={`empty-start-${i}`} className="calendar-day other-month"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    currentDate.setHours(0,0,0,0); // Normaliza para comparação com 'today'
    const dateString = formatDateToInput(currentDate);
    const lessonsDoDia = lessons.filter(l => l.data === dateString).sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
    
    const isToday = currentDate.getTime() === today.getTime();

    dayCells.push(
      <div 
        key={day} 
        className={`calendar-day ${isToday ? 'bg-indigo-50 border-indigo-300' : ''} cursor-pointer hover:bg-gray-100 transition-colors duration-150`} 
        onClick={() => onDayClick(currentDate)}
      >
        <div 
          className={`calendar-day-number text-xs text-right pr-1 font-medium ${isToday ? 'text-indigo-600' : 'text-gray-700'}`} // Cor mais escura e destaque para hoje
        >
          {day}
        </div>
        <div className="calendar-aulas-container mt-1 space-y-1"> {/* Adicionado espaçamento entre aulas */}
          {lessonsDoDia.map(lesson => {
            const statusAtual = lesson.status || 'Pendente';
            let bgColorClass = 'bg-yellow-100', textColorClass = 'text-yellow-800', borderColorClass = 'border-yellow-500';
            if (statusAtual === 'Completa') { bgColorClass = 'bg-blue-100'; textColorClass = 'text-blue-800'; borderColorClass = 'border-blue-500'; }
            else if (statusAtual === 'Paga') { bgColorClass = 'bg-green-100'; textColorClass = 'text-green-800'; borderColorClass = 'border-green-500'; }
            else if (statusAtual === 'Falta') { bgColorClass = 'bg-red-100'; textColorClass = 'text-red-800'; borderColorClass = 'border-red-500'; }
            return (
              <div 
                key={lesson.id} 
                title={`${lesson.horario || '?'} - ${lesson.studentName} (${statusAtual}) - ${formatDuration(lesson.duracao)}`} 
                className={`calendar-aula ${bgColorClass} ${textColorClass} ${borderColorClass}`}
              >
                {lesson.horario || '?'} {getInitials(lesson.studentName, 2)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  const totalCells = firstDayWeekday + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    dayCells.push(<div key={`empty-end-${i}`} className="calendar-day other-month"></div>);
  }
  return (
    <div>
      <div className="grid grid-cols-7 gap-px">
        {/* Cabeçalho dos dias da semana com texto em negrito */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => 
            <div key={d} className="calendar-day-header font-semibold text-gray-700">{d}</div> // Adicionado font-semibold e text-gray-700
        )}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-b-md overflow-hidden"> {/* Adicionado rounded-b-md e overflow-hidden */}
        {dayCells.map(cell => cell)}
      </div>
    </div>
  );
}

// --- Componente de Visualização Semanal ---
function WeekView({ date, lessons, formatDuration, formatCurrency, formatDateToInput, showToast, teacherId }) {
  const currentDayOfWeek = date.getDay();
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - currentDayOfWeek);
  startDate.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0,0,0,0);
  const weekdaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const headerCells = [];
  const dayColumns = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const dateString = formatDateToInput(dayDate);
    headerCells.push(<div key={`header-${i}`} className={`calendar-day-header font-semibold text-gray-700 ${dayDate.getTime() === today.getTime() ? 'bg-indigo-100 text-indigo-700' : ''}`}>{weekdaysShort[i]} {dayDate.getDate()}</div>); // Adicionado font-semibold e text-gray-700
    const lessonsDoDia = lessons.filter(l => l.data === dateString).sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
    dayColumns.push(
      <div key={`col-${i}`} className={`day-column min-h-[150px] p-1.5 ${dayDate.getTime() === today.getTime() ? 'bg-indigo-50' : 'bg-white'}`}>
        {lessonsDoDia.map(lesson => {
          const statusAtual = lesson.status || 'Pendente';
          let statusStyle = "bg-yellow-100 text-yellow-800 border-yellow-500";
          if (statusAtual === 'Completa') statusStyle = "bg-blue-100 text-blue-800 border-blue-500";
          else if (statusAtual === 'Paga') statusStyle = "bg-green-100 text-green-800 border-green-500";
          else if (statusAtual === 'Falta') statusStyle = "bg-red-100 text-red-800 border-red-500";
          return (
            <div key={lesson.id} className={`p-1.5 text-[0.7rem] border-l-4 rounded-sm mb-1 ${statusStyle} shadow-sm`}>
              <div className="font-semibold text-gray-800">{lesson.horario || '?'} <span className="font-normal text-gray-600">({formatDuration(lesson.duracao)})</span></div>
              <div className="text-gray-700 truncate">{lesson.studentName}</div>
              <div className="text-xs text-gray-600">{statusAtual} - {formatCurrency(lesson.valor)}</div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-7 gap-px">{headerCells}</div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-b-md overflow-hidden"> {/* Adicionado rounded-b-md e overflow-hidden */}
        {dayColumns}
      </div>
    </div>
  );
}

// --- Componente de Visualização Diária ---
function DayView({ date, lessons, formatDuration, formatCurrency, formatDateToInput, showToast, teacherId }) {
  const handleUpdateStatus = async (studentId, lessonId, newStatus) => {
    try {
      await updateAulaStatusInDb(teacherId, studentId, lessonId, newStatus);
      if (showToast) showToast(`Aula marcada como ${newStatus.toLowerCase()}.`, 'success');
    } catch (error) {
      if (showToast) showToast(error.message || `Erro ao marcar status.`, 'error');
      console.error("Erro ao marcar status da aula:", error);
    }
  };

  const handleDelete = async (studentId, lessonId) => {
    if (confirm('Deletar esta aula?')) {
      try {
        await deleteAulaFromDb(teacherId, studentId, lessonId);
        if (showToast) showToast('Aula deletada com sucesso.', 'success');
      } catch (error) {
        if (showToast) showToast(error.message || 'Erro ao deletar aula.', 'error');
        console.error("Erro ao deletar aula:", error);
      }
    }
  };

  const dateString = formatDateToInput(date);
  const lessonsDoDia = lessons.filter(l => l.data === dateString).sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completa': return { style: "bg-blue-100 text-blue-800 border-blue-500", icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" />, text: "Completa" };
      case 'Paga': return { style: "bg-green-100 text-green-800 border-green-500", icon: <DollarSign className="h-3.5 w-3.5 mr-1.5" />, text: "Paga" };
      case 'Falta': return { style: "bg-red-100 text-red-800 border-red-500", icon: <AlertCircle className="h-3.5 w-3.5 mr-1.5" />, text: "Falta" };
      default: return { style: "bg-yellow-100 text-yellow-800 border-yellow-500", icon: <Clock className="h-3.5 w-3.5 mr-1.5" />, text: "Pendente" };
    }
  };

  if (lessonsDoDia.length === 0) {
    return <p className="text-gray-600 text-center py-4 italic">Nenhuma aula agendada para este dia.</p>;
  }

  return (
    <div className="space-y-3">
      {lessonsDoDia.map(lesson => {
        const statusAtual = lesson.status || 'Pendente';
        const badge = getStatusBadge(statusAtual);
        const canMarkComplete = statusAtual !== 'Completa' && statusAtual !== 'Paga' && statusAtual !== 'Falta';
        const canMarkPaid = statusAtual !== 'Paga' && statusAtual !== 'Falta';
        const canMarkAbsent = statusAtual !== 'Falta' && statusAtual !== 'Completa' && statusAtual !== 'Paga';
        const canMarkPending = statusAtual !== 'Pendente' && statusAtual !== 'Completa' && statusAtual !== 'Paga';

        return (
          <div key={lesson.id} className="p-3 rounded-md bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-2 hover:shadow-md transition-shadow">
            <div className="flex-grow">
              <div className="font-semibold text-gray-800">{lesson.horario || '?'} <span className="text-xs text-gray-600">({formatDuration(lesson.duracao)})</span></div>
              <div className="text-sm text-gray-700">{lesson.studentName}</div>
              <div className="text-xs text-gray-600">Valor: {formatCurrency(lesson.valor)}</div>
              <div className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border-l-4 ${badge.style}`}>
                {badge.icon}
                {badge.text}
              </div>
            </div>
            <div className="aula-actions flex-shrink-0 flex flex-wrap gap-1.5 items-center self-start sm:self-center mt-2 sm:mt-0">
              {canMarkComplete && <button onClick={() => handleUpdateStatus(lesson.studentId, lesson.id, 'Completa')} className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400" title="Marcar como Completa"><CheckCircle className="h-5 w-5" /></button>}
              {canMarkPaid && <button onClick={() => handleUpdateStatus(lesson.studentId, lesson.id, 'Paga')} className="p-1.5 rounded-md hover:bg-green-100 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400" title="Marcar como Paga"><DollarSign className="h-5 w-5" /></button>}
              {canMarkAbsent && <button onClick={() => handleUpdateStatus(lesson.studentId, lesson.id, 'Falta')} className="p-1.5 rounded-md hover:bg-red-100 text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400" title="Marcar como Falta"><AlertCircle className="h-5 w-5" /></button>}
              {statusAtual !== 'Pendente' && canMarkPending && <button onClick={() => handleUpdateStatus(lesson.studentId, lesson.id, 'Pendente')} className="p-1.5 rounded-md hover:bg-yellow-100 text-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" title="Marcar como Pendente"><Clock className="h-5 w-5" /></button>}
              <button onClick={() => handleDelete(lesson.studentId, lesson.id)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400" title="Deletar Aula"><Trash2 className="h-5 w-5" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}