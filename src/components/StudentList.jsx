'use client'; // Necessário para hooks

import React, { useState, useMemo } from 'react';
import { Users, Search, ArrowRight } from 'lucide-react'; // Ícones

// O componente StudentList agora espera uma prop onOpenDetail
export default function StudentList({ onOpenDetail }) {
  const students = teacher?.students || [];

  const [searchTerm, setSearchTerm] = useState('');

  // Filtra os alunos com base no termo de pesquisa
  // useMemo para otimizar, recalculando apenas se students ou searchTerm mudarem
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students; // Retorna todos se a pesquisa estiver vazia
    }
    return students.filter(student =>
      student.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
        <Users className="mr-2 text-teal-600 h-5 w-5" /> Lista de Alunos
      </h2>

      {/* Barra de Pesquisa */}
      <div className="mb-4 relative">
        <input
          type="search"
          id="searchAlunoInput"
          placeholder="Pesquisar aluno por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full text-gray-500 rounded-md border-gray-300 shadow-sm pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Lista Compacta */}
      <div id="listaAlunosCompacta" className="space-y-2 max-h-96 overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <p className="text-gray-500 italic">
            {searchTerm ? 'Nenhum aluno encontrado com este nome.' : 'Nenhum aluno cadastrado ainda.'}
          </p>
        ) : (
          filteredStudents.map((aluno) => (
            <div
              key={aluno.id}
              className="aluno-compact-item flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
              onClick={() => onOpenDetail(aluno.id)} // Chama a função passada por prop
            >
              <span className="font-medium text-gray-800">{aluno.nome}</span>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                Detalhes <ArrowRight className="inline h-3 w-3 ml-1" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}