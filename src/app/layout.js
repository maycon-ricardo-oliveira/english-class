'use client';

import React, { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore'; // Verifique se este caminho está correto
import './globals.css';

export default function RootLayout({ children }) {
  // Para aceder a ações do store, é melhor selecioná-las diretamente.
  // O problema pode ser que o store não está totalmente pronto na primeira renderização do RootLayout.
  const store = useAppStore.getState(); // Acede ao estado inicial/atual do store de forma síncrona
  const initializeAuthListenerAction = store.initializeAuthListener; // Tenta pegar a função diretamente

  const unsubscribeRef = useRef(null);
  const listenerInitializedRef = useRef(false); // Para garantir que inicializamos apenas uma vez

  useEffect(() => {
    console.log("RootLayout useEffect: Verificando initializeAuthListenerAction...");
    if (typeof initializeAuthListenerAction === 'function' && !listenerInitializedRef.current) {
      console.log("RootLayout: initializeAuthListenerAction é uma função. Inicializando listener...");
      unsubscribeRef.current = initializeAuthListenerAction();
      listenerInitializedRef.current = true; // Marca como inicializado
    } else if (typeof initializeAuthListenerAction !== 'function') {
      console.error("RootLayout: initializeAuthListenerAction NÃO é uma função. Valor:", initializeAuthListenerAction);
      // Isso indica um problema sério com a definição do store ou importação.
    } else if (listenerInitializedRef.current) {
      console.log("RootLayout: Listener de autenticação já foi inicializado anteriormente.");
    }

    return () => {
      if (unsubscribeRef.current) {
        console.log("RootLayout: Limpando listener de autenticação do Firebase.");
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        listenerInitializedRef.current = false; // Permite reinicializar se o layout for completamente remontado
      }
    };
    // A dependência de initializeAuthListenerAction aqui pode ser problemática se a referência da função mudar.
    // Como é uma ação do store, ela deve ser estável. Se não for, o problema é mais fundo.
    // Para uma ação de inicialização que só roda uma vez, podemos até remover a dependência após a primeira chamada bem-sucedida,
    // mas o useRef para listenerInitializedRef já controla a execução única.
  }, [initializeAuthListenerAction]);

  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning={true} className="bg-gray-100">
        {children}
      </body>
    </html>
  );
}