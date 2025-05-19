'use client'; // Necessário para hooks e interações

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Importa o Link do Next.js
import useAppStore from '../../store/useAppStore'; // Ajuste o caminho se necessário
import { LogOut, UserPlus, Users } from 'lucide-react'; // Adicionado Users para o novo botão

// --- Importações de Componentes ---
import Dashboard from '../../components/Dashboard';
import CalendarSection from '../../components/CalendarSection';
import StudentForm from '../../components/StudentForm';
import StudentList from '../../components/StudentList';
import StudentDetailModal from '../../components/StudentDetailModal';
import AddAulaModal from '../../components/AddAulaModal';
import AddAulaLoteModal from '../../components/AddAulaLoteModal';
import Toast from '../../components/Toast';

export default function HomePage() {
  // Hooks
  const router = useRouter();
  const loggedInTeacherId = useAppStore((state) => state.loggedInTeacherId);
  const getLoggedInTeacher = useAppStore((state) => state.getLoggedInTeacher);
  const logoutTeacher = useAppStore((state) => state.logoutTeacher);

  // Estado local para dados do professor e controle de montagem/autenticação
  const [teacher, setTeacher] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Estados para controlar visibilidade dos modais ---
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isAddAulaModalOpen, setIsAddAulaModalOpen] = useState(false);
  const [isAddAulaLoteModalOpen, setIsAddAulaLoteModalOpen] = useState(false);
  const [studentForAulaModal, setStudentForAulaModal] = useState(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // --- Estado para o Toast ---
  const [toast, setToast] = useState({ message: '', type: '', isOpen: false });

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, isOpen: true, duration });
  };
  const closeToast = () => {
    setToast({ message: '', type: '', isOpen: false });
  };

  useEffect(() => {
    setIsMounted(true);
    if (!loggedInTeacherId) {
      router.replace('/login');
    } else {
      const currentTeacher = getLoggedInTeacher();
      if (currentTeacher) {
        setTeacher(currentTeacher);
        setIsAuthenticated(true);
      } else {
        console.error("Professor logado não encontrado no estado, deslogando.");
        logoutTeacher();
        router.replace('/login');
      }
    }
  }, [loggedInTeacherId, router, getLoggedInTeacher, logoutTeacher]);

  const handleLogout = () => {
    logoutTeacher();
  };

  const handleOpenStudentDetail = (studentId) => {
    setSelectedStudentId(studentId);
    setIsStudentDetailModalOpen(true);
  };
  const handleCloseStudentDetail = () => {
    setIsStudentDetailModalOpen(false);
    setSelectedStudentId(null);
  };

  const handleOpenAddAula = (studentId) => {
      setStudentForAulaModal(studentId);
      setIsStudentDetailModalOpen(false);
      setIsAddAulaModalOpen(true);
  };
  const handleCloseAddAula = () => {
      setIsAddAulaModalOpen(false);
      setStudentForAulaModal(null);
      if(selectedStudentId) setIsStudentDetailModalOpen(true); // Reabre se veio de detalhes
  };

  const handleOpenAddAulaLote = (studentId) => {
      setStudentForAulaModal(studentId);
      setIsStudentDetailModalOpen(false);
      setIsAddAulaLoteModalOpen(true);
  };
  const handleCloseAddAulaLote = () => {
      setIsAddAulaLoteModalOpen(false);
      setStudentForAulaModal(null);
      if(selectedStudentId) setIsStudentDetailModalOpen(true); // Reabre se veio de detalhes
  };

  const handleOpenAddStudentModal = () => {
    setIsAddStudentModalOpen(true);
  };
  const handleCloseAddStudentModal = () => {
    setIsAddStudentModalOpen(false);
  };


  if (!isMounted || !isAuthenticated) {
    return <p className="text-center mt-10">Carregando...</p>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Página Inicial</h1>
        <div>
          <span className="text-sm text-gray-600 mr-3">
            Olá, <span className="font-medium">{teacher?.name || 'Professor'}</span>!
          </span>
          <button
            onClick={handleLogout}
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </button>
        </div>
      </div>

      {toast.isOpen && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={toast.duration}
        />
      )}

      <Dashboard />

      {/* Botões de Ação Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-8">
        <button
          onClick={handleOpenAddStudentModal}
          type="button"
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Aluno
        </button>
        <Link href="/alunos" legacyBehavior>
          <a className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
            <Users className="mr-2 h-5 w-5" /> Gerenciar Alunos
          </a>
        </Link>
      </div>

      <CalendarSection showToast={showToast} />
      
      {/* A StudentList foi removida desta página, pois agora está em /alunos */}


      {/* --- Modais --- */}
      {isStudentDetailModalOpen && selectedStudentId && (
        <StudentDetailModal
          isOpen={isStudentDetailModalOpen}
          onClose={handleCloseStudentDetail}
          studentId={selectedStudentId}
          onOpenAddAula={handleOpenAddAula}
          onOpenAddAulaLote={handleOpenAddAulaLote}
          showToast={showToast}
        />
      )}

      {isAddAulaModalOpen && studentForAulaModal && (
        <AddAulaModal
          isOpen={isAddAulaModalOpen}
          onClose={handleCloseAddAula}
          studentId={studentForAulaModal}
          showToast={showToast}
        />
      )}

       {isAddAulaLoteModalOpen && studentForAulaModal && (
        <AddAulaLoteModal
          isOpen={isAddAulaLoteModalOpen}
          onClose={handleCloseAddAulaLote}
          studentId={studentForAulaModal}
          showToast={showToast}
        />
      )}

      {/* Modal para Cadastrar Aluno com backdrop atualizado */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto border w-full max-w-lg shadow-lg rounded-md bg-white">
            <StudentForm showToast={showToast} onCloseModal={handleCloseAddStudentModal} />
          </div>
        </div>
      )}

    </div>
  );
}
