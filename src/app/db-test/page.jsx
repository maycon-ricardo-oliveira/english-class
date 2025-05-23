'use client';

import React, { useState, useEffect } from 'react';
import { database } from '../../utils/firebase';
import { ref, push, set, onValue, remove, off, update } from 'firebase/database';
import Link from 'next/link';
import { PlusCircle, Trash2, ListChecks, ArrowLeft, UserPlus as UserPlusIcon, CheckSquare, Square } from 'lucide-react';

import StudentForm from '../../components/StudentForm';
import Toast from '../../components/Toast';

export default function DbTestPage() {
  // Estados para o formulário de Item Genérico
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [items, setItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false); // Estado para submissão do item genérico

  // Estado para o input da nova tarefa e submissão de tarefa
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [isSubmittingTask, setIsSubmittingTask] = useState({});

  // Estado para o Toast e Modal de Aluno
  const [toast, setToast] = useState({ message: '', type: '', isOpen: false });
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const fixedTeacherIdForTest = "qRM8Lr2dIUWHepJG7IppXCfnPFm1";

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, isOpen: true, duration });
  };
  const closeToast = () => {
    setToast({ message: '', type: '', isOpen: false });
  };

  const itemsRef = ref(database, 'testItems');

  useEffect(() => {
    setIsLoadingItems(true);
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedItems = [];
      if (data) {
        for (const key in data) {
          loadedItems.push({
            id: key,
            ...data[key],
            tasks: data[key].tasks ? Object.entries(data[key].tasks).map(([id, task]) => ({ id, ...task })) : []
          });
        }
      }
      setItems(loadedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setIsLoadingItems(false);
    }, (error) => {
      console.error("Firebase read error (items):", error);
      showToast("Erro ao carregar itens.", 'error');
      setIsLoadingItems(false);
    });

    return () => {
      if (itemsRef && typeof unsubscribe === 'function') {
        off(itemsRef, 'value', unsubscribe);
      }
    };
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemDescription.trim()) {
      showToast("Nome e descrição do item são obrigatórios.", 'error');
      return;
    }
    setIsSubmittingItem(true);
    try {
      const newItemRef = push(itemsRef);
      await set(newItemRef, {
        name: itemName,
        description: itemDescription,
        createdAt: new Date().toISOString(),
        tasks: {}
      });
      showToast(`Item "${itemName}" adicionado!`, 'success');
      setItemName('');
      setItemDescription('');
    } catch (err) {
      showToast("Erro ao adicionar item: " + err.message, 'error');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (confirm(`Deletar o item "${itemName}" e todas as suas tarefas?`)) {
      try {
        await remove(ref(database, `testItems/${itemId}`));
        showToast(`Item "${itemName}" deletado.`, 'success');
      } catch (err) {
        showToast("Erro ao deletar item: " + err.message, 'error');
      }
    }
  };

  const handleNewTaskInputChange = (itemId, value) => {
    setNewTaskInputs(prev => ({ ...prev, [itemId]: value }));
  };

  const handleAddTask = async (e, itemId) => {
    e.preventDefault();
    const taskName = newTaskInputs[itemId]?.trim();
    if (!taskName) {
      showToast("O nome da tarefa é obrigatório.", "error");
      return;
    }
    setIsSubmittingTask(prev => ({ ...prev, [itemId]: true }));
    try {
      const tasksForItemRef = ref(database, `testItems/${itemId}/tasks`);
      const newTaskRef = push(tasksForItemRef);
      await set(newTaskRef, {
        taskName: taskName,
        completed: false,
        createdAt: new Date().toISOString()
      });
      showToast(`Tarefa "${taskName}" adicionada!`, "success");
      setNewTaskInputs(prev => ({ ...prev, [itemId]: '' }));
    } catch (error) {
      showToast("Erro ao adicionar tarefa: " + error.message, "error");
      console.error("Erro ao adicionar tarefa:", error);
    } finally {
      setIsSubmittingTask(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleToggleTask = async (itemId, taskId, currentCompletedStatus) => {
    try {
      const taskRef = ref(database, `testItems/${itemId}/tasks/${taskId}`);
      await update(taskRef, { completed: !currentCompletedStatus });
      showToast(`Tarefa marcada como ${!currentCompletedStatus ? 'concluída' : 'pendente'}.`, "success");
    } catch (error) {
      showToast("Erro ao atualizar tarefa: " + error.message, "error");
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

  const handleDeleteTask = async (itemId, taskId, taskName) => {
    if (confirm(`Deletar a tarefa "${taskName}"?`)) {
      try {
        await remove(ref(database, `testItems/${itemId}/tasks/${taskId}`));
        showToast(`Tarefa "${taskName}" deletada.`, "success");
      } catch (error) {
        showToast("Erro ao deletar tarefa: " + error.message, "error");
        console.error("Erro ao deletar tarefa:", error);
      }
    }
  };

  const handleOpenAddStudentModal = () => setIsAddStudentModalOpen(true);
  const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline">
                <ArrowLeft size={18} className="mr-1" />
                Voltar para Home (se existir)
            </Link>
        </div>
        <h1 className="text-3xl font-bold text-center">Teste Firebase Realtime DB</h1>

        {toast.isOpen && ( <Toast message={toast.message} type={toast.type} onClose={closeToast} duration={toast.duration}/> )}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center"><UserPlusIcon size={20} className="mr-2 text-green-500" /> Testar Cadastro de Aluno (ID Fixo)</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Adiciona aluno ao professor com ID: <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-xs">{fixedTeacherIdForTest}</code>.</p>
            <button onClick={handleOpenAddStudentModal} type="button" className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Abrir Formulário de Cadastro de Aluno (Teste)</button>
        </div>

        {isAddStudentModalOpen && (
            <div className="fixed inset-0 bg-gray-300/45 backdrop-blur-sm overflow-y-auto h-full w-full z-[70] flex items-center justify-center p-4">
                <div className="relative mx-auto border w-full max-w-lg shadow-xl rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
                    <StudentForm isOpen={isAddStudentModalOpen} showToast={showToast} onCloseModal={handleCloseAddStudentModal} teacherIdOverride={fixedTeacherIdForTest} />
                </div>
            </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><PlusCircle size={20} className="mr-2 text-indigo-500" /> Adicionar Item Genérico</h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Item:</label>
              <input 
                type="text" 
                id="itemName" 
                value={itemName} 
                onChange={(e) => setItemName(e.target.value)} 
                placeholder="Ex: Lista de Compras" 
                disabled={isSubmittingItem} // Desabilita durante a submissão
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70"
              />
            </div>
            <div>
              <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição:</label>
              <textarea 
                id="itemDescription" 
                value={itemDescription} 
                onChange={(e) => setItemDescription(e.target.value)} 
                rows="3" 
                placeholder="Ex: Itens para comprar no mercado" 
                disabled={isSubmittingItem} // Desabilita durante a submissão
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmittingItem} // Desabilita durante a submissão
              className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmittingItem ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isSubmittingItem ? 'Adicionando...' : 'Adicionar Item Genérico'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><ListChecks size={20} className="mr-2 text-teal-500" /> Itens Salvos e Suas Tarefas</h2>
          {isLoadingItems ? (<p>Carregando itens...</p>) : items.length === 0 ? (<p className="text-gray-500 dark:text-gray-400 italic">Nenhum item encontrado.</p>) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.id} className="p-4 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/30 shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                      {item.createdAt && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Criado em: {new Date(item.createdAt).toLocaleString('pt-BR')}</p>}
                    </div>
                    <button onClick={() => handleDeleteItem(item.id, item.name)} className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-700/30" title="Deletar item"><Trash2 size={16} /></button>
                  </div>
                  
                  <form onSubmit={(e) => handleAddTask(e, item.id)} className="flex gap-2 my-3 items-center">
                    <input
                      type="text"
                      value={newTaskInputs[item.id] || ''}
                      onChange={(e) => handleNewTaskInputChange(item.id, e.target.value)}
                      placeholder="Nova tarefa..."
                      disabled={isSubmittingTask[item.id]}
                      className="flex-grow rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70"
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmittingTask[item.id]}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm disabled:opacity-50 flex items-center justify-center w-10 h-10" // Tamanho fixo para o botão
                    >
                      {isSubmittingTask[item.id] ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <PlusCircle size={18}/>
                      )}
                    </button>
                  </form>

                  {item.tasks && item.tasks.length > 0 ? (
                    <ul className="space-y-1.5 pl-4 mt-2 border-l-2 dark:border-gray-600">
                      {item.tasks.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map(task => (
                        <li key={task.id} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center">
                            <button onClick={() => handleToggleTask(item.id, task.id, task.completed)} className="mr-2 p-0.5 focus:outline-none">
                              {task.completed ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} className="text-gray-400 dark:text-gray-500" />}
                            </button>
                            <span className={`${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                              {task.taskName}
                            </span>
                          </div>
                          <button onClick={() => handleDeleteTask(item.id, task.id, task.taskName)} className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-md hover:bg-red-100/50 dark:hover:bg-red-900/30" title="Deletar tarefa">
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic pl-4 mt-2">Nenhuma tarefa para este item.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
