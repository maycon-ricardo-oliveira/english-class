'use client';

import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  const { teacherData, isLoadingAuth, isLoadingData } = useAuth();
  const students = useMemo(() => teacherData?.students || [], [teacherData]);

  const dashboardMetrics = useMemo(() => {
    console.log("Dashboard: Recalculando métricas. Alunos recebidos:", students); // DEBUG
    let totalAReceberCompletas = 0;
    let totalRecebidoMes = 0;
    let totalAtrasado = 0;
    let totalLessonsMes = 0;
    let totalFaltasMes = 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const diaAtual = hoje.getDate();

    if (!Array.isArray(students)) {
        console.warn("Dashboard: 'students' não é um array ou é nulo.", students);
        return { totalAReceberCompletas, totalRecebidoMes, totalAtrasado, totalLessonsMes, totalFaltasMes };
    }

    students.forEach((student, studentIndex) => {
      console.log(`Dashboard: Processando aluno ${studentIndex}:`, student.name, student); // DEBUG
      const diaPagamentoAluno = (typeof student.paymentDay === 'number' && student.paymentDay >= 1 && student.paymentDay <= 31) 
                                ? student.paymentDay 
                                : 32;
      
      const lessons = Array.isArray(student.lessons) ? student.lessons : [];
      if (lessons.length === 0 && student.lessons) { // Se lessons era um objeto vazio no DB
          console.log(`Dashboard: Aluno ${student.name} tem um objeto 'lessons' vazio, tratando como sem aulas.`);
      }


      lessons.forEach((lesson, lessonIndex) => {
        console.log(`Dashboard: Processando lesson ${lessonIndex} do aluno ${student.name}:`, lesson); // DEBUG
        try {
          if (!lesson || typeof lesson.date !== 'string' || typeof lesson.value !== 'number' || typeof lesson.status !== 'string') {
            console.warn("Dashboard: Lesson com dados inválidos ou faltando:", lesson);
            return; // Pula esta lesson se os dados essenciais estiverem faltando
          }

          const dataLesson = new Date(lesson.date + 'T00:00:00');
          if (isNaN(dataLesson.getTime())) {
              console.warn("Dashboard: Data de lesson inválida:", lesson.date);
              return; 
          }

          const mesLesson = dataLesson.getMonth();
          const anoLesson = dataLesson.getFullYear();
          const isCurrentMonth = anoLesson === anoAtual && mesLesson === mesAtual;
          const lessonValue = lesson.value; // Já é um número

          if (isCurrentMonth && lesson.status === 'Completa' && lesson.status !== 'Paga') {
            totalAReceberCompletas += lessonValue;
          }
          if (isCurrentMonth && lesson.status === 'Paga') {
            totalRecebidoMes += lessonValue;
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
              totalAtrasado += lessonValue;
            }
          }
          if (isCurrentMonth) {
            totalLessonsMes++;
          }
          if (isCurrentMonth && lesson.status === 'Falta') {
            totalFaltasMes++;
          }
        } catch (e) {
          console.error("Erro ao processar lesson no dashboard:", lesson, e);
        }
      });
    });

    console.log("Dashboard: Métricas calculadas:", { totalAReceberCompletas, totalRecebidoMes, totalAtrasado, totalLessonsMes, totalFaltasMes }); // DEBUG
    return {
      totalAReceberCompletas,
      totalRecebidoMes,
      totalAtrasado,
      totalLessonsMes,
      totalFaltasMes,
    };
  }, [students]);

  if (isLoadingAuth || isLoadingData) { // Simplificado: se auth ou data estiver carregando
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <LayoutDashboard className="mr-2 text-blue-600 h-5 w-5" /> Dashboard
            </h2>
            <p className="text-gray-500 italic">Carregando dados do dashboard...</p>
        </div>
    );
  }
  
  if (!teacherData) {
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
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
        <LayoutDashboard className="mr-2 text-blue-600 h-5 w-5" /> Dashboard
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="text-sm text-gray-700 mb-1">A Receber (Compl./Mês)</div>
          <div className="font-bold text-blue-700 text-2xl">
            {formatCurrency(dashboardMetrics.totalAReceberCompletas)}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Aulas 'Completas' do mês atual não pagas.</p>
        </div>
        <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 shadow-sm">
          <div className="text-sm text-gray-700 mb-1">Recebido (Este Mês)</div>
          <div className="font-bold text-cyan-700 text-2xl">
            {formatCurrency(dashboardMetrics.totalRecebidoMes)}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Soma das aulas 'Pagas' no mês atual.</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
          <div className="text-sm text-gray-700 mb-1">Valor Atrasado</div>
          <div className="font-bold text-red-700 text-2xl">
            {formatCurrency(dashboardMetrics.totalAtrasado)}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Aulas não pagas/faltas de meses anteriores ou após dia pag.</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
          <div className="text-sm text-gray-700 mb-1">Aulas (Este Mês)</div>
          <div className="font-bold text-green-700 text-2xl">
            {dashboardMetrics.totalLessonsMes}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Total de aulas (lessons) agendadas para o mês atual.</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 shadow-sm">
          <div className="text-sm text-gray-700 mb-1">Faltas (Este Mês)</div>
          <div className="font-bold text-orange-700 text-2xl">
            {dashboardMetrics.totalFaltasMes}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">Total de aulas marcadas como 'Falta' no mês atual.</p>
        </div>
      </div>
    </div>
  );
}
