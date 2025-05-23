// src/app/layout.jsx
import React from 'react'; // Não precisa de 'use client' aqui se o AuthProvider for 'use client'
import { AuthProvider } from '../context/AuthContext'; // Ajuste o caminho se necessário
import './globals.css'; // Seus estilos globais

// Opcional: Importar fontes, etc.
// import { Inter } from 'next/font/google';
// const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  // A lógica do listener de autenticação agora está DENTRO do AuthProvider.
  // Este RootLayout apenas precisa envolver os children com o AuthProvider.

  return (
    <html lang="pt-BR">
      {/* <body className={inter.className} suppressHydrationWarning={true}> */}
      <body suppressHydrationWarning={true} className="bg-gray-100 dark:bg-gray-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}