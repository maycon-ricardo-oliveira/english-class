'use client';

import React, { useState, useEffect } from 'react'; // useEffect pode não ser mais necessário aqui
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { handleFirebaseLogin } from '../../utils/authService'; // Importa diretamente a função de login
import { LogIn, ArrowRight } from 'lucide-react';
import Toast from '../../components/Toast';

export default function LoginPage() {
  const router = useRouter();

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
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Chama diretamente a função de login do authService
      const user = await handleFirebaseLogin(email, password);
      console.log("Login bem-sucedido, usuário:", user);
      showToast('Login bem-sucedido! Redirecionando...', 'success');
      // Após o login bem-sucedido, o onAuthStateChanged no RootLayout (se configurado)
      // deve detectar a mudança e o RootLayout ou um componente de ordem superior
      // deve lidar com o redirecionamento para /home.
      // Por enquanto, podemos adicionar um redirecionamento direto aqui,
      // mas o ideal é que o estado global de autenticação dispare isso.
      setTimeout(() => {
        router.replace('/home'); // Redireciona para a home após o login
      }, 1500); // Pequeno delay para o toast ser visível
    } catch (err) {
      console.error("Erro no login (capturado em LoginPage):", err);
      showToast(err.message || 'Erro ao tentar fazer login.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToRegister = () => {
    router.push('/register');
  };

  // A lógica de "Verificando autenticação..." ou "Redirecionando..." foi removida
  // pois esta página agora não tem conhecimento do estado global de autenticação.

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
            Acesse sua Conta
            </h2>
            <p className="mt-2 text-sm text-gray-700">
            Bem-vindo de volta! Insira seus dados para continuar.
            </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="loginEmail"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="loginEmail"
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
              htmlFor="loginPassword"
              className="block text-sm font-medium text-gray-800 mb-1"
            >
              Senha
            </label>
            <input
              type="password"
              id="loginPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Sua senha"
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
              <LogIn className="mr-2 h-5 w-5" />
            )}
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 mt-8">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Registre-se <ArrowRight className="inline h-4 w-4"/>
          </Link>
        </p>
      </div>
    </div>
  );
}