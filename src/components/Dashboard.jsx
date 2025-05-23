'use client';

import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext'; // Importa o hook useAuth
import { formatCurrency } from '../utils/formatters';
import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  // Usa o AuthContext para obter os dados do professor
  const { teacherData, isLoadingAuth, isLoadingData } = useAuth();

  // A lista de alunos agora vem de teacherData
  const students = useMemo(() => teacherData?.students || [], [teacherData]);

  const dashboardMetrics = useMemo(() => {
    let totalAReceberCompletas = 0;
    let totalRecebidoMes = 0;
    let totalAtrasado = 0;
    let totalLessonsMes = 0; // Alterado de totalAulasMes
    let totalFaltasMes = 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const diaAtual = hoje.getDate();

    if (!Array.isArray(students)) {
        return { totalAReceberCompletas, totalRecebidoMes, totalAtrasado, totalLessonsMes, totalFaltasMes };
    }

    students.forEach(aluno => {
      const diaPagamentoAluno = (typeof aluno.diaPagamento === 'number' && aluno.diaPagamento >= 1 && aluno.diaPagamento <= 31) ? aluno.diaPagamento : 32;
      // --- ALTERAÇÃO AQUI: aluno.aulas para aluno.lessons ---
      const lessons = Array.isArray(aluno.lessons) ? aluno.lessons : [];
      // --- FIM DA ALTERAÇÃO ---

      lessons.forEach(lesson => { // Itera sobre 'lessons'
        try {
          const dataLesson = new Date(lesson.data + 'T00:00:00');
          if (isNaN(dataLesson.getTime())) {
              console.warn("Dashboard: Data de lesson inválida encontrada:", lesson.data);
              return; 
          }

          const mesLesson = dataLesson.getMonth();
          const anoLesson = dataLesson.getFullYear();
          const isCurrentMonth = anoLesson === anoAtual && mesLesson === mesAtual;

          if (isCurrentMonth && lesson.status === 'Completa' && lesson.status !== 'Paga') {
            totalAReceberCompletas += lesson.valor;
          }
          if (isCurrentMonth && lesson.status === 'Paga') {
            totalRecebidoMes += lesson.valor;
          }
          const isUnpaidOrAbsent = lesson.status !== 'Paga' && lesson.status !== 'Falta';
          if (isUnpaidOrAbsent) {
            let isOverdue = false;
            if (anoLesson < anoAtual || (anoLesson === anoAtual && mesLesson < mesAtual)) {
              isOverdue = true;
            } else if (anoLesson === anoAtual && mesLesson === mesAtual && diaAtual > diaPagamentoAluno) {
              isOverdue = true;
            }
            if (isOverdue) {
              totalAtrasado += lesson.valor;
            }
          }
          if (isCurrentMonth) {
            totalLessonsMes++; // Alterado de totalAulasMes
          }
          if (isCurrentMonth && lesson.status === 'Falta') {
            totalFaltasMes++;
          }
        } catch (e) {
          console.error("Erro ao processar lesson no dashboard:", lesson, e);
        }
      });
    });

    return {
      totalAReceberCompletas,
      totalRecebidoMes,
      totalAtrasado,
      totalLessonsMes, // Alterado
      totalFaltasMes,
    };
  }, [students]); // Dependência: recalcula quando a lista de alunos (ou suas lessons) mudar

  // O Dashboard só deve ser renderizado pela HomePage quando os dados estiverem prontos.
  // Mas uma verificação extra não faz mal.
  if (isLoadingAuth || (teacherData && isLoadingData && !teacherData.students) ) { // Adicionado !teacherData.students para o caso de teacherData existir mas students não
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <LayoutDashboard className="mr-2 text-blue-600 h-5 w-5" /> Dashboard
            </h2>
            <p className="text-gray-500 italic">Carregando dados do dashboard...</p>
        </div>
    );
  }
  if (!teacherData) { // Se não há teacherData após o carregamento, algo está errado
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <LayoutDashboard className="mr-2 text-blue-600 h-5 w-5" /> Dashboard
            </h2>
            <p className="text-red-500 italic">Não foi possível carregar os dados do professor para o dashboard.</p>
        </div>
    );
  }


  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <LayoutDashboard className="mr-2 text-blue-600 h-5 w-5" /> Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"> {/* Ajustado para responsividade */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200"> {/* Aumentado padding */}
          <div className="text-sm text-gray-700">
            <span>A Receber (Compl./Mês):</span>
            <span className="font-bold text-blue-700 block text-xl mt-1"> {/* Tamanho e cor ajustados */}
              {formatCurrency(dashboardMetrics.totalAReceberCompletas)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Aulas 'Completas' do mês atual não pagas.</p>
        </div>
        <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
          <div className="text-sm text-gray-700">
            <span>Recebido (Este Mês):</span>
            <span className="font-bold text-cyan-700 block text-xl mt-1">
              {formatCurrency(dashboardMetrics.totalRecebidoMes)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Soma das aulas 'Pagas' no mês atual.</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-gray-700">
            <span>Valor Atrasado:</span>
            <span className="font-bold text-red-700 block text-xl mt-1">
              {formatCurrency(dashboardMetrics.totalAtrasado)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Aulas não pagas/faltas de meses anteriores ou após dia pag.</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-gray-700">
            <span>Aulas (Este Mês):</span> {/* Mudado para "Aulas" para consistência, mas usa totalLessonsMes */}
            <span className="font-bold text-green-700 block text-xl mt-1">
              {dashboardMetrics.totalLessonsMes}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Total de aulas (lessons) agendadas para o mês atual.</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-sm text-gray-700">
            <span>Faltas (Este Mês):</span>
            <span className="font-bold text-orange-700 block text-xl mt-1">
              {dashboardMetrics.totalFaltasMes}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Total de aulas marcadas como 'Falta' no mês atual.</p>
        </div>
      </div>
    </div>
  );
}