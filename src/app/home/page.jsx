'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext'; 
import { LogOut, UserPlus, Users } from 'lucide-react';

import Dashboard from '../../components/Dashboard';
import CalendarSection from '../../components/CalendarSection';
import StudentForm from '../../components/StudentForm';
import StudentList from '../../components/StudentList';
import StudentDetailModal from '../../components/StudentDetailModal';
import AddAulaModal from '../../components/AddAulaModal';
import AddAulaLoteModal from '../../components/AddAulaLoteModal';
import Toast from '../../components/Toast';
import { addStudentToDb } from '../../utils/api';

export default function HomePage() {
  const router = useRouter();
  
  const { 
    currentUser,
    teacherData,
    isLoadingAuth,
    isLoadingData,
    logout
  } = useAuth();

  const [isMounted, setIsMounted] = useState(false);

  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isAddAulaModalOpen, setIsAddAulaModalOpen] = useState(false);
  const [isAddAulaLoteModalOpen, setIsAddAulaLoteModalOpen] = useState(false);
  const [studentForAulaModal, setStudentForAulaModal] = useState(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  const [toast, setToast] = useState({ message: '', type: '', isOpen: false });
  
  const fixedTeacherIdForTest = "qRM8Lr2dIUWHepJG7IppXCfnPFm1"; 

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, isOpen: true, duration });
  };
  const closeToast = () => {
    setToast({ message: '', type: '', isOpen: false });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isLoadingAuth && !currentUser) {
      console.log("HomePage: Usuário não logado após verificação. Redirecionando para /login.");
      router.replace('/login');
    }
  }, [isMounted, isLoadingAuth, currentUser, router]);


  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logout realizado com sucesso!', 'success');
    } catch (error) {
      console.error("Erro no logout (HomePage):", error);
      showToast(error.message || 'Erro ao fazer logout.', 'error');
    }
  };

  const handleOpenStudentDetail = (studentId) => { 
    console.log("HomePage: Abrindo detalhes para studentId:", studentId);
    setSelectedStudentId(studentId); 
    setIsStudentDetailModalOpen(true); 
  };
  const handleCloseStudentDetail = () => { setIsStudentDetailModalOpen(false); setSelectedStudentId(null); };
  const handleOpenAddAula = (studentId) => { setStudentForAulaModal(studentId); setIsStudentDetailModalOpen(false); setIsAddAulaModalOpen(true); };
  const handleCloseAddAula = () => { setIsAddAulaModalOpen(false); setStudentForAulaModal(null); if(selectedStudentId && !isAddAulaLoteModalOpen && !isAddStudentModalOpen) setIsStudentDetailModalOpen(true); };
  const handleOpenAddAulaLote = (studentId) => { setStudentForAulaModal(studentId); setIsStudentDetailModalOpen(false); setIsAddAulaLoteModalOpen(true); };
  const handleCloseAddAulaLote = () => { setIsAddAulaLoteModalOpen(false); setStudentForAulaModal(null); if(selectedStudentId && !isAddAulaModalOpen && !isAddStudentModalOpen) setIsStudentDetailModalOpen(true); };
  
  const handleOpenAddStudentModal = () => setIsAddStudentModalOpen(true);
  const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false);

  const handleAddStudentFromHomePage = async (studentPayload) => {
    const teacherIdToUse = currentUser?.uid || fixedTeacherIdForTest; 
    
    if (!teacherIdToUse) {
        showToast("ID do Professor não disponível. Faça login ou configure o ID de teste.", "error");
        console.error("HomePage: ID do Professor não disponível para adicionar aluno.");
        throw new Error("ID do Professor não disponível.");
    }
    await addStudentToDb(teacherIdToUse, studentPayload);
  };

  if (!isMounted || isLoadingAuth) {
    return <p className="text-center mt-10 text-gray-700">Verificando autenticação...</p>;
  }
  if (!currentUser) { 
    return <p className="text-center mt-10 text-gray-700">Redirecionando para login...</p>;
  }
  if (isLoadingData || !teacherData) { 
      return <p className="text-center mt-10 text-gray-700">Carregando dados do professor...</p>;
  }
  if (currentUser && !isLoadingData && !teacherData) {
    console.warn("HomePage: currentUser existe, mas teacherData é nulo e não está em isLoadingData.");
    return <p className="text-center mt-10 text-red-500">Erro ao carregar dados do professor. Tente recarregar.</p>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">Página Inicial</h1>
        <div>
          <span className="text-sm text-gray-600 mr-3">
            Olá, <span className="font-bold text-gray-800">{teacherData?.name || 'Professor'}</span>!
          </span>
          <button onClick={handleLogout} type="button" className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </button>
        </div>
      </div>

      {toast.isOpen && (<Toast message={toast.message} type={toast.type} onClose={closeToast} duration={toast.duration} />)}
      
      <Dashboard />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 mb-8">
        <button onClick={handleOpenAddStudentModal} type="button" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Aluno
        </button>
        <Link href="/alunos" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
          <Users className="mr-2 h-5 w-5" /> Gerenciar Alunos
        </Link>
      </div>

      {/* --- Passando a função para o CalendarSection --- */}
      <CalendarSection 
        showToast={showToast} 
        onCalendarLessonClick={handleOpenStudentDetail} // Nova prop
      />
      {/* --- Fim da passagem da função --- */}
      
      {isStudentDetailModalOpen && selectedStudentId && (<StudentDetailModal isOpen={isStudentDetailModalOpen} onClose={handleCloseStudentDetail} studentId={selectedStudentId} onOpenAddAula={handleOpenAddAula} onOpenAddAulaLote={handleOpenAddAulaLote} showToast={showToast} />)}
      {isAddAulaModalOpen && studentForAulaModal && (<AddAulaModal isOpen={isAddAulaModalOpen} onClose={handleCloseAddAula} studentId={studentForAulaModal} showToast={showToast} />)}
      {isAddAulaLoteModalOpen && studentForAulaModal && (<AddAulaLoteModal isOpen={isAddAulaLoteModalOpen} onClose={handleCloseAddAulaLote} studentId={studentForAulaModal} showToast={showToast} />)}
      
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto border w-full max-w-lg shadow-lg rounded-md bg-white">
            <StudentForm 
              isOpen={isAddStudentModalOpen}
              showToast={showToast} 
              onCloseModal={handleCloseAddStudentModal}
              addStudentAction={handleAddStudentFromHomePage} 
            />
          </div>
        </div>
      )}
    </div>
  );
}