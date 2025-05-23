'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    deleteAulaFromDb, 
    deleteStudentFromDb, 
    updateAulaStatusInDb 
} from '../utils/api'; // Funções da API para interagir com o DB
import { formatCurrency, formatDate, formatDuration } from '../utils/formatters';
import { X, CalendarPlus, CalendarCheck, Trash2, CheckCircle, DollarSign, AlertCircle, Clock } from 'lucide-react';

export default function StudentDetailModal({ isOpen, onClose, studentId, onOpenAddAula, onOpenAddAulaLote, showToast }) {
  const { currentUser, teacherData } = useAuth();

  const [student, setStudent] = useState(null);
  const [aulaFilter, setAulaFilter] = useState('currentMonth');

  useEffect(() => {
    if (isOpen && studentId && teacherData && teacherData.students) {
      const foundStudent = teacherData.students.find(s => s.id === studentId);
      setStudent(foundStudent || null);
      if (!foundStudent) {
        console.warn("StudentDetailModal: Aluno com ID", studentId, "não encontrado nos dados do professor.");
        // onClose(); // Opcional: fechar se o aluno não for encontrado
      }
    } else if (!isOpen) {
      setStudent(null); 
      setAulaFilter('currentMonth'); // Reseta o filtro ao fechar
    }
  }, [isOpen, studentId, teacherData]); // Adicionado onClose à lista de dependências se ele puder mudar

  const filteredAndSortedAulas = useMemo(() => {
    if (!student || !Array.isArray(student.aulas)) return [];
    let aulasFiltradas = [];
    if (aulaFilter === 'currentMonth') {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      aulasFiltradas = student.aulas.filter(aula => {
        try {
          const dataAula = new Date(aula.data + 'T00:00:00');
          return dataAula.getMonth() === mesAtual && dataAula.getFullYear() === anoAtual;
        } catch (e) { return false; }
      });
    } else {
      aulasFiltradas = [...student.aulas];
    }
    return aulasFiltradas.sort((a, b) => {
      try {
        const dateA = new Date(`${a.data}T${a.horario || '00:00'}:00`);
        const dateB = new Date(`${b.data}T${b.horario || '00:00'}:00`);
        return dateB - dateA;
      } catch (e) { return 0; }
    });
  }, [student, aulaFilter]);

  const handleDeleteStudent = async () => {
    if (!currentUser || !student) {
      if(showToast) showToast("Não foi possível identificar o professor ou aluno.", "error");
      return;
    }
    if (confirm(`Tem certeza que deseja deletar o aluno "${student.nome}" e todas as suas aulas?`)) {
      try {
        await deleteStudentFromDb(currentUser.uid, student.id);
        if(showToast) showToast(`Aluno "${student.nome}" deletado.`, 'success');
        onClose();
      } catch (error) {
        console.error("Erro ao deletar aluno:", error);
        if(showToast) showToast(error.message || "Erro ao deletar aluno.", "error");
      }
    }
  };

  const handleMarcarStatusAula = async (aulaId, novoStatus) => {
    if (!currentUser || !student) {
        if(showToast) showToast("Não foi possível identificar o professor ou aluno.", "error");
        return;
    }
    try {
      await updateAulaStatusInDb(currentUser.uid, student.id, aulaId, novoStatus);
      if(showToast) showToast(`Aula marcada como ${novoStatus.toLowerCase()}.`, 'success');
    } catch (error) {
      if(showToast) showToast(error.message || `Erro ao marcar aula como ${novoStatus.toLowerCase()}.`, 'error');
    }
  };

  const handleDeleteAula = async (aulaId) => {
    if (!currentUser || !student) {
        if(showToast) showToast("Não foi possível identificar o professor ou aluno.", "error");
        return;
    }
    if (confirm('Tem certeza que deseja deletar esta aula?')) {
      try {
        await deleteAulaFromDb(currentUser.uid, student.id, aulaId);
        if(showToast) showToast('Aula deletada com sucesso.', 'success');
      } catch (error) {
        if(showToast) showToast(error.message || 'Erro ao deletar aula.', 'error');
      }
    }
  };

  if (!isOpen || !student) {
    return null; 
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completa': return { style: "bg-blue-100 text-blue-800 border-blue-500", icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" />, text: "Completa" };
      case 'Paga': return { style: "bg-green-100 text-green-800 border-green-500", icon: <DollarSign className="h-3.5 w-3.5 mr-1.5" />, text: "Paga" };
      case 'Falta': return { style: "bg-red-100 text-red-800 border-red-500", icon: <AlertCircle className="h-3.5 w-3.5 mr-1.5" />, text: "Falta" };
      default: return { style: "bg-yellow-100 text-yellow-800 border-yellow-500", icon: <Clock className="h-3.5 w-3.5 mr-1.5" />, text: "Pendente" };
    }
  };

  return (
    // --- INVÓLUCRO DO MODAL COM BACKDROP ---
    <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
      <div className="relative mx-auto border border-gray-200 w-full max-w-3xl shadow-xl rounded-lg bg-white">
        <div className="p-6 max-h-[85vh] overflow-y-auto"> {/* Conteúdo rolável */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
            <h3 className="text-2xl leading-6 font-semibold text-gray-900">
              {student.nome}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <div>
              <span className="font-medium text-sm text-gray-600 block">Valor por Aula:</span>
              <span className="text-gray-800 text-lg">{formatCurrency(student.valorAula)}</span>
            </div>
            <div>
              <span className="font-medium text-sm text-gray-600 block">Dia de Pagamento:</span>
              <span className="text-gray-800 text-lg">{student.diaPagamento || 'N/D'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2 mb-6 border-b border-gray-200 pb-6">
            <button
              onClick={() => onOpenAddAula(student.id)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Adicionar Aula Única"
            >
              <CalendarPlus className="h-5 w-5 mr-2" /> Add Aula
            </button>
            <button
              onClick={() => onOpenAddAulaLote(student.id)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              title="Cadastrar Aulas em Lote"
            >
              <CalendarCheck className="h-5 w-5 mr-2" /> Em Lote
            </button>
            <button
              onClick={handleDeleteStudent}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Deletar Aluno"
            >
              <Trash2 className="h-5 w-5 mr-2 text-red-500" /> Deletar Aluno
            </button>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-medium text-gray-800">Histórico de Aulas</h4>
            <div className="flex space-x-1 border border-gray-300 rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setAulaFilter('currentMonth')}
                className={`filter-button ${aulaFilter === 'currentMonth' ? 'active' : ''}`}
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => setAulaFilter('all')}
                className={`filter-button ${aulaFilter === 'all' ? 'active' : ''}`}
              >
                Todas
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {filteredAndSortedAulas.length === 0 ? (
              <p className="text-gray-500 text-sm italic py-4 text-center">
                {aulaFilter === 'currentMonth' ? 'Nenhuma aula registrada para este mês.' : 'Nenhuma aula registrada.'}
              </p>
            ) : (
              filteredAndSortedAulas.map((aula) => {
                const statusAtual = aula.status || 'Pendente';
                const badge = getStatusBadge(statusAtual);
                const canMarkComplete = statusAtual !== 'Completa' && statusAtual !== 'Paga' && statusAtual !== 'Falta';
                const canMarkPaid = statusAtual !== 'Paga' && statusAtual !== 'Falta';
                const canMarkAbsent = statusAtual !== 'Falta' && statusAtual !== 'Completa' && statusAtual !== 'Paga';
                const canMarkPending = statusAtual !== 'Pendente' && statusAtual !== 'Completa' && statusAtual !== 'Paga';

                return (
                  <div key={aula.id} className="p-3 rounded-md bg-gray-50 border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex-grow">
                      <div className="font-medium text-gray-800">
                        {formatDate(aula.data)} {aula.horario ? `às ${aula.horario}` : ''}
                        <span className="text-xs text-gray-500 ml-1">({formatDuration(aula.duracao)})</span>
                      </div>
                      <div className="text-sm text-gray-600">Valor: {formatCurrency(aula.valor)}</div>
                      <div className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-l-4 ${badge.style}`}>
                        {badge.icon}
                        {badge.text}
                      </div>
                    </div>
                    <div className="aula-actions flex-shrink-0 flex flex-wrap gap-1 items-center self-start sm:self-center mt-2 sm:mt-0">
                      {canMarkComplete && <button onClick={() => handleMarcarStatusAula(aula.id, 'Completa')} className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400" title="Marcar como Completa"><CheckCircle className="h-5 w-5" /></button>}
                      {canMarkPaid && <button onClick={() => handleMarcarStatusAula(aula.id, 'Paga')} className="p-1.5 rounded-md hover:bg-green-100 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400" title="Marcar como Paga"><DollarSign className="h-5 w-5" /></button>}
                      {canMarkAbsent && <button onClick={() => handleMarcarStatusAula(aula.id, 'Falta')} className="p-1.5 rounded-md hover:bg-red-100 text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400" title="Marcar como Falta"><AlertCircle className="h-5 w-5" /></button>}
                      {statusAtual !== 'Pendente' && canMarkPending && <button onClick={() => handleMarcarStatusAula(aula.id, 'Pendente')} className="p-1.5 rounded-md hover:bg-yellow-100 text-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" title="Marcar como Pendente"><Clock className="h-5 w-5" /></button>}
                      <button onClick={() => handleDeleteAula(aula.id)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400" title="Deletar Aula"><Trash2 className="h-5 w-5" /></button>
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