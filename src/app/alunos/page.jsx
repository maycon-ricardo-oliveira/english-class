'use client'; // Necessário para hooks e interações

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Para o botão de voltar para Home
import useAppStore from '../../store/useAppStore'; // Ajuste o caminho se necessário
import { UserPlus, ArrowLeft } from 'lucide-react';

// Componentes que serão usados nesta página
import StudentList from '../../components/StudentList';
import StudentForm from '../../components/StudentForm'; // Será usado dentro de um modal
import StudentDetailModal from '../../components/StudentDetailModal';
import AddAulaModal from '../../components/AddAulaModal';
import AddAulaLoteModal from '../../components/AddAulaLoteModal';
import Toast from '../../components/Toast';

export default function AlunosPage() {
  // Hooks
  const router = useRouter();
  const loggedInTeacherId = useAppStore((state) => state.loggedInTeacherId);
  // --- CORREÇÃO: Acessar loggedInTeacherData diretamente ---
  const loggedInTeacherData = useAppStore((state) => state.loggedInTeacherData);
  const isLoadingAuth = useAppStore((state) => state.isLoadingAuth);
  const isLoadingData = useAppStore((state) => state.isLoadingData); // Para consistência no carregamento
  // --- FIM DA CORREÇÃO ---

  // Estado local
  // const [teacherName, setTeacherName] = useState(''); // Não é mais necessário, usaremos loggedInTeacherData.name
  const [isMounted, setIsMounted] = useState(false); // Para garantir que o código do cliente execute após a montagem

  // Estados para controlar visibilidade dos modais
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isAddAulaModalOpen, setIsAddAulaModalOpen] = useState(false);
  const [isAddAulaLoteModalOpen, setIsAddAulaLoteModalOpen] = useState(false);
  const [studentForAulaModal, setStudentForAulaModal] = useState(null);

  // Estado para o Toast
  const [toast, setToast] = useState({ message: '', type: '', isOpen: false });

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, isOpen: true, duration });
  };
  const closeToast = () => {
    setToast({ message: '', type: '', isOpen: false });
  };

  useEffect(() => {
    setIsMounted(true); // Marca que o componente montou no cliente
  }, []);

  useEffect(() => {
    if (!isMounted) return; // Só executa após a montagem

    if (!isLoadingAuth) { // Espera a verificação inicial do auth terminar
      if (!loggedInTeacherId) {
        console.log("AlunosPage: Usuário não logado, redirecionando para /login");
        router.replace('/login');
      }
      // Não precisamos mais setar teacherName aqui, pois usaremos loggedInTeacherData.name diretamente
      // A verificação de currentTeacher e isAuthenticated é implicitamente feita por loggedInTeacherId e isLoadingAuth
    }
  }, [isMounted, isLoadingAuth, loggedInTeacherId, router]);

  // Funções para modais de Aluno
  const handleOpenAddStudentModal = () => setIsAddStudentModalOpen(true);
  const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false);

  const handleOpenStudentDetail = (studentId) => {
    setSelectedStudentId(studentId);
    setIsStudentDetailModalOpen(true);
  };
  const handleCloseStudentDetail = () => {
    setIsStudentDetailModalOpen(false);
    setSelectedStudentId(null);
  };

  // Funções para modais de Aula (chamadas a partir do StudentDetailModal)
  const handleOpenAddAula = (studentId) => {
    setStudentForAulaModal(studentId);
    setIsStudentDetailModalOpen(false);
    setIsAddAulaModalOpen(true);
  };
  const handleCloseAddAula = () => {
    setIsAddAulaModalOpen(false);
    setStudentForAulaModal(null);
    if(selectedStudentId && !isAddAulaLoteModalOpen && !isAddStudentModalOpen) setIsStudentDetailModalOpen(true);
  };

  const handleOpenAddAulaLote = (studentId) => {
    setStudentForAulaModal(studentId);
    setIsStudentDetailModalOpen(false);
    setIsAddAulaLoteModalOpen(true);
  };
  const handleCloseAddAulaLote = () => {
    setIsAddAulaLoteModalOpen(false);
    setStudentForAulaModal(null);
    if(selectedStudentId && !isAddAulaModalOpen && !isAddStudentModalOpen) setIsStudentDetailModalOpen(true);
  };

  // Renderiza estado de carregamento enquanto o estado de autenticação ou dados estão sendo verificados/carregados
  if (!isMounted || isLoadingAuth || (loggedInTeacherId && isLoadingData && !loggedInTeacherData)) {
    return <p className="text-center mt-10 text-gray-600 dark:text-gray-300">Carregando dados da página de alunos...</p>;
  }

  // Se após o carregamento não houver ID de professor, o useEffect já deve ter redirecionado.
  // Mas, como uma segurança extra:
  if (!loggedInTeacherId) {
    return <p className="text-center mt-10 text-gray-600 dark:text-gray-300">Redirecionando para login...</p>;
  }


  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerenciar Alunos</h1>
        <Link href="/home" className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Home
        </Link>
      </div>

      {toast.isOpen && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} duration={toast.duration} />
      )}

      <div className="mb-6">
        <button
          onClick={handleOpenAddStudentModal}
          type="button"
          className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Aluno
        </button>
      </div>

      <StudentList onOpenDetail={handleOpenStudentDetail} /> {/* StudentList usará loggedInTeacherData do store */}

      {/* --- Modais --- */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
            <StudentForm showToast={showToast} onCloseModal={handleCloseAddStudentModal} />
          </div>
        </div>
      )}

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
    </div>
  );
}