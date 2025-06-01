import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  origem_lead?: string | null;
  servico_interesse?: string | null;
  anotacoes?: string | null;
  etapa_kanban_id: string;
  tag_id?: string;
  data_ultimo_contato?: string;
  status_ia_conversa?: 'ativo' | 'pausado' | 'finalizado';
  ai_conversation_enabled?: boolean;
  created_at: string;
  updated_at: string;
  clinica_id: string;
}

export interface CreateLeadData {
  nome: string;
  telefone?: string;
  email?: string;
  origem_lead?: string;
  servico_interesse?: string;
  anotacoes?: string;
  etapa_kanban_id: string;
  tag_id?: string;
  clinica_id: string;
}

export interface UpdateLeadData {
  nome?: string;
  telefone?: string;
  email?: string;
  origem_lead?: string;
  servico_interesse?: string;
  anotacoes?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  data_ultimo_contato?: string;
  status_ia_conversa?: 'ativo' | 'pausado' | 'finalizado';
  ai_conversation_enabled?: boolean;
}

/**
 * Hook para buscar todos os leads
 */
export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      console.log('🔍 [useLeads] Buscando leads...');
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useLeads] Erro ao buscar leads:', error);
        throw new Error(error.message);
      }

      console.log('✅ [useLeads] Leads encontrados:', data?.length || 0);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};

/**
 * Hook para criar um novo lead
 */
export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: CreateLeadData): Promise<Lead> => {
      console.log('➕ [useCreateLead] Criando lead:', leadData);

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...leadData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [useCreateLead] Erro ao criar lead:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Erro ao criar lead: dados não retornados');
      }

      console.log('✅ [useCreateLead] Lead criado com sucesso:', data);
      return data;
    },

    onSuccess: (newLead) => {
      console.log('✅ [useCreateLead] onSuccess - Invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Lead "${newLead.nome}" criado com sucesso!`);
    },

    onError: (error) => {
      console.error('❌ [useCreateLead] onError:', error);
      toast.error(`Erro ao criar lead: ${error.message}`);
    },
  });
};

/**
 * Hook para atualizar um lead existente
 */
export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLeadData }): Promise<Lead> => {
      console.log('🔄 [useUpdateLead] Atualizando lead:', id, data);

      const { data: updatedData, error } = await supabase
        .from('leads')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useUpdateLead] Erro ao atualizar lead:', error);
        throw new Error(error.message);
      }

      if (!updatedData) {
        throw new Error('Lead não encontrado para atualização');
      }

      console.log('✅ [useUpdateLead] Lead atualizado com sucesso:', updatedData);
      return updatedData;
    },

    onSuccess: (updatedLead) => {
      console.log('✅ [useUpdateLead] onSuccess - Invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Lead "${updatedLead.nome}" atualizado com sucesso!`);
    },

    onError: (error) => {
      console.error('❌ [useUpdateLead] onError:', error);
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });
};

/**
 * Hook para atualizar o status da conversa de IA do lead
 */
export const useUpdateLeadAiConversationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      aiEnabled
    }: {
      leadId: string;
      aiEnabled: boolean
    }): Promise<Lead> => {
      console.log('🤖 [useUpdateLeadAiConversationStatus] Atualizando status IA:', {
        leadId,
        aiEnabled,
        timestamp: new Date().toISOString()
      });

      // Validar leadId
      if (!leadId || typeof leadId !== 'string') {
        throw new Error('leadId é obrigatório e deve ser uma string válida');
      }

      const { data, error } = await supabase
        .from('leads')
        .update({
          ai_conversation_enabled: aiEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('❌ [useUpdateLeadAiConversationStatus] Erro detalhado:', {
          error,
          leadId,
          aiEnabled,
          message: error.message,
          code: error.code,
          hint: error.hint
        });
        throw new Error(`Erro ao atualizar status da IA: ${error.message}`);
      }

      if (!data) {
        console.error('❌ [useUpdateLeadAiConversationStatus] Dados não retornados após update');
        throw new Error('Lead não encontrado ou não pôde ser atualizado');
      }

      console.log('✅ [useUpdateLeadAiConversationStatus] Status da IA atualizado com sucesso:', {
        leadId: data.id,
        nome: data.nome,
        ai_conversation_enabled: data.ai_conversation_enabled,
        updated_at: data.updated_at
      });
      
      return data;
    },

    onSuccess: (updatedLead) => {
      console.log('✅ [useUpdateLeadAiConversationStatus] onSuccess - Invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      const statusMensagem = updatedLead.ai_conversation_enabled ? 'ativada' : 'desativada';
      toast.success(`IA ${statusMensagem} para ${updatedLead.nome}!`);
    },

    onError: (error) => {
      console.error('❌ [useUpdateLeadAiConversationStatus] onError:', error);
      toast.error(`Erro ao atualizar status da IA: ${error.message}`);
    },
  });
};

