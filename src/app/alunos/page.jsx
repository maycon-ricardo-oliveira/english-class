'use client'; // Necessário para hooks e interações no lado do cliente

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link'; 
import { useAuth } from '../../context/AuthContext'; 
import { UserPlus, ArrowLeft } from 'lucide-react';

// Componentes que serão usados nesta página
import StudentList from '../../components/StudentList';
import StudentForm from '../../components/StudentForm'; 
import StudentDetailModal from '../../components/StudentDetailModal';
import AddAulaModal from '../../components/AddAulaModal';
import AddAulaLoteModal from '../../components/AddAulaLoteModal';
import Toast from '../../components/Toast';
import { addStudentToDb } from '../../utils/api'; 

export default function AlunosPage() {
  const router = useRouter();
  
  const { 
    currentUser,
    teacherData,
    isLoadingAuth,
    isLoadingData,
  } = useAuth();

  const [isMounted, setIsMounted] = useState(false);

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isAddAulaModalOpen, setIsAddAulaModalOpen] = useState(false);
  const [isAddAulaLoteModalOpen, setIsAddAulaLoteModalOpen] = useState(false);
  const [studentForAulaModal, setStudentForAulaModal] = useState(null);

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
      console.log("AlunosPage: Usuário não logado após verificação. Redirecionando para /login.");
      router.replace('/login');
    }
  }, [isMounted, isLoadingAuth, currentUser, router]);

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

  const handleAddStudentFromAlunosPage = async (studentData) => {
    const teacherIdToUse = currentUser?.uid || fixedTeacherIdForTest; 
    
    if (!teacherIdToUse) {
        showToast("ID do Professor não disponível. Faça login ou configure o ID de teste.", "error");
        console.error("AlunosPage: ID do Professor não disponível para adicionar aluno.");
        throw new Error("ID do Professor não disponível.");
    }
    console.log(`AlunosPage: Tentando adicionar aluno com dados:`, studentData, `para Professor ID: ${teacherIdToUse}`);
    await addStudentToDb(teacherIdToUse, studentData);
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
    console.warn("AlunosPage: currentUser existe, mas teacherData é nulo e não está em isLoadingData.");
    return <p className="text-center mt-10 text-red-500">Erro ao carregar dados do professor. Tente recarregar.</p>;
  }

  // Extrai a lista de alunos dos dados do professor
  const studentsList = teacherData?.students || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Alunos</h1>
        <Link
          href="/home"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
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
          className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Aluno
        </button>
      </div>

      {/* Passa a lista de alunos como prop para StudentList */}
      <StudentList students={studentsList} onOpenDetail={handleOpenStudentDetail} /> 

      {/* --- Modais --- */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto border w-full max-w-lg shadow-lg rounded-md bg-white">
            <StudentForm 
              isOpen={isAddStudentModalOpen}
              showToast={showToast} 
              onCloseModal={handleCloseAddStudentModal}
              addStudentAction={handleAddStudentFromAlunosPage} 
            />
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
