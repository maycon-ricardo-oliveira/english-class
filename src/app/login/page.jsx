'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '../../store/useAppStore';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const loginTeacher = useAppStore((state) => state.loginTeacher);
  const loggedInTeacherId = useAppStore((state) => state.loggedInTeacherId);
  const isLoadingAuth = useAppStore((state) => state.isLoadingAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && loggedInTeacherId) {
      router.replace('/home');
    }
  }, [loggedInTeacherId, isLoadingAuth, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginTeacher(email, password);
      router.push('/home');
    } catch (err) {
      console.error("Erro no login (capturado em LoginPage):", err);
      setError(err.message || 'Erro ao tentar fazer login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToRegister = () => {
    router.push('/register');
  };

  if (isLoadingAuth) {
    return <p className="text-center mt-10 text-gray-600">Verificando autenticação...</p>;
  }
  if (loggedInTeacherId) {
      return <p className="text-center mt-10 text-gray-600">Redirecionando...</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Login do Professor
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="loginEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="loginEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 placeholder-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="loginPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              type="password"
              id="loginPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Sua senha"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 placeholder-gray-400"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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

        <p className="text-center text-sm text-gray-600 mt-6">
          Não tem uma conta?{' '}
          <button
            type="button"
            onClick={handleGoToRegister}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Registre-se
          </button>
        </p>
      </div>
    </div>
  );
}
