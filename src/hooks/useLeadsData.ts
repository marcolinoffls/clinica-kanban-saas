
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar dados de leads
 * 
 * Este hook centraliza todas as operações relacionadas aos leads:
 * - Buscar leads da clínica do usuário
 * - Criar novos leads
 * - Atualizar leads existentes
 * - Deletar leads
 * - Mover leads entre etapas
 * - Atualizar estado de ativação da IA por lead
 * 
 * Utiliza as políticas RLS para garantir isolamento por clínica
 */

export interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  clinica_id: string | null;
  etapa_kanban_id: string | null;
  tag_id: string | null;
  anotacoes: string | null;
  origem_lead: string | null;
  servico_interesse: string | null;
  convertido: boolean | null;
  status_conversao: string | null;
  data_ultimo_contato: string | null;
  created_at: string | null;
  updated_at: string | null;
  ai_conversation_enabled: boolean | null;
}

export interface CreateLeadData {
  nome: string;
  telefone?: string;
  email?: string;
  clinica_id: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  anotacoes?: string;
  origem_lead?: string;
  servico_interesse?: string;
  ai_conversation_enabled?: boolean;
}

export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('data_ultimo_contato', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar leads:', error);
        throw new Error(`Erro ao buscar leads: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 30000,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: CreateLeadData): Promise<Lead> => {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar lead: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar lead: ${error.message}`);
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Lead> & { id: string }): Promise<Lead> => {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar lead: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });
};

export const useUpdateLeadAiConversationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, aiEnabled }: { leadId: string; aiEnabled: boolean }): Promise<Lead> => {
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
        throw new Error(`Erro ao atualizar estado da IA: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar IA: ${error.message}`);
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string): Promise<void> => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        throw new Error(`Erro ao deletar lead: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar lead: ${error.message}`);
    },
  });
};

/**
 * Hook para mover lead entre etapas com atualização otimista
 */
export const useMoveLeadToStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, etapaId }: { leadId: string; etapaId: string }): Promise<Lead> => {
      console.log('[useMoveLeadToStage] 📡 Atualizando lead no Supabase:', { leadId, etapaId });

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
        console.error('[useMoveLeadToStage] ❌ Erro no Supabase:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Lead não encontrado após atualização');
      }

      console.log('[useMoveLeadToStage] ✅ Lead atualizado com sucesso no Supabase');
      return data;
    },

    onMutate: async ({ leadId, etapaId }) => {
      // Cancela queries pendentes para evitar conflitos
      await queryClient.cancelQueries({ queryKey: ['leads'] });

      // Salva o estado anterior para rollback se necessário
      const previousLeads = queryClient.getQueryData<Lead[]>(['leads']);

      // Atualização otimista: move o lead para nova etapa imediatamente na UI
      queryClient.setQueryData<Lead[]>(['leads'], old =>
        old
          ? old.map(lead =>
              lead.id === leadId
                ? { ...lead, etapa_kanban_id: etapaId }
                : lead
            )
          : []
      );

      console.log('[useMoveLeadToStage] 🔄 Atualização otimista aplicada');

      return { previousLeads };
    },

    onError: (error, _variables, context) => {
      // Reverte a atualização otimista em caso de erro
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads'], context.previousLeads);
      }
      console.error('[useMoveLeadToStage] ❌ Erro na mutação:', error);
      toast.error(`Erro ao mover lead: ${error.message}`);
    },

    onSuccess: (data) => {
      // Invalida e recarrega os dados para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Lead "${data.nome}" movido para nova etapa!`);
      console.log('[useMoveLeadToStage] 🎉 Lead movido com sucesso!');
    },
  });
};
