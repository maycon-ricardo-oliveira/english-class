'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Manter useRouter para o redirect explícito
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext'; 
import { LogOut, UserPlus, Users } from 'lucide-react';

import Dashboard from '../../components/Dashboard';
import CalendarSection from '../../components/CalendarSection';
import StudentForm from '../../components/StudentForm';
import StudentList from '../../components/StudentList'; // Será usado na AlunosPage
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
    isLoadingAuth, // Indica se o onAuthStateChanged inicial já rodou
    isLoadingData,  // Indica se os dados do teacherData estão sendo buscados/ouvidos
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
    if (!isMounted) return; // Só executa no cliente após montagem

    // console.log(`HomePage Effect: isLoadingAuth=${isLoadingAuth}, currentUser=${!!currentUser}`);
    if (!isLoadingAuth && !currentUser) {
      console.log("HomePage: Auth verificado, sem usuário. Redirecionando para /login.");
      router.replace('/login');
    }
    // A lógica de buscar teacherData já está no AuthContext via onAuthStateChanged e onValue
  }, [isMounted, isLoadingAuth, currentUser, router]);


  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logout realizado com sucesso!', 'success');
      // O AuthContext e o useEffect acima tratarão do redirecionamento
    } catch (error) {
      showToast(error.message || 'Erro ao fazer logout.', 'error');
    }
  };

  const handleOpenStudentDetail = (studentId) => { setSelectedStudentId(studentId); setIsStudentDetailModalOpen(true); };
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
        showToast("ID do Professor não disponível.", "error");
        throw new Error("ID do Professor não disponível.");
    }
    await addStudentToDb(teacherIdToUse, studentPayload);
  };

  // Renderização Condicional
  if (!isMounted || isLoadingAuth) {
    return <p className="flex justify-center items-center min-h-screen text-gray-700">Verificando autenticação...</p>;
  }
  if (!currentUser) { 
    // Se chegou aqui após isLoadingAuth ser false, o redirect do useEffect deve ter sido chamado.
    // Este é um fallback.
    return <p className="flex justify-center items-center min-h-screen text-gray-700">Redirecionando para login...</p>;
  }
  // Se currentUser existe, mas teacherData ainda não foi carregado (e isLoadingData é true)
  if (isLoadingData || !teacherData) { 
      return <p className="flex justify-center items-center min-h-screen text-gray-700">Carregando dados do professor...</p>;
  }
  // Caso raro: autenticado, dados não carregando, mas teacherData ainda é nulo
  if (!isLoadingData && !teacherData) {
    console.warn("HomePage: currentUser existe, mas teacherData é nulo e não está em isLoadingData. Verifique a criação do nó no DB.");
    return <p className="text-center mt-10 text-red-500">Erro ao carregar perfil do professor. Verifique se o perfil existe no banco de dados.</p>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">Página Inicial</h1>
        <div>
          <span className="text-sm text-gray-600 mr-3">
            Olá, <span className="font-bold text-gray-800">{teacherData?.name || currentUser?.email || 'Professor'}</span>!
          </span>
          <button onClick={handleLogout} type="button" className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </button>
        </div>
      </div>

      {toast.isOpen && (<Toast message={toast.message} type={toast.type} onClose={closeToast} duration={toast.duration} />)}
      
      <Dashboard />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 mb-8">
        <button onClick={handleOpenAddStudentModal} type="button" className="w-full btn-primary"> {/* Exemplo de classe de botão */}
          <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Aluno
        </button>
        <Link href="/alunos" className="w-full btn-secondary"> {/* Exemplo de classe de botão */}
          <Users className="mr-2 h-5 w-5" /> Gerenciar Alunos
        </Link>
      </div>

      <CalendarSection showToast={showToast} onCalendarLessonClick={handleOpenStudentDetail} />
      
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