/**
 * Hook para deletar um lead
 */
export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string): Promise<void> => {
      console.log('🗑️ [useDeleteLead] Deletando lead:', leadId);

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('❌ [useDeleteLead] Erro ao deletar lead:', error);
        throw new Error(error.message);
      }

      console.log('✅ [useDeleteLead] Lead deletado com sucesso');
    },

    onSuccess: () => {
      console.log('✅ [useDeleteLead] onSuccess - Invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deletado com sucesso!');
    },

    onError: (error) => {
      console.error('❌ [useDeleteLead] onError:', error);
      toast.error(`Erro ao deletar lead: ${error.message}`);
    },
  });
};

/**
 * Hook para mover um lead para uma nova etapa (usado no drag and drop do Kanban)
 */
export const useMoveLeadToStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, etapaId }: { leadId: string; etapaId: string }): Promise<Lead> => {
      console.log('🚀 [useMoveLeadToStage] Iniciando mutationFn:', { leadId, etapaId });

      if (!leadId || !etapaId) {
        throw new Error('leadId e etapaId são obrigatórios');
      }

      const { data, error } = await supabase
        .from('leads')
        .update({
          etapa_kanban_id: etapaId,
          data_ultimo_contato: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('❌ [useMoveLeadToStage] Erro no Supabase:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Lead não encontrado após atualização');
      }

      console.log('✅ [useMoveLeadToStage] Lead atualizado com sucesso:', data);
      return data;
    },

    // Atualização otimista - atualiza a UI imediatamente
    onMutate: async ({ leadId, etapaId }) => {
      console.log('🔄 [useMoveLeadToStage] onMutate - Atualização otimista:', { leadId, etapaId });
      
      // Cancela queries pendentes para evitar conflitos
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      
      // Salva o estado anterior para rollback em caso de erro
      const previousLeads = queryClient.getQueryData<Lead[]>(['leads']);

      // Atualiza otimisticamente o cache
      queryClient.setQueryData<Lead[]>(['leads'], old =>
        old
          ? old.map(lead =>
              lead.id === leadId
                ? { 
                    ...lead, 
                    etapa_kanban_id: etapaId,
                    data_ultimo_contato: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                : lead
            )
          : []
      );

      console.log('🔄 [useMoveLeadToStage] Cache atualizado otimisticamente');
      return { previousLeads };
    },

    onError: (error, variables, context) => {
      console.error('❌ [useMoveLeadToStage] onError:', error);
      
      // Reverte para o estado anterior em caso de erro
      if (context?.previousLeads) {
        console.log('🔄 [useMoveLeadToStage] Revertendo cache para estado anterior');
        queryClient.setQueryData(['leads'], context.previousLeads);
      }
      
      toast.error(`Erro ao mover lead: ${error.message}`);
    },

    onSuccess: (data) => {
      console.log('✅ [useMoveLeadToStage] onSuccess:', data);
      
      // Invalida e recarrega os dados do servidor para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Lead "${data.nome}" movido com sucesso!`);
    },

    onSettled: () => {
      console.log('🏁 [useMoveLeadToStage] onSettled - Operação finalizada');
    },
  });
};

/**
 * Hook para buscar um lead específico por ID
 */
export const useLeadById = (leadId: string) => {
  return useQuery({
    queryKey: ['leads', leadId],
    queryFn: async (): Promise<Lead | null> => {
      if (!leadId) return null;

      console.log('🔍 [useLeadById] Buscando lead:', leadId);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ [useLeadById] Lead não encontrado:', leadId);
          return null;
        }
        console.error('❌ [useLeadById] Erro ao buscar lead:', error);
        throw new Error(error.message);
      }

      console.log('✅ [useLeadById] Lead encontrado:', data);
      return data;
    },
    enabled: !!leadId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para buscar leads por etapa
 */
export const useLeadsByStage = (etapaId: string) => {
  return useQuery({
    queryKey: ['leads', 'by-stage', etapaId],
    queryFn: async (): Promise<Lead[]> => {
      if (!etapaId) return [];

      console.log('🔍 [useLeadsByStage] Buscando leads da etapa:', etapaId);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('etapa_kanban_id', etapaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useLeadsByStage] Erro ao buscar leads:', error);
        throw new Error(error.message);
      }

      console.log('✅ [useLeadsByStage] Leads encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!etapaId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};
