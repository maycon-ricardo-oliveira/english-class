// utils/formatters.js

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 * @param {number | null | undefined} value - O valor numérico a ser formatado.
 * @returns {string} String formatada como moeda (ex: "R$ 123,45") ou "R$ 0,00" se inválido.
 */
export function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ 0,00';
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata uma string de data (YYYY-MM-DD) para o formato DD/MM/YYYY.
 * @param {string | null | undefined} dateString - A string da data no formato "YYYY-MM-DD".
 * @returns {string} String formatada como DD/MM/YYYY ou uma string indicando data inválida.
 */
export function formatDate(dateString) {
  if (!dateString) {
    return '--/--/----'; // Retorna um placeholder se a data for nula ou indefinida
  }
  try {
    // Adiciona 'T00:00:00Z' para tratar como UTC e evitar problemas de fuso na formatação
    const date = new Date(dateString + 'T00:00:00Z');
    // Verifica se a data é válida após a conversão
    if (isNaN(date.getTime())) {
        throw new Error('Data inválida após parse');
    }
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Meses são 0-indexed
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Erro ao formatar data:", dateString, e);
    return 'Data inválida';
  }
}

/**
 * Formata um objeto Date para uma string no formato yyyy-MM-dd.
 * Útil para pré-preencher campos de input type="date".
 * @param {Date | null | undefined} date - O objeto Date a ser formatado.
 * @returns {string} String formatada como yyyy-MM-dd ou string vazia se a data for inválida.
 */
export function formatDateToInput(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return ''; // Retorna vazio se a data for inválida
  }
  try {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses são 0-indexed
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Erro ao formatar data para input:", date, e);
    return '';
  }
}

/**
 * Formata uma duração em minutos para uma string legível (ex: "1h 30min").
 * @param {number | null | undefined} minutes - A duração total em minutos.
 * @returns {string} String formatada ou string vazia se a duração for inválida ou zero.
 */
export function formatDuration(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
    return '';
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let result = '';
  if (hours > 0) {
    result += `${hours}h`;
  }
  if (mins > 0) {
    // Adiciona espaço apenas se já houver horas
    result += `${hours > 0 ? ' ' : ''}${String(mins).padStart(2, '0')}min`;
  }
   // Se for exatamente 0 minutos (ou inválido), retorna vazio, senão retorna o resultado
  return result.trim() || '';
}

/**
 * Obtém as iniciais de um nome completo.
 * @param {string | null | undefined} fullName - O nome completo.
 * @param {number} [maxLength=2] - Número máximo de iniciais a serem retornadas.
 * @returns {string} As iniciais do nome (ex: "JS" para "John Smith").
 */
export function getInitials(fullName, maxLength = 2) {
    if (!fullName) return '?';
    try {
        return fullName
            .split(' ')
            .map(namePart => namePart[0]) // Pega a primeira letra de cada parte
            .filter(initial => initial) // Remove partes vazias se houver espaços extras
            .join('') // Junta as iniciais
            .substring(0, maxLength) // Limita ao tamanho máximo
            .toUpperCase(); // Converte para maiúsculas
    } catch (e) {
        console.error("Erro ao obter iniciais:", fullName, e);
        return '?';
    }
}
