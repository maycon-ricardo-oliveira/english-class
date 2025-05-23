'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    deleteLessonFromDb, 
    deleteStudentFromDb, 
    updateLessonStatusInDb
} from '../utils/api';
import { formatCurrency, formatDate, formatDuration } from '../utils/formatters';
// --- CORREÇÃO: Adicionado LinkIcon à importação ---
import { X, CalendarPlus, CalendarCheck, Trash2, CheckCircle, DollarSign, AlertCircle, Clock, Filter, ChevronDown, Link as LinkIcon } from 'lucide-react';
// --- FIM DA CORREÇÃO ---

const ALL_POSSIBLE_STATUSES = ['Pendente', 'Completa', 'Paga', 'Falta'];

export default function StudentDetailModal({ isOpen, onClose, studentId, onOpenAddAula, onOpenAddAulaLote, showToast }) {
  const { currentUser, teacherData } = useAuth();

  const [student, setStudent] = useState(null);
  const [aulaPeriodFilter, setAulaPeriodFilter] = useState('currentMonth');
  const [selectedStatuses, setSelectedStatuses] = useState([...ALL_POSSIBLE_STATUSES]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && studentId && teacherData && teacherData.students) {
      const foundStudent = teacherData.students.find(s => s.id === studentId);
      setStudent(foundStudent || null);
      if (!foundStudent) {
        console.warn("StudentDetailModal: Aluno com ID", studentId, "não encontrado nos dados do professor.");
      }
      setAulaPeriodFilter('currentMonth'); 
      setSelectedStatuses([...ALL_POSSIBLE_STATUSES]); 
      setIsStatusDropdownOpen(false);
    } else if (!isOpen) {
      setStudent(null); 
    }
  }, [isOpen, studentId, teacherData]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusDropdownOpen]);


  const handleStatusFilterChange = (statusToToggle) => {
    setSelectedStatuses(prevStatuses =>
      prevStatuses.includes(statusToToggle)
        ? prevStatuses.filter(s => s !== statusToToggle)
        : [...prevStatuses, statusToToggle]
    );
  };

  const filteredAndSortedAulas = useMemo(() => {
    if (!student || !Array.isArray(student.lessons)) return [];
    
    let aulasFiltradasPorPeriodo = [];
    if (aulaPeriodFilter === 'currentMonth') {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      aulasFiltradasPorPeriodo = student.lessons.filter(lesson => {
        try {
          const dataLesson = new Date(lesson.date + 'T00:00:00');
          return dataLesson.getMonth() === mesAtual && dataLesson.getFullYear() === anoAtual;
        } catch (e) { return false; }
      });
    } else { 
      aulasFiltradasPorPeriodo = [...student.lessons];
    }

    const aulasFiltradasPorStatus = aulasFiltradasPorPeriodo.filter(lesson =>
      selectedStatuses.includes(lesson.status || 'Pendente')
    );

    return aulasFiltradasPorStatus.sort((a, b) => {
      try {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`);
        return dateB - dateA; 
      } catch (e) { return 0; }
    });
  }, [student, aulaPeriodFilter, selectedStatuses]);

  const handleDeleteStudent = async () => {
    if (!currentUser || !student) {
      if(showToast) showToast("Não foi possível identificar o professor ou aluno.", "error");
      return;
    }
    if (confirm(`Tem certeza que deseja deletar o aluno "${student.name}" e todas as suas aulas (lessons)?`)) {
      try {
        await deleteStudentFromDb(currentUser.uid, student.id);
        if(showToast) showToast(`Aluno "${student.name}" deletado.`, 'success');
        onClose();
      } catch (error) {
        console.error("Erro ao deletar aluno:", error);
        if(showToast) showToast(error.message || "Erro ao deletar aluno.", "error");
      }
    }
  };

  const handleMarkLessonStatus = async (lessonId, newStatus) => {
    if (!currentUser || !student) {
        if(showToast) showToast("Não foi possível identificar o professor ou aluno.", "error");
        return;
    }
    try {
      await updateLessonStatusInDb(currentUser.uid, student.id, lessonId, newStatus); 
      if(showToast) showToast(`Aula (Lesson) marcada como ${newStatus.toLowerCase()}.`, 'success');
    } catch (error) {
      if(showToast) showToast(error.message || `Erro ao marcar aula (lesson) como ${newStatus.toLowerCase()}.`, 'error');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!currentUser || !student) {
        if(showToast) showToast("Não foi possível identificar o professor ou aluno.", "error");
        return;
    }
    if (confirm('Tem certeza que deseja deletar esta aula (lesson)?')) {
      try {
        await deleteLessonFromDb(currentUser.uid, student.id, lessonId);
        if(showToast) showToast('Aula (Lesson) deletada com sucesso.', 'success');
      } catch (error) {
        if(showToast) showToast(error.message || 'Erro ao deletar aula (lesson).', 'error');
      }
    }
  };

  if (!isOpen || !student) {
    return null; 
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Completa': return { style: "bg-blue-100 text-blue-800 border-blue-500 ring-blue-500", icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" />, text: "Completa" };
      case 'Paga': return { style: "bg-green-100 text-green-800 border-green-500 ring-green-500", icon: <DollarSign className="h-3.5 w-3.5 mr-1.5" />, text: "Paga" };
      case 'Falta': return { style: "bg-red-100 text-red-800 border-red-500 ring-red-500", icon: <AlertCircle className="h-3.5 w-3.5 mr-1.5" />, text: "Falta" };
      default: return { style: "bg-yellow-100 text-yellow-800 border-yellow-500 ring-yellow-500", icon: <Clock className="h-3.5 w-3.5 mr-1.5" />, text: "Pendente" };
    }
  };
  
  const selectedStatusesText = selectedStatuses.length === ALL_POSSIBLE_STATUSES.length 
    ? "Todos Status" 
    : selectedStatuses.length === 0 
    ? "Nenhum Status" 
    : `${selectedStatuses.length} Status Selecionado(s)`;

  const baseButtonFilterStyle = "inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
  const activePeriodFilterStyle = "bg-indigo-600 text-white border-transparent focus:ring-indigo-500";
  const inactivePeriodFilterStyle = "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-400";


  return (
    <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
      <div className="relative mx-auto border border-gray-200 w-full max-w-4xl shadow-xl rounded-lg bg-white">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
            <h3 className="text-2xl leading-6 font-semibold text-gray-900">
              {student.name}
            </h3>
            <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6 text-sm">
            <div>
              <span className="font-medium text-gray-500 block">Email do Aluno:</span>
              <span className="text-gray-700 break-all">{student.studentEmail || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 block">Link Padrão da Aula:</span>
              {student.lessonLink ? (
                <a href={student.lessonLink.startsWith('http') ? student.lessonLink : `https://${student.lessonLink}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline break-all">
                  {student.lessonLink} <LinkIcon size={12} className="inline ml-1"/>
                </a>
              ) : (
                <span className="text-gray-700">N/A</span>
              )}
            </div>
            <div>
              <span className="font-medium text-gray-500 block">Valor por Aula (Lesson):</span>
              <span className="text-gray-700">{formatCurrency(student.lessonValue)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 block">Dia de Pagamento:</span>
              <span className="text-gray-700">{student.paymentDay || 'N/D'}</span>
            </div>
          </div>


          <div className="flex items-center space-x-2 flex-wrap gap-2 mb-6 border-b border-gray-200 pb-6">
            <button onClick={() => onOpenAddAula(student.id)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" title="Adicionar Aula Única"><CalendarPlus className="h-5 w-5 mr-2" /> Add Aula</button>
            <button onClick={() => onOpenAddAulaLote(student.id)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" title="Cadastrar Aulas em Lote"><CalendarCheck className="h-5 w-5 mr-2" /> Em Lote</button>
            <button onClick={handleDeleteStudent} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" title="Deletar Aluno"><Trash2 className="h-5 w-5 mr-2 text-red-500" /> Deletar Aluno</button>
          </div>

          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h4 className="text-lg font-medium text-gray-800 flex items-center mb-3 sm:mb-0">
                    <Filter size={18} className="mr-2 text-gray-500"/>Filtros do Histórico
                </h4>
                <div className="flex space-x-2">
                    <button 
                        type="button" 
                        onClick={() => setAulaPeriodFilter('currentMonth')} 
                        className={`${baseButtonFilterStyle} ${aulaPeriodFilter === 'currentMonth' ? activePeriodFilterStyle : inactivePeriodFilterStyle}`}
                    >
                        Mês Atual
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setAulaPeriodFilter('all')} 
                        className={`${baseButtonFilterStyle} ${aulaPeriodFilter === 'all' ? activePeriodFilterStyle : inactivePeriodFilterStyle}`}
                    >
                        Todas
                    </button>
                </div>
            </div>
            
            <div className="relative" ref={statusDropdownRef}>
                <div className="flex items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 mr-2">Status das Aulas:</span>
                    <button
                        type="button"
                        onClick={() => setIsStatusDropdownOpen(prev => !prev)}
                        className="inline-flex items-center justify-between w-full sm:w-auto px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                    >
                        {selectedStatusesText}
                        <ChevronDown className={`ml-2 h-4 w-4 transform transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                {isStatusDropdownOpen && (
                    <div className="absolute left-0 sm:left-auto right-0 sm:right-auto mt-1 w-full sm:w-56 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-20">
                        {ALL_POSSIBLE_STATUSES.map(status => {
                            const statusInfo = getStatusInfo(status);
                            return (
                                <label key={status} className={`flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer ${selectedStatuses.includes(status) ? statusInfo.style.split(' ')[0] + ' ' + statusInfo.style.split(' ')[1] : 'text-gray-800'}`}>
                                    <input type="checkbox" checked={selectedStatuses.includes(status)} onChange={() => handleStatusFilterChange(status)} className={`form-checkbox h-4 w-4 rounded mr-2.5 text-indigo-600 border-gray-300 focus:ring-indigo-500`}/>
                                    {statusInfo.icon}
                                    {statusInfo.text}
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>
          </div>

          <h4 className="text-xl font-medium text-gray-800 mb-3">Histórico de Aulas (Lessons)</h4>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
            {filteredAndSortedAulas.length === 0 ? (
              <p className="text-gray-500 text-sm italic py-4 text-center">Nenhuma aula encontrada com os filtros selecionados.</p>
            ) : (
              filteredAndSortedAulas.map((lesson) => {
                const statusAtual = lesson.status || 'Pendente';
                const badgeInfo = getStatusInfo(statusAtual);
                const canMarkComplete = statusAtual !== 'Completa' && statusAtual !== 'Paga' && statusAtual !== 'Falta';
                const canMarkPaid = statusAtual !== 'Paga' && statusAtual !== 'Falta';
                const canMarkAbsent = statusAtual !== 'Falta' && statusAtual !== 'Completa' && statusAtual !== 'Paga';
                const canMarkPending = statusAtual !== 'Pendente' && statusAtual !== 'Completa' && statusAtual !== 'Paga';

                return (
                  <div key={lesson.id} className="p-3 rounded-md bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-2 hover:shadow-md transition-shadow">
                    <div className="flex-grow">
                      <div className="font-medium text-gray-800">{formatDate(lesson.date)} {lesson.time ? `às ${lesson.time}` : ''}<span className="text-xs text-gray-500 ml-1">({formatDuration(lesson.duration)})</span></div>
                      <div className="text-sm text-gray-600">Valor: {formatCurrency(lesson.value)}</div>
                      <div className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-l-4 ${badgeInfo.style}`}>{badgeInfo.icon}{badgeInfo.text}</div>
                    </div>
                    <div className="aula-actions flex-shrink-0 flex flex-wrap gap-1 items-center self-start sm:self-center mt-2 sm:mt-0">
                      {canMarkComplete && <button onClick={() => handleMarkLessonStatus(lesson.id, 'Completa')} className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400" title="Marcar como Completa"><CheckCircle className="h-5 w-5" /></button>}
                      {canMarkPaid && <button onClick={() => handleMarkLessonStatus(lesson.id, 'Paga')} className="p-1.5 rounded-md hover:bg-green-100 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400" title="Marcar como Paga"><DollarSign className="h-5 w-5" /></button>}
                      {canMarkAbsent && <button onClick={() => handleMarkLessonStatus(lesson.id, 'Falta')} className="p-1.5 rounded-md hover:bg-red-100 text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400" title="Marcar como Falta"><AlertCircle className="h-5 w-5" /></button>}
                      {statusAtual !== 'Pendente' && canMarkPending && <button onClick={() => handleMarkLessonStatus(lesson.id, 'Pendente')} className="p-1.5 rounded-md hover:bg-yellow-100 text-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" title="Marcar como Pendente"><Clock className="h-5 w-5" /></button>}
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400" title="Deletar Aula"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}