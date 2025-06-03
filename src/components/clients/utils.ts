
import { Lead } from '@/hooks/useLeadsData';

/**
 * Utilitários para formatação e processamento de dados dos clientes
 */

// Função para formatizar data no formato brasileiro
export const formatarData = (dataString: string | null | undefined) => {
  if (!dataString) return 'Nunca';
  const data = new Date(dataString);
  if (isNaN(data.getTime())) return 'Data inválida';
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Função para obter listas únicas de origens dos leads
export const getUniqueOrigens = (leads: Lead[] = []) => {
  const origens = leads.map(lead => lead.origem_lead).filter(Boolean);
  return [...new Set(origens)];
};

// Função para obter listas únicas de serviços dos leads
export const getUniqueServicos = (leads: Lead[] = []) => {
  const servicos = leads.map(lead => lead.servico_interesse).filter(Boolean);
  return [...new Set(servicos)];
};
