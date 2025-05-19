'use client'; // Necessário para hooks

import React, { useMemo } from 'react';
// --- Usando caminho relativo ---
import useAppStore from '../store/useAppStore';
// --- Fim da correção ---
import { formatCurrency } from '../utils/formatters'; // Importa a função de formatação
import { LayoutDashboard } from 'lucide-react'; // Ícone

export default function Dashboard() {
  // --- SELEÇÃO DE ESTADO ATUALIZADA PARA REATIVIDADE ---
  const teachers = useAppStore((state) => state.teachers);
  const loggedInTeacherId = useAppStore((state) => state.loggedInTeacherId);

  const teacher = useMemo(() => {
    if (!loggedInTeacherId || !Array.isArray(teachers)) return null;
    return teachers.find(t => t.id === loggedInTeacherId) || null;
  }, [teachers, loggedInTeacherId]);

  const students = useMemo(() => teacher?.students || [], [teacher]);
  // --- FIM DA ATUALIZAÇÃO DA SELEÇÃO DE ESTADO ---


  // Calcula as métricas do dashboard usando useMemo para otimização
  const dashboardMetrics = useMemo(() => {
    let totalAReceberCompletas = 0;
    let totalRecebidoMes = 0;
    let totalAtrasado = 0;
    let totalAulasMes = 0;
    let totalFaltasMes = 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const diaAtual = hoje.getDate();

    if (!Array.isArray(students)) return { // Retorna zero se não houver alunos
        totalAReceberCompletas, totalRecebidoMes, totalAtrasado, totalAulasMes, totalFaltasMes
    };

    students.forEach(aluno => {
      const diaPagamentoAluno = (typeof aluno.diaPagamento === 'number' && aluno.diaPagamento >= 1 && aluno.diaPagamento <= 31) ? aluno.diaPagamento : 32;
      if (!Array.isArray(aluno.aulas)) return; 

      aluno.aulas.forEach(aula => {
        try {
          const dataAula = new Date(aula.data + 'T00:00:00');
          if (isNaN(dataAula.getTime())) {
              console.warn("Data de aula inválida encontrada no Dashboard:", aula.data);
              return; 
          }

          const mesAula = dataAula.getMonth();
          const anoAula = dataAula.getFullYear();
          const isCurrentMonth = anoAula === anoAtual && mesAula === mesAtual;

          if (isCurrentMonth && aula.status === 'Completa' && aula.status !== 'Paga') {
            totalAReceberCompletas += aula.valor;
          }
          if (isCurrentMonth && aula.status === 'Paga') {
            totalRecebidoMes += aula.valor;
          }
          const isUnpaidOrAbsent = aula.status !== 'Paga' && aula.status !== 'Falta';
          if (isUnpaidOrAbsent) {
            let isOverdue = false;
            if (anoAula < anoAtual || (anoAula === anoAtual && mesAula < mesAtual)) {
              isOverdue = true;
            } else if (anoAula === anoAtual && mesAula === mesAtual && diaAtual > diaPagamentoAluno) {
              isOverdue = true;
            }
            if (isOverdue) {
              totalAtrasado += aula.valor;
            }
          }
          if (isCurrentMonth) {
            totalAulasMes++;
          }
          if (isCurrentMonth && aula.status === 'Falta') {
            totalFaltasMes++;
          }
        } catch (e) {
          console.error("Erro ao processar aula no dashboard:", aula, e);
        }
      });
    });

    return {
      totalAReceberCompletas,
      totalRecebidoMes,
      totalAtrasado,
      totalAulasMes,
      totalFaltasMes,
    };
  }, [students]); // Dependência principal agora é 'students' que é derivado de 'teacher'

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"> {/* Texto do título principal mais escuro */}
        <LayoutDashboard className="mr-2 text-blue-600 h-5 w-5" /> Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-700"> {/* Título da métrica mais escuro */}
            <span>A Receber (Compl./Mês):</span>
            <span className="font-bold text-blue-700 block text-lg"> {/* Valor da métrica mais escuro e maior */}
              {formatCurrency(dashboardMetrics.totalAReceberCompletas)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Aulas 'Completas' do mês atual não pagas.</p>
        </div>
        {/* Card 2 */}
        <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
          <div className="text-sm text-gray-700">
            <span>Recebido (Este Mês):</span>
            <span className="font-bold text-cyan-700 block text-lg">
              {formatCurrency(dashboardMetrics.totalRecebidoMes)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Soma das aulas 'Pagas' no mês atual.</p>
        </div>
        {/* Card 3 */}
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-gray-700">
            <span>Valor Atrasado:</span>
            <span className="font-bold text-red-700 block text-lg">
              {formatCurrency(dashboardMetrics.totalAtrasado)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Aulas não pagas/faltas de meses anteriores ou após dia pag.</p>
        </div>
        {/* Card 4 */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-gray-700">
            <span>Aulas (Este Mês):</span>
            <span className="font-bold text-green-700 block text-lg">
              {dashboardMetrics.totalAulasMes}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total de aulas agendadas para o mês atual.</p>
        </div>
        {/* Card 5 */}
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-sm text-gray-700">
            <span>Faltas (Este Mês):</span>
            <span className="font-bold text-orange-700 block text-lg">
              {dashboardMetrics.totalFaltasMes}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total de aulas marcadas como 'Falta' no mês atual.</p>
        </div>
      </div>
    </div>
  );
}