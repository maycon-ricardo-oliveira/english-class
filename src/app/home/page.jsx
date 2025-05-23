'use client';

import React, { useEffect, useState } from 'react';
// A useRouter já não é necessária aqui para o redirecionamento de autenticação
// import { useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { LogOut, UserPlus, Users } from 'lucide-react';

// Importa o novo hook de guarda de autenticação

// Importações de Componentes
import Dashboard from '../../components/Dashboard';
import CalendarSection from '../../components/CalendarSection';
import StudentForm from '../../components/StudentForm';
import StudentList from '../../components/StudentList';
import StudentDetailModal from '../../components/StudentDetailModal';
import AddAulaModal from '../../components/AddAulaModal';
import AddAulaLoteModal from '../../components/AddAulaLoteModal';
import Toast from '../../components/Toast';

export default function HomePage() {
  // Usa o hook de guarda de autenticação
  // Ele tratará do redirecionamento se o utilizador não estiver autenticado
  // e retornará true enquanto a verificação estiver em progresso.


  const [isMounted, setIsMounted] = useState(false); // Para garantir que o código do cliente execute após a montagem

  // Estados para modais
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isAddAulaModalOpen, setIsAddAulaModalOpen] = useState(false);
  const [isAddAulaLoteModalOpen, setIsAddAulaLoteModalOpen] = useState(false);
  const [studentForAulaModal, setStudentForAulaModal] = useState(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Estado para Toast
  const [toast, setToast] = useState({ message: '', type: '', isOpen: false });

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, isOpen: true, duration });
  };
  const closeToast = () => {
    setToast({ message: '', type: '', isOpen: false });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const handleLogout = async () => {
    try {
      await logoutTeacher();
      showToast('Logout realizado com sucesso!', 'success');
      // O useAuthGuard e o onAuthStateChanged no RootLayout tratarão do redirecionamento.
    } catch (error) {
      console.error("Erro no logout (HomePage):", error);
      showToast(error.message || 'Erro ao fazer logout.', 'error');
    }
  };

  // Funções de controlo de modal (sem alterações na lógica interna)
  const handleOpenStudentDetail = (studentId) => { setSelectedStudentId(studentId); setIsStudentDetailModalOpen(true); };
  const handleCloseStudentDetail = () => { setIsStudentDetailModalOpen(false); setSelectedStudentId(null); };
  const handleOpenAddAula = (studentId) => { setStudentForAulaModal(studentId); setIsStudentDetailModalOpen(false); setIsAddAulaModalOpen(true); };
  const handleCloseAddAula = () => { setIsAddAulaModalOpen(false); setStudentForAulaModal(null); if(selectedStudentId && !isAddAulaLoteModalOpen && !isAddStudentModalOpen) setIsStudentDetailModalOpen(true); };
  const handleOpenAddAulaLote = (studentId) => { setStudentForAulaModal(studentId); setIsStudentDetailModalOpen(false); setIsAddAulaLoteModalOpen(true); };
  const handleCloseAddAulaLote = () => { setIsAddAulaLoteModalOpen(false); setStudentForAulaModal(null); if(selectedStudentId && !isAddAulaModalOpen && !isAddStudentModalOpen) setIsStudentDetailModalOpen(true); };
  const handleOpenAddStudentModal = () => setIsAddStudentModalOpen(true);
  const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false);


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Página Inicial</h1>
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-300 mr-3">
            Olá, <span className="font-medium text-gray-800 dark:text-gray-100">{'Professor'}</span>!
          </span>
          <button onClick={handleLogout} type="button" className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </button>
        </div>
      </div>

      {toast.isOpen && (<Toast message={toast.message} type={toast.type} onClose={closeToast} duration={toast.duration} />)}
      
      {/* <Dashboard /> */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-8">
        <button onClick={handleOpenAddStudentModal} type="button" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Aluno
        </button>
        <Link href="/alunos" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
          <Users className="mr-2 h-5 w-5" /> Gerenciar Alunos
        </Link>
      </div>

      {/* <CalendarSection showToast={showToast} /> */}
      
      {isStudentDetailModalOpen && selectedStudentId && (<StudentDetailModal isOpen={isStudentDetailModalOpen} onClose={handleCloseStudentDetail} studentId={selectedStudentId} onOpenAddAula={handleOpenAddAula} onOpenAddAulaLote={handleOpenAddAulaLote} showToast={showToast} />)}
      {isAddAulaModalOpen && studentForAulaModal && (<AddAulaModal isOpen={isAddAulaModalOpen} onClose={handleCloseAddAula} studentId={studentForAulaModal} showToast={showToast} />)}
      {isAddAulaLoteModalOpen && studentForAulaModal && (<AddAulaLoteModal isOpen={isAddAulaLoteModalOpen} onClose={handleCloseAddAulaLote} studentId={studentForAulaModal} showToast={showToast} />)}
      {isAddStudentModalOpen && (<div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"><div className="relative mx-auto border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"><StudentForm showToast={showToast} onCloseModal={handleCloseAddStudentModal} /></div></div>)}
    </div>
  );
}