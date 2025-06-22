
/**
 * Hook para gerenciar dados de leads
 * 
 * Este arquivo centraliza todas as operações relacionadas aos leads:
 * - Buscar leads da clínica
 * - Criar, atualizar e deletar leads
 * - Mover leads entre etapas
 * - Controlar follow-up automático
 * - Gerenciar conversação com IA por lead
 * 
 * As funções são re-exportadas do useSupabaseLeads para manter compatibilidade
 * com os componentes existentes que importam deste arquivo.
 */

// Re-exportar tudo do useSupabaseLeads para manter compatibilidade
export {
  useLeads,
  useLeadsByEtapa,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useMoveLeadToEtapa as useMoveLeadToStage, // Alias para compatibilidade
  useUpdateLeadAiConversationStatus,
  useToggleLeadFollowup,
  type CreateLeadData,
  type UpdateLeadData
} from './useSupabaseLeads';

// Importar o tipo base do Supabase
import { Lead as SupabaseLead } from './useSupabaseLeads';

// Interface Lead mais completa para compatibilidade com componentes existentes
export interface Lead extends SupabaseLead {
  etapa_id: string; // Para compatibilidade com componentes antigos
  avatar_url: string | null; // Avatar do lead
  nome_clinica: string | null; // Nome da clínica
}

// Função de dados de leads com filtros (mantida para compatibilidade)
interface UseLeadsDataProps {
  etapaId?: string;
  searchTerm?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook legado para buscar dados de leads com filtros
 * 
 * DEPRECATED: Use useLeads do useSupabaseLeads para novos desenvolvimentos.
 * Este hook é mantido apenas para compatibilidade com componentes existentes.
 */
export const useLeadsData = ({ etapaId, searchTerm, sortOrder }: UseLeadsDataProps = {}) => {
  // Importar o hook dentro da função para evitar problemas de ciclo
  const { useLeads } = require('./useSupabaseLeads');
  
  // Usar o hook principal do Supabase
  const { data: allLeads, isLoading, error, refetch } = useLeads();

  // Transformar leads do Supabase para o formato compatível
  const compatibleLeads: Lead[] = (allLeads || []).map((lead: SupabaseLead) => ({
    ...lead,
    etapa_id: lead.etapa_kanban_id || '', // Mapeamento para compatibilidade
    avatar_url: null, // Campo adicional
    nome_clinica: null // Campo adicional
  }));

  // Aplicar filtros nos dados retornados
  const filteredLeads = compatibleLeads.filter((lead: Lead) => {
    // Filtro por etapa
    if (etapaId && lead.etapa_kanban_id !== etapaId) {
      return false;
    }
    
    // Filtro por termo de busca
    if (searchTerm && lead.nome) {
      return lead.nome.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });

  // Aplicar ordenação
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return {
    leads: sortedLeads,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
};
