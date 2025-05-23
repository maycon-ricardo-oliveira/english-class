'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatDateToInput, formatDuration, getInitials } from '../utils/formatters';
import { CalendarDays, ChevronLeft, ChevronRight, CheckCircle, DollarSign, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { updateLessonStatusInDb, deleteLessonFromDb } from '../utils/api';

export default function CalendarSection({ showToast, onCalendarLessonClick }) {
  const { teacherData, isLoadingAuth, isLoadingData, currentUser } = useAuth();

  const allTeacherLessons = useMemo(() => {
    let lessons = [];
    if (teacherData && teacherData.students) {
      teacherData.students.forEach(student => {
        const studentLessons = Array.isArray(student.lessons) ? student.lessons : [];
        studentLessons.forEach(lesson => {
          lessons.push({ 
            ...lesson, 
            studentName: student.name || student.nome || "Aluno Desconhecido", 
            studentId: student.id 
          });
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

  const handleDayClickForMonthView = (dayDate) => {
    setCurrentDate(new Date(dayDate));
    setViewMode('day');
  };

  const baseViewButtonStyle = "inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
  const activeViewButtonStyle = "bg-indigo-600 text-white border-transparent focus:ring-indigo-500";
  const inactiveViewButtonStyle = "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-400";

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
        return <WeekView date={currentDate} lessons={allTeacherLessons} {...formatterProps} showToast={showToast} teacherId={currentUser.uid} onLessonClick={onCalendarLessonClick} />;
      case 'day':
        return <DayView date={currentDate} lessons={allTeacherLessons} {...formatterProps} showToast={showToast} teacherId={currentUser.uid} onLessonClick={onCalendarLessonClick} />;
      case 'month':
      default:
        return <MonthView date={currentDate} lessons={allTeacherLessons} onDayClick={handleDayClickForMonthView} {...formatterProps} onLessonClick={onCalendarLessonClick} />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <CalendarDays className="mr-2 text-purple-600 h-5 w-5" /> Calendário de Aulas
        </h2>
        <div className="flex space-x-2">
          <button onClick={() => setViewMode('month')} className={`${baseViewButtonStyle} ${viewMode === 'month' ? activeViewButtonStyle : inactiveViewButtonStyle}`}>Mês</button>
          <button onClick={() => setViewMode('week')} className={`${baseViewButtonStyle} ${viewMode === 'week' ? activeViewButtonStyle : inactiveViewButtonStyle}`}>Semana</button>
          <button onClick={() => setViewMode('day')} className={`${baseViewButtonStyle} ${viewMode === 'day' ? activeViewButtonStyle : inactiveViewButtonStyle}`}>Dia</button>
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
function MonthView({ date, lessons, onDayClick, formatDuration, getInitials, formatDateToInput, onLessonClick }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayWeekday = firstDayOfMonth.getDay();
  const today = new Date(); 
  today.setHours(0,0,0,0);

  const dayCells = [];

  for (let i = 0; i < firstDayWeekday; i++) {
    dayCells.push(<div key={`empty-start-${i}`} className="calendar-day other-month"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    currentDate.setHours(0,0,0,0); 
    const dateString = formatDateToInput(currentDate);
    const lessonsDoDia = lessons.filter(l => l.date === dateString).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    const isToday = currentDate.getTime() === today.getTime();

    dayCells.push(
      <div 
        key={day} 
        className={`calendar-day ${isToday ? 'bg-indigo-50' : ''} hover:bg-gray-50 transition-colors duration-150`} 
      >
        <div 
          className={`calendar-day-number text-xs font-medium mb-1 flex justify-end ${isToday ? 'today-number' : 'text-gray-700'}`}
          onClick={() => onDayClick(currentDate)} 
        >
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${isToday ? 'bg-indigo-600 text-white' : ''}`}>
            {day}
          </span>
        </div>
        <div className="calendar-aulas-container flex-grow overflow-y-auto space-y-1">
          {lessonsDoDia.map(lesson => {
            const statusAtual = lesson.status || 'Pendente';
            let bgColorClass = 'bg-yellow-100', textColorClass = 'text-yellow-800', borderColorClass = 'border-yellow-500';
            if (statusAtual === 'Completa') { bgColorClass = 'bg-blue-100'; textColorClass = 'text-blue-800'; borderColorClass = 'border-blue-500'; }
            else if (statusAtual === 'Paga') { bgColorClass = 'bg-green-100'; textColorClass = 'text-green-800'; borderColorClass = 'border-green-500'; }
            else if (statusAtual === 'Falta') { bgColorClass = 'bg-red-100'; textColorClass = 'text-red-800'; borderColorClass = 'border-red-500'; }
            
            const firstName = lesson.studentName ? lesson.studentName.split(' ')[0] : 'Aluno';

            return (
              <div 
                key={lesson.id} 
                title={`${lesson.time || '?'} - ${lesson.studentName} (${statusAtual}) - ${formatDuration(lesson.duration)}`} 
                className={`calendar-aula ${bgColorClass} ${textColorClass} ${borderColorClass} cursor-pointer hover:opacity-80`}
                onClick={(e) => { e.stopPropagation(); onLessonClick(lesson.studentId); }}
              >
                {lesson.time || '?'} {firstName}
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
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => 
            <div key={d} className="calendar-day-header font-bold text-gray-800 py-2">{d}</div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-b-md overflow-hidden">
        {dayCells.map(cell => cell)}
      </div>
    </div>
  );
}

// --- Componente de Visualização Semanal ---
function WeekView({ date, lessons, formatDuration, formatCurrency, formatDateToInput, showToast, teacherId, onLessonClick }) {
  const currentDayOfWeek = date.getDay();
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - currentDayOfWeek);
  startDate.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0,0,0,0);
  const weekdaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const headerCells = [];
  const dayColumns = [];

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Completa': return { style: "bg-blue-100 text-blue-800 border-blue-500", icon: <CheckCircle className="h-3 w-3 mr-1" /> };
      case 'Paga': return { style: "bg-green-100 text-green-800 border-green-500", icon: <DollarSign className="h-3 w-3 mr-1" /> };
      case 'Falta': return { style: "bg-red-100 text-red-800 border-red-500", icon: <AlertCircle className="h-3 w-3 mr-1" /> };
      default: return { style: "bg-yellow-100 text-yellow-800 border-yellow-500", icon: <Clock className="h-3 w-3 mr-1" /> };
    }
  };

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const dateString = formatDateToInput(dayDate);
    headerCells.push(<div key={`header-${i}`} className={`calendar-day-header font-bold text-gray-800 py-2 ${dayDate.getTime() === today.getTime() ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50'}`}>{weekdaysShort[i]} {dayDate.getDate()}</div>);
    // --- CORREÇÃO AQUI: l.data para l.date ---
    const lessonsDoDia = lessons.filter(l => l.date === dateString).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    // --- FIM DA CORREÇÃO ---
    dayColumns.push(
      <div key={`col-${i}`} className={`day-column min-h-[180px] p-1.5 space-y-1.5 ${dayDate.getTime() === today.getTime() ? 'bg-indigo-50' : 'bg-white'}`}>
        {lessonsDoDia.map(lesson => {
          const statusAtual = lesson.status || 'Pendente';
          const badgeInfo = getStatusInfo(statusAtual);
          return (
            <div 
              key={lesson.id} 
              className={`p-2 text-xs border-l-4 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow ${badgeInfo.style}`}
              onClick={(e) => { e.stopPropagation(); onLessonClick(lesson.studentId); }}
              title={`Aluno: ${lesson.studentName}\nStatus: ${statusAtual}\nValor: ${formatCurrency(lesson.value)}\nDuração: ${formatDuration(lesson.duration)}`}
            >
              <div className="font-semibold text-gray-800 flex items-center justify-between">
                <span>{lesson.time || '?'}</span>
                <span className="font-normal text-[0.65rem] text-gray-500">({formatDuration(lesson.duration)})</span>
              </div>
              <div className="text-gray-700 truncate mt-0.5">{lesson.studentName}</div>
              <div className="text-[0.65rem] flex items-center mt-1">
                {badgeInfo.icon}
                <span>{statusAtual}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-7 gap-px">{headerCells}</div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-b-md overflow-hidden">
        {dayColumns}
      </div>
    </div>
  );
}

// --- Componente de Visualização Diária ---
function DayView({ date, lessons, formatDuration, formatCurrency, formatDateToInput, showToast, teacherId, onLessonClick }) {
  const handleUpdateStatus = async (studentId, lessonId, newStatus) => {
    try {
      await updateLessonStatusInDb(teacherId, studentId, lessonId, newStatus);
      if (showToast) showToast(`Aula marcada como ${newStatus.toLowerCase()}.`, 'success');
    } catch (error) {
      if (showToast) showToast(error.message || `Erro ao marcar status.`, 'error');
      console.error("Erro ao marcar status da aula:", error);
    }
  };

  const handleDelete = async (studentId, lessonId) => {
    if (confirm('Deletar esta aula?')) {
      try {
        await deleteLessonFromDb(teacherId, studentId, lessonId);
        if (showToast) showToast('Aula deletada com sucesso.', 'success');
      } catch (error) {
        if (showToast) showToast(error.message || 'Erro ao deletar aula.', 'error');
        console.error("Erro ao deletar aula:", error);
      }
    }
  };

  const dateString = formatDateToInput(date);
  // --- CORREÇÃO AQUI: l.data para l.date ---
  const lessonsDoDia = lessons.filter(l => l.date === dateString).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  // --- FIM DA CORREÇÃO ---

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
          <div 
            key={lesson.id} 
            className="p-3 rounded-md bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-2 hover:shadow-md transition-shadow cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onLessonClick(lesson.studentId); }}
          >
            <div className="flex-grow">
              <div className="font-semibold text-gray-800">{lesson.time || '?'} <span className="text-xs text-gray-600">({formatDuration(lesson.duration)})</span></div>
              <div className="text-sm text-gray-700">{lesson.studentName}</div>
              <div className="text-xs text-gray-600">Valor: {formatCurrency(lesson.value)}</div>
              <div className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border-l-4 ${badge.style}`}>
                {badge.icon}
                {badge.text}
              </div>
            </div>
            <div className="aula-actions flex-shrink-0 flex flex-wrap gap-1.5 items-center self-start sm:self-center mt-2 sm:mt-0">
              {canMarkComplete && <button onClick={(e) => {e.stopPropagation(); handleUpdateStatus(lesson.studentId, lesson.id, 'Completa')}} className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400" title="Marcar como Completa"><CheckCircle className="h-5 w-5" /></button>}
              {canMarkPaid && <button onClick={(e) => {e.stopPropagation(); handleUpdateStatus(lesson.studentId, lesson.id, 'Paga')}} className="p-1.5 rounded-md hover:bg-green-100 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400" title="Marcar como Paga"><DollarSign className="h-5 w-5" /></button>}
              {canMarkAbsent && <button onClick={(e) => {e.stopPropagation(); handleUpdateStatus(lesson.studentId, lesson.id, 'Falta')}} className="p-1.5 rounded-md hover:bg-red-100 text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400" title="Marcar como Falta"><AlertCircle className="h-5 w-5" /></button>}
              {statusAtual !== 'Pendente' && canMarkPending && <button onClick={(e) => {e.stopPropagation(); handleUpdateStatus(lesson.studentId, lesson.id, 'Pendente')}} className="p-1.5 rounded-md hover:bg-yellow-100 text-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" title="Marcar como Pendente"><Clock className="h-5 w-5" /></button>}
              <button onClick={(e) => {e.stopPropagation(); handleDelete(lesson.studentId, lesson.id)}} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400" title="Deletar Aula"><Trash2 className="h-5 w-5" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}