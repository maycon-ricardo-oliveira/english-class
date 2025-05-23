'use client'; // Necessário para hooks

import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate, formatDuration } from '../utils/formatters';
import { X, CalendarPlus, CalendarCheck, Trash2, CheckCircle, DollarSign, AlertCircle, Clock } from 'lucide-react'; // Ícones adicionados

export default function StudentDetailModal({ isOpen, onClose, studentId, onOpenAddAula, onOpenAddAulaLote, showToast }) {
  // Ações e seletores do store



  // --- FIM DA ALTERAÇÃO ---

  // Estado local para o filtro de aulas
  const [aulaFilter, setAulaFilter] = useState('currentMonth');

  // Efeito para resetar o filtro quando o modal abre ou o studentId (prop) muda
  useEffect(() => {
    if (isOpen) {
      setAulaFilter('currentMonth'); // Reseta o filtro para o padrão
    }
  }, [isOpen, studentId]); // Depende de isOpen e studentId (prop)


  // Filtra e ordena as aulas (agora usa o 'student' reativo do store)
  const filteredAndSortedAulas = useMemo(() => {
    if (!student || !Array.isArray(student.aulas)) return [];

    let aulasParaFiltrar = [...student.aulas];
    let aulasFiltradas = [];

    if (aulaFilter === 'currentMonth') {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      aulasFiltradas = aulasParaFiltrar.filter(aula => {
        try {
          const dataAula = new Date(aula.data + 'T00:00:00');
          return dataAula.getMonth() === mesAtual && dataAula.getFullYear() === anoAtual;
        } catch (e) { return false; }
      });
    } else { // aulaFilter === 'all'
      aulasFiltradas = aulasParaFiltrar;
    }

    return aulasFiltradas.sort((a, b) => {
      try {
        const dateA = new Date(`${a.data}T${a.horario || '00:00'}:00`);
        const dateB = new Date(`${b.data}T${b.horario || '00:00'}:00`);
        return dateB - dateA; // Mais recentes primeiro
      } catch (e) { return 0; }
    });
  }, [student, aulaFilter]); // Depende do 'student' do store e do filtro local

  // Lida com a exclusão do aluno
  const handleDeleteStudent = () => {
    if (student && confirm(`Tem certeza que deseja deletar o aluno "${student.nome}" e todas as suas aulas?`)) {
      deleteStudentAction(student.id);
      showToast(`Aluno "${student.nome}" deletado.`, 'success');
      onClose(); // Fecha o modal após deletar
    }
  };

  // Função para marcar status, agora usando showToast
  const handleMarcarStatusAula = (aulaId, novoStatus) => {
    if(!student) return;
    try {
        updateAulaStatus(student.id, aulaId, novoStatus);
        showToast(`Aula marcada como ${novoStatus.toLowerCase()}.`, 'success');
        // A re-renderização da lista é garantida porque 'student' (do store) mudará
    } catch (error) {
        showToast(error.message || `Erro ao marcar aula como ${novoStatus.toLowerCase()}.`, 'error');
    }
  };

  const handleDeleteAula = (aulaId) => {
    if(!student) return;
    if (confirm('Tem certeza que deseja deletar esta aula?')) {
        try {
            deleteAulaAction(student.id, aulaId);
            showToast('Aula deletada com sucesso.', 'success');
             // A re-renderização da lista é garantida
        } catch (error) {
            showToast(error.message || 'Erro ao deletar aula.', 'error');
        }
    }
  };


  if (!isOpen || !student) {
    // Se o modal não deve estar aberto ou o aluno não foi encontrado (pode acontecer brevemente ou se ID for inválido),
    // não renderiza nada ou um loader.
    return null;
  }

  // Função para obter o estilo e ícone do status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completa':
        return {
          style: "bg-blue-100 text-blue-700 border-blue-500",
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          text: "Completa"
        };
      case 'Paga':
        return {
          style: "bg-green-100 text-green-700 border-green-500",
          icon: <DollarSign className="h-4 w-4 mr-1" />,
          text: "Paga"
        };
      case 'Falta':
        return {
          style: "bg-red-100 text-red-700 border-red-500",
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          text: "Falta"
        };
      case 'Pendente':
      default:
        return {
          style: "bg-yellow-100 text-yellow-800 border-yellow-500",
          icon: <Clock className="h-4 w-4 mr-1" />,
          text: "Pendente"
        };
    }
  };


  return (
    <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm  overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
      <div className="relative mx-auto border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="modal-content p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-xl leading-6 font-semibold text-gray-900">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span className="font-medium text-sm text-gray-500 block">Valor/Aula:</span>
              <span className="text-gray-800">{formatCurrency(student.valorAula)}</span>
            </div>
            <div>
              <span className="font-medium text-sm text-gray-500 block">Dia Pagamento:</span>
              <span className="text-gray-800">{student.diaPagamento || 'N/D'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-1 mb-6 border-b pb-4">
            <button
              onClick={() => onOpenAddAula(student.id)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Adicionar Aula Única"
            >
              <CalendarPlus className="h-4 w-4 mr-1" /> Add Aula
            </button>
            <button
              onClick={() => onOpenAddAulaLote(student.id)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              title="Cadastrar Aulas em Lote"
            >
              <CalendarCheck className="h-4 w-4 mr-1" /> Em Lote
            </button>
            <button
              onClick={handleDeleteStudent}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Deletar Aluno"
            >
              <Trash2 className="h-4 w-4 mr-1 text-red-500" /> Deletar Aluno
            </button>
          </div>

          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-medium text-gray-800">Histórico de Aulas</h4>
            <div className="flex space-x-1  p-0.5">
              <button
                type="button"
                onClick={() => setAulaFilter('currentMonth')}
                className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-200 view-button  filter-button ${aulaFilter === 'currentMonth' ? 'active' : ''}`}
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => setAulaFilter('all')}
                className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-200 view-button  filter-button ${aulaFilter === 'all' ? 'active' : ''}`}
              >
                Todas
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredAndSortedAulas.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
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
                  <div key={aula.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-md bg-white border border-gray-200 shadow-sm`}>
                    <div className="flex-grow mb-2 sm:mb-0 mr-2">
                      <div className="font-medium text-sm text-gray-800">
                        {formatDate(aula.data)} {aula.horario ? `às ${aula.horario}` : ''}
                        <span className="text-xs text-gray-500 ml-1">({formatDuration(aula.duracao)})</span>
                      </div>
                      <div className="text-sm text-gray-600">Valor: {formatCurrency(aula.valor)}</div>
                       <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-l-4 ${badge.style}`}>
                        {badge.icon}
                        {badge.text}
                      </div>
                    </div>
                    <div className="aula-actions text-gray-700 flex-shrink-0 flex flex-wrap gap-1 items-center mt-2 sm:mt-0">
                      {canMarkComplete && <button onClick={() => handleMarcarStatusAula(aula.id, 'Completa')} className="aula-action-button btn-completa text-blue-900 my-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-l-4 bg-blue-100 text-blue-700 border-blue-500" title="Completa"><CheckCircle className="h-4 w-4" /></button>}
                      {canMarkPaid && <button onClick={() => handleMarcarStatusAula(aula.id, 'Paga')} className="aula-action-button btn-paga text-green-900 mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-l-4 bg-green-100 text-green-700 border-green-500" title="Paga"><DollarSign className="h-4 w-4" /></button>}
                      {canMarkAbsent && <button onClick={() => handleMarcarStatusAula(aula.id, 'Falta')} className="aula-action-button btn-falta text-red-900 mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-l-4 bg-red-100 text-red-700 border-red-500" title="Falta"><AlertCircle className="h-4 w-4" /></button>}
                      {statusAtual !== 'Pendente' && canMarkPending && <button onClick={() => handleMarcarStatusAula(aula.id, 'Pendente')} className="aula-action-button btn-pendente mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-l-4 bg-yellow-100 text-yellow-800 border-yellow-500" title="Pendente"><Clock className="h-4 w-4" /></button>}
                      <button onClick={() => handleDeleteAula(aula.id)} className="aula-action-button bg-gray-400 hover:bg-gray-500 text-white mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-l-4 bg-gray-100 text-gray-700 border-gray-500" title="Deletar"><Trash2 className="h-4 w-4" /></button>
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
