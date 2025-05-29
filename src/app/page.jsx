// src/app/page.jsx
'use client'; // Para uso de Link e interatividade se necessário

import React from 'react';
import Link from 'next/link';
import { LogIn, UserPlus, BookOpen, Zap, BarChart3, Users, BellRing, MailQuestion, ClipboardCheck, FileText, Sparkles } from 'lucide-react'; // Ícone Sparkles adicionado

// Componente Navbar simples para esta página
const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              ClassFlow
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <LogIn size={16} className="mr-2" />
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <UserPlus size={16} className="mr-2" />
              Registrar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Componente Footer simples
const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ClassFlow. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-gray-800">
      <Navbar />

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-4xl mx-auto py-20 sm:py-28 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Organize suas Aulas com <span className="block text-indigo-200">ClassFlow</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto">
            Simplifique o gerenciamento de alunos, agendamento de aulas e controle financeiro. Dedique mais tempo ao que realmente importa: ensinar.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-indigo-700 bg-white hover:bg-indigo-50 transition-colors"
            >
              Comece Agora Gratuitamente
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-indigo-200 text-base font-medium rounded-lg text-white hover:bg-white hover:text-indigo-700 hover:border-white transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </header>

      {/* Seção "Sobre o Projeto" */}
      <section id="sobre-o-projeto" className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <BookOpen size={48} className="mx-auto text-indigo-500 mb-4" />
            <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
              Sobre o ClassFlow
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              O ClassFlow foi desenhado para professores particulares e pequenos centros de ensino que buscam uma maneira eficiente e intuitiva de gerenciar suas atividades diárias.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="p-6 bg-gray-50 rounded-lg shadow">
              <h3 className="text-xl font-medium text-gray-800">Gerenciamento de Alunos Simplificado</h3>
              <p className="mt-2 text-gray-600">
                Mantenha um cadastro completo de seus alunos, incluindo informações de contato, valores de aula e histórico de pagamentos, tudo em um só lugar.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow">
              <h3 className="text-xl font-medium text-gray-800">Agenda Inteligente</h3>
              <p className="mt-2 text-gray-600">
                Visualize suas aulas em formatos mensais, semanais ou diários. Marque status, registre faltas e gerencie sua agenda com facilidade.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow">
              <h3 className="text-xl font-medium text-gray-800">Controle Financeiro</h3>
              <p className="mt-2 text-gray-600">
                Acompanhe os pagamentos recebidos, aulas pendentes de pagamento e valores em atraso com o nosso dashboard financeiro intuitivo.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow">
              <h3 className="text-xl font-medium text-gray-800">Foco no Ensino</h3>
              <p className="mt-2 text-gray-600">
                Com a parte administrativa organizada, você ganha mais tempo para preparar suas aulas e se dedicar ao desenvolvimento dos seus alunos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção "Funcionalidades Futuras" - MOVIMENTADA E ESTILIZADA */}
      <section id="funcionalidades-futuras" className="py-16 sm:py-24 bg-indigo-50"> {/* Fundo diferente para destaque */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Sparkles size={48} className="mx-auto text-indigo-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
              Evoluindo com Você: O Que Vem por Aí!
            </h2>
            <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
              O ClassFlow está em constante desenvolvimento para trazer ainda mais ferramentas que otimizem seu dia a dia e enriqueçam a experiência de aprendizado.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
            {[
              { icon: BellRing, title: "Notificações e Lembretes", description: "Alertas para aulas, pagamentos e atividades importantes, para você e seus alunos nunca perderem um compromisso.", color: "text-purple-600", bgColor: "bg-purple-100" },
              { icon: MailQuestion, title: "Newsletter Interativa para Alunos", description: "Envie dicas, curiosidades e pequenas histórias em inglês, promovendo engajamento e aprendizado contínuo.", color: "text-teal-600", bgColor: "bg-teal-100" },
              { icon: ClipboardCheck, title: "Gerenciamento de Tarefas (Homework)", description: "Atribua, acompanhe e forneça feedback sobre as tarefas de casa diretamente na plataforma.", color: "text-pink-600", bgColor: "bg-pink-100" },
              { icon: FileText, title: "Anotações Detalhadas por Aula", description: "Mantenha um registro do progresso de cada aluno e anotações importantes sobre cada aula ministrada.", color: "text-orange-600", bgColor: "bg-orange-100" }
            ].map((feature, index) => (
              <div key={index} className="flex p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex-shrink-0">
                  <div className={`flex items-center justify-center h-12 w-12 rounded-lg ${feature.bgColor} ${feature.color}`}>
                    <feature.icon size={28} />
                  </div>
                </div>
                <div className="ml-5">
                  <h3 className="text-xl leading-6 font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção "Sobre Produtividade" */}
      <section id="produtividade" className="py-16 sm:py-24 bg-white"> {/* Mudado para bg-white para alternar */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Zap size={48} className="mx-auto text-green-500 mb-4" /> {/* Cor do ícone ajustada */}
            <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
              Aumente sua Produtividade
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ferramentas certas podem transformar sua rotina de trabalho. O ClassFlow ajuda você a ser mais produtivo de várias maneiras:
            </p>
          </div>
          <div className="mt-10 space-y-10"> {/* Aumentado space-y */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-md">
              <h3 className="text-xl font-medium text-gray-800">Centralização da Informação</h3>
              <p className="mt-2 text-gray-600">
                Ter todos os dados de alunos, aulas e finanças em um único sistema economiza tempo e reduz a chance de erros ou esquecimentos.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg shadow-md">
              <h3 className="text-xl font-medium text-gray-800">Visão Clara da Agenda</h3>
              <p className="mt-2 text-gray-600">
                Com o calendário integrado, você planeja melhor seu dia e semana, evitando conflitos de horário e otimizando seu tempo disponível.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
