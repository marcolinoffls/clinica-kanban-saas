
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
  type Lead as SupabaseLead,
  type CreateLeadData,
  type UpdateLeadData
} from './useSupabaseLeads';

// Interface Lead mais completa para compatibilidade com componentes existentes
export interface Lead {
  id: string;
  nome: string | null;
  telefone?: string | null;
  email?: string | null;
  origem_lead?: string | null;
  servico_interesse?: string | null;
  anotacoes?: string | null;
  etapa_id: string; // Para compatibilidade com componentes antigos
  etapa_kanban_id: string | null; // Nova propriedade do Supabase
  clinica_id: string | null;
  tag_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  data_ultimo_contato?: string | null;
  convertido: boolean | null;
  anuncio?: string | null;
  ad_name?: string | null;
  
  // Propriedades adicionais do Supabase
  status_conversao: string | null;
  ltv: number | null;
  follow_up_pausado: boolean | null;
  data_ultimo_followup: string | null;
  ai_conversation_enabled: boolean | null;
  avatar_url: string | null;
  nome_clinica: string | null;
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
  // Usar o hook principal do Supabase
  const { data: allLeads, isLoading, error, refetch } = useLeads();

  // Aplicar filtros nos dados retornados
  const filteredLeads = (allLeads || []).filter((lead: any) => {
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
