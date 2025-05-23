'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // useRouter pode ser necessário para redirects manuais se o AuthGuard não for usado aqui
import Link from 'next/link';
// Importação do useAppStore REMOVIDA
// import useAppStore from '../../store/useAppStore'; 
import { useAuth } from '../../context/AuthContext'; // Importa o hook useAuth
import { LogOut, UserPlus, Users } from 'lucide-react';

// Importações de Componentes
import Dashboard from '../../components/Dashboard';
import CalendarSection from '../../components/CalendarSection';
import StudentForm from '../../components/StudentForm';
import StudentList from '../../components/StudentList';
import StudentDetailModal from '../../components/StudentDetailModal';
import AddAulaModal from '../../components/AddAulaModal';
import AddAulaLoteModal from '../../components/AddAulaLoteModal';
import Toast from '../../components/Toast';
import { addStudentToDb } from '../../utils/api'; // Continua usando para a ação de DB

export default function HomePage() {
  const router = useRouter();
  
  // Usa o AuthContext para obter o estado de autenticação e dados do professor
  const { 
    currentUser,      // Objeto user do Firebase Auth (ou null)
    teacherData,      // Dados do professor do Realtime DB (ou null)
    isLoadingAuth,    // True enquanto o estado inicial de auth está a ser determinado
    isLoadingData,    // True enquanto teacherData está a ser carregado do DB
    logout            // Função de logout do AuthContext
  } = useAuth();

  // O estado isMounted ainda pode ser útil para garantir que certas lógicas só rodem no cliente
  const [isMounted, setIsMounted] = useState(false);

  // Estados para modais
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isAddAulaModalOpen, setIsAddAulaModalOpen] = useState(false);
  const [isAddAulaLoteModalOpen, setIsAddAulaLoteModalOpen] = useState(false);
  const [studentForAulaModal, setStudentForAulaModal] = useState(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Estado para Toast
  const [toast, setToast] = useState({ message: '', type: '', isOpen: false });
  
  // ID fixo para teste (pode ser removido se a autenticação estiver 100% funcional)
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

  // Efeito para redirecionar se não estiver autenticado
  // Esta lógica é crucial e agora depende do AuthContext
  useEffect(() => {
    if (!isMounted) return;

    // Se a verificação de autenticação terminou e não há usuário, redireciona para login
    if (!isLoadingAuth && !currentUser) {
      console.log("HomePage: Usuário não logado. Redirecionando para /login.");
      router.replace('/login');
    }
    // O listener para teacherData já está no AuthProvider
  }, [isMounted, isLoadingAuth, currentUser, router]);


  const handleLogout = async () => {
    try {
      await logout(); // Chama a função de logout do AuthContext
      showToast('Logout realizado com sucesso!', 'success');
      // O AuthProvider e o onAuthStateChanged tratarão de redirecionar para /login
      // e limpar o estado currentUser.
    } catch (error) {
      console.error("Erro no logout (HomePage):", error);
      showToast(error.message || 'Erro ao fazer logout.', 'error');
    }
  };

  const handleCloseStudentDetail = () => { setIsStudentDetailModalOpen(false); setSelectedStudentId(null); };
  const handleOpenAddAula = (studentId) => { setStudentForAulaModal(studentId); setIsStudentDetailModalOpen(false); setIsAddAulaModalOpen(true); };
  const handleCloseAddAula = () => { setIsAddAulaModalOpen(false); setStudentForAulaModal(null); if(selectedStudentId && !isAddAulaLoteModalOpen && !isAddStudentModalOpen) setIsStudentDetailModalOpen(true); };
  const handleOpenAddAulaLote = (studentId) => { setStudentForAulaModal(studentId); setIsStudentDetailModalOpen(false); setIsAddAulaLoteModalOpen(true); };
  const handleCloseAddAulaLote = () => { setIsAddAulaLoteModalOpen(false); setStudentForAulaModal(null); if(selectedStudentId && !isAddAulaModalOpen && !isAddStudentModalOpen) setIsStudentDetailModalOpen(true); };
  
  const handleOpenAddStudentModal = () => setIsAddStudentModalOpen(true);
  const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false);

  // Função para ser passada ao StudentForm na HomePage
  const handleAddStudentFromHomePage = async (studentData) => {
    // Prioriza o ID do usuário logado. Usa o fixo apenas se não houver usuário logado (para debug).
    const teacherIdToUse = currentUser?.uid || fixedTeacherIdForTest; 
    
    if (!teacherIdToUse) {
        showToast("ID do Professor não disponível. Faça login ou configure o ID de teste.", "error");
        console.error("HomePage: ID do Professor não disponível para adicionar aluno.");
        throw new Error("ID do Professor não disponível.");
    }
    console.log(`HomePage: Tentando adicionar aluno com dados:`, studentData, `para Professor ID: ${teacherIdToUse}`);
    await addStudentToDb(teacherIdToUse, studentData);
  };

  // Condições de carregamento e autenticação
  if (!isMounted || isLoadingAuth) {
    return <p className="text-center mt-10 text-gray-700 text-gray-300">Verificando autenticação...</p>;
  }
  // Se o AuthProvider terminou de carregar o estado de auth, mas não há usuário,
  // o useEffect acima já deve ter iniciado o redirecionamento.
  if (!currentUser) {
    return <p className="text-center mt-10 text-gray-700 text-gray-300">Redirecionando para login...</p>;
  }
  // Se está autenticado (currentUser existe), mas os dados específicos do professor (teacherData) ainda estão carregando
  if (isLoadingData || !teacherData) { 
      return <p className="text-center mt-10 text-gray-700 text-gray-300">Carregando dados do professor...</p>;
  }
  // Se o ID do professor existe, mas os dados do professor não foram carregados (caso raro, mas possível)
  if (currentUser && !isLoadingData && !teacherData) {
    console.warn("HomePage: currentUser existe, mas teacherData é nulo e não está em isLoadingData.");
    return <p className="text-center mt-10 text-red-500">Erro ao carregar dados do professor. Tente recarregar.</p>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 text-gray-100">Página Inicial</h1>
        <div>
          <span className="text-sm text-gray-600 text-gray-300 mr-3">
            Olá, <span className="font-bold text-gray-800 text-gray-100">{teacherData?.name || 'Professor'}</span>!
          </span>
          <button onClick={handleLogout} type="button" className="inline-flex items-center px-3 py-1.5 border border-gray-300 border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 text-gray-200 bg-white bg-gray-700 hover:bg-gray-50 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </button>
        </div>
      </div>

      {toast.isOpen && (<Toast message={toast.message} type={toast.type} onClose={closeToast} duration={toast.duration} />)}
      
      {/* Dashboard precisará usar useAuth() internamente se precisar de teacherData */}
      <Dashboard />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 mb-8">
        <button onClick={handleOpenAddStudentModal} type="button" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Aluno
        </button>
        <Link href="/alunos" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
          <Users className="mr-2 h-5 w-5" /> Gerenciar Alunos
        </Link>
      </div>

      {/* CalendarSection precisará usar useAuth() internamente se precisar de teacherData */}
      <CalendarSection showToast={showToast} />
      
      {isStudentDetailModalOpen && selectedStudentId && (<StudentDetailModal isOpen={isStudentDetailModalOpen} onClose={handleCloseStudentDetail} studentId={selectedStudentId} onOpenAddAula={handleOpenAddAula} onOpenAddAulaLote={handleOpenAddAulaLote} showToast={showToast} />)}
      {isAddAulaModalOpen && studentForAulaModal && (<AddAulaModal isOpen={isAddAulaModalOpen} onClose={handleCloseAddAula} studentId={studentForAulaModal} showToast={showToast} />)}
      {isAddAulaLoteModalOpen && studentForAulaModal && (<AddAulaLoteModal isOpen={isAddAulaLoteModalOpen} onClose={handleCloseAddAulaLote} studentId={studentForAulaModal} showToast={showToast} />)}
      
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto border w-full max-w-lg shadow-lg rounded-md bg-white bg-gray-800 border-gray-200">
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