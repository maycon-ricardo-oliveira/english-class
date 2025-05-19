'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '../../store/useAppStore'; // Ajuste o caminho se estiver diferente
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const registerTeacher = useAppStore((state) => state.registerTeacher);
  const loggedInTeacherId = useAppStore((state) => state.loggedInTeacherId);
  const isLoadingAuth = useAppStore((state) => state.isLoadingAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Só redireciona APÓS a verificação inicial de autenticação ter terminado
    if (!isLoadingAuth && loggedInTeacherId) {
      router.replace('/home');
    }
  }, [loggedInTeacherId, isLoadingAuth, router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!name || !email || !password) {
      setError("Por favor, preencha todos os campos.");
      setIsSubmitting(false);
      return;
    }

    try {
      await registerTeacher(name, email, password);
      // O alert pode ser substituído por um toast na página de login se preferir
      alert('Registro realizado com sucesso! Faça o login.');
      router.push('/login'); // Redireciona para login após sucesso
    } catch (err) {
      console.error("Erro no registro (capturado em RegisterPage):", err);
      setError(err.message || 'Erro ao tentar registrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  // Mostra um loader enquanto o estado de autenticação está sendo verificado
  if (isLoadingAuth) {
    return <p className="text-center mt-10 text-gray-600">Verificando autenticação...</p>;
  }
  // Se após isLoadingAuth ser false, o usuário estiver logado, o useEffect acima tratará do redirect.
  if (loggedInTeacherId) {
      return <p className="text-center mt-10 text-gray-600">Redirecionando...</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Registrar Novo Professor
        </h2>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label
              htmlFor="registerName"
              className="block text-sm font-medium text-gray-700"
            >
              Nome Completo
            </label>
            <input
              type="text"
              id="registerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Seu nome completo"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 placeholder-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="registerEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="registerEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 placeholder-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="registerPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              type="password"
              id="registerPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Crie uma senha (mín. 6 caracteres)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              A senha será gerenciada pelo Firebase Authentication.
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <UserPlus className="mr-2 h-5 w-5" />
            )}
            {isSubmitting ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={handleGoToLogin}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Faça Login
          </button>
        </p>
      </div>
    </div>
  );
}
