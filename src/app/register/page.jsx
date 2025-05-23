'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerTeacherInFirebase } from '../../utils/authService'; // Continua usando esta função
import { useAuth } from '../../context/AuthContext'; // Importa o hook useAuth
import { UserPlus, ArrowRight } from 'lucide-react';
import Toast from '../../components/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth } = useAuth(); // Usa o contexto para verificar o usuário logado e o estado de carregamento

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', isOpen: false });

  const showToast = (message, type = 'info', duration = 4000) => {
    setToast({ message, type, isOpen: true, duration });
  };

  const closeToast = () => {
    setToast({ message: '', type: '', isOpen: false });
  };

  // Redireciona se o usuário já estiver logado e a verificação de auth tiver terminado
  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      console.log("RegisterPage: Usuário já logado, redirecionando para /home...");
      router.replace('/home');
    }
  }, [isLoadingAuth, currentUser, router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast("Por favor, preencha todos os campos.", 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("RegisterPage: Tentando registar com:", name, email);
      await registerTeacherInFirebase(name, email, password);
      showToast('Registo realizado com sucesso! Você será redirecionado para a página de login.', 'success');
      setTimeout(() => {
        router.push('/login'); 
      }, 2000);
    } catch (err) {
      console.error("Erro no handleRegister (RegisterPage):", err);
      showToast(err.message || 'Ocorreu um erro ao tentar registar.', 'error');
      setIsSubmitting(false); // Garante que isSubmitting seja false em caso de erro
    }
    // Não reseta isSubmitting aqui se o sucesso levar a um redirecionamento
  };
  
  // Mostra um loader enquanto o estado de autenticação está sendo verificado
  if (isLoadingAuth) {
    return <p className="flex justify-center items-center min-h-screen text-gray-700">Verificando autenticação...</p>;
  }
  // Se já estiver logado (após isLoadingAuth ser false), o useEffect acima deve redirecionar.
  // Este return é uma segurança adicional.
  if (currentUser) {
      return <p className="flex justify-center items-center min-h-screen text-gray-700">Redirecionando...</p>;
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      {toast.isOpen && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={toast.duration}
        />
      )}
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-xl shadow-lg">
        <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
                <span className="text-3xl font-bold text-indigo-600">ClassFlow</span>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Crie sua Conta de Professor
            </h2>
            <p className="mt-2 text-sm text-gray-700">
            Comece a organizar suas aulas e alunos hoje mesmo.
            </p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label
              htmlFor="registerName"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Nome Completo
            </label>
            <input
              type="text"
              id="registerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Seu nome completo"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label
              htmlFor="registerEmail"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="registerEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="seu@email.com"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label
              htmlFor="registerPassword"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Senha
            </label>
            <input
              type="password"
              id="registerPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Mínimo 6 caracteres"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm p-3 text-gray-800 placeholder-gray-500 disabled:opacity-70 disabled:bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition-opacity"
          >
            {isSubmitting ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <UserPlus className="mr-2 h-5 w-5" />
            )}
            {isSubmitting ? 'Registando...' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 mt-8">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Faça Login <ArrowRight className="inline h-4 w-4"/>
          </Link>
        </p>
      </div>
    </div>
  );
}