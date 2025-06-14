import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface para representar um Lead, incluindo o novo campo ai_conversation_enabled
export interface Lead {
  id: string; // ID único do lead no sistema
  nome: string; // Nome completo do lead
  telefone?: string; // Número de telefone para contato
  email?: string; // Email para contato
  clinica_id: string; // ID da clínica à qual o lead pertence
  etapa_kanban_id?: string; // ID da etapa kanban atual do lead
  tag_id?: string; // ID da tag/categoria associada ao lead
  anotacoes?: string; // Observações e anotações sobre o lead
  origem_lead?: string; // Origem do lead (ex: Facebook Ads, site, etc.)
  servico_interesse?: string; // Serviço de interesse do lead
  status?: string; // Status atual do lead no pipeline
  data_ultimo_contato?: string; // Data do último contato realizado
  avatar_url?: string; // URL da imagem de avatar do lead
  ltv?: number; // Lifetime Value - valor estimado do lead
  ai_conversation_enabled?: boolean; // Se a IA está habilitada para este lead
  created_at: string; // Data de criação do registro
  updated_at: string; // Data da última atualização
}

// Interface para dados de criação de Lead
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
  avatar_url?: string | null; // Adicionado
}

// Interface para dados de atualização de Lead
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
  ai_conversation_enabled?: boolean; // Coluna correta
  avatar_url?: string | null; // Adicionado
}

/**
 * Hook para buscar todos os leads
 */
export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      // Log genérico de início da operação
      // console.log('🔍 [useLeads] Buscando leads...');

      const { data, error } = await supabase
        .from('leads')
        .select('*') // Inclui a nova coluna avatar_url se ela existir na tabela
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useLeads] Erro ao buscar leads:', error.message); // Apenas mensagem de erro
        throw new Error(error.message);
      }

      // console.log(`✅ [useLeads] Leads encontrados: ${data?.length || 0}`);
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
      // console.log('➕ [useCreateLead] Criando lead...'); // Log de dados removido

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
        console.error('❌ [useCreateLead] Erro ao criar lead:', error.message);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Erro ao criar lead: dados não retornados');
      }

      // console.log('✅ [useCreateLead] Lead criado com sucesso.'); // Log de dados removido
      return data;
    },

    onSuccess: (newLead) => {
      // console.log('✅ [useCreateLead] onSuccess - Invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Lead "${newLead.nome}" criado com sucesso!`);
    },

    onError: (error) => {
      console.error('❌ [useCreateLead] onError:', error.message);
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
    mutationFn: async ({ id, data: updatePayload }: { id: string; data: UpdateLeadData }): Promise<Lead> => {
      // console.log(`🔄 [useUpdateLead] Atualizando lead ID: ${id}`); // Log de dados removido

      const { data: updatedData, error } = await supabase
        .from('leads')
        .update({
          ...updatePayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`❌ [useUpdateLead] Erro ao atualizar lead ID ${id}:`, error.message);
        throw new Error(error.message);
      }

      if (!updatedData) {
        throw new Error('Lead não encontrado para atualização');
      }

      // console.log(`✅ [useUpdateLead] Lead ID ${id} atualizado com sucesso.`); // Log de dados removido
      return updatedData;
    },

    onSuccess: (updatedLead) => {
      // console.log(`✅ [useUpdateLead] onSuccess - Invalidando queries para lead ID ${updatedLead.id}`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // A notificação de sucesso agora é gerenciada no local da chamada (se necessário) ou pode ser mantida aqui.
      // toast.success(`Lead "${updatedLead.nome}" atualizado com sucesso!`);
    },

    onError: (error) => {
      console.error('❌ [useUpdateLead] onError:', error.message);
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });
};

/**
 * Hook para atualizar o status da conversa de IA do lead (ai_conversation_enabled)
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
      // Log genérico da intenção
      // console.log(`🤖 [useUpdateLeadAiConversationStatus] Tentando atualizar status da IA para lead ID: ${leadId} para ${aiEnabled}`);

      if (!leadId || typeof leadId !== 'string') {
        console.error('❌ [useUpdateLeadAiConversationStatus] Erro: leadId inválido.');
        throw new Error('leadId é obrigatório e deve ser uma string válida para atualizar o status da IA.');
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
        console.error(`❌ [useUpdateLeadAiConversationStatus] Erro do Supabase ao atualizar status da IA para lead ID ${leadId}:`, error.message);
        // Não logar o objeto de erro completo em produção se ele contiver dados sensíveis.
        // Apenas error.message é geralmente seguro.
        throw new Error(`Erro ao atualizar status da IA: ${error.message}`);
      }

      if (!data) {
        console.error(`❌ [useUpdateLeadAiConversationStatus] Nenhum dado retornado após a atualização para lead ID ${leadId}.`);
        throw new Error('Lead não encontrado ou a atualização não retornou dados.');
      }

      // console.log(`✅ [useUpdateLeadAiConversationStatus] Status da IA atualizado com sucesso no DB para lead ID: ${data.id}`);
      return data;
    },

    onSuccess: (updatedLead) => {
      // console.log(`✅ [useUpdateLeadAiConversationStatus] onSuccess - Invalidando queries de leads após atualização do lead ID ${updatedLead.id}`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      const statusMensagem = updatedLead.ai_conversation_enabled ? 'ativada' : 'desativada';
      toast.success(`IA de conversa ${statusMensagem} para o lead "${updatedLead.nome}"!`);
    },

    onError: (error) => {
      console.error('❌ [useUpdateLeadAiConversationStatus] onError - Erro na mutação:', error.message);
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
    mutationFn: async (leadId: string): Promise<string> => {
      // console.log(`🗑️ [useDeleteLead] Deletando lead ID: ${leadId}`);

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error(`❌ [useDeleteLead] Erro ao deletar lead ID ${leadId}:`, error.message);
        throw new Error(error.message);
      }

      // console.log(`✅ [useDeleteLead] Lead ID ${leadId} deletado com sucesso.`);
      return leadId;
    },

    onSuccess: (deletedLeadId) => {
      // console.log(`✅ [useDeleteLead] onSuccess - Invalidando queries após deletar lead.`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deletado com sucesso!');
    },

    onError: (error) => {
      console.error('❌ [useDeleteLead] onError:', error.message);
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
      // console.log(`🚀 [useMoveLeadToStage] Movendo lead ID: ${leadId} para etapa ID: ${etapaId}`);

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
        console.error(`❌ [useMoveLeadToStage] Erro no Supabase ao mover lead ID ${leadId}:`, error.message);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Lead não encontrado após atualização de etapa');
      }

      // console.log(`✅ [useMoveLeadToStage] Lead ID ${data.id} movido com sucesso.`);
      return data;
    },

    onMutate: async ({ leadId, etapaId }) => {
      // console.log(`🔄 [useMoveLeadToStage] onMutate - Atualização otimista para lead ID: ${leadId}`);
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const previousLeads = queryClient.getQueryData<Lead[]>(['leads']);
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
      // console.log('🔄 [useMoveLeadToStage] Cache atualizado otimisticamente');
      return { previousLeads };
    },

    onError: (error, variables, context) => {
      console.error('❌ [useMoveLeadToStage] onError:', error.message);
      if (context?.previousLeads) {
        // console.log('🔄 [useMoveLeadToStage] Revertendo cache para estado anterior');
        queryClient.setQueryData(['leads'], context.previousLeads);
      }
      toast.error(`Erro ao mover lead: ${error.message}`);
    },

    onSuccess: (data) => {
      // console.log(`✅ [useMoveLeadToStage] onSuccess - Lead ID ${data.id} movido.`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Lead "${data.nome}" movido com sucesso!`);
    },

    onSettled: () => {
      // console.log('🏁 [useMoveLeadToStage] onSettled - Operação finalizada');
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
      // console.log(`🔍 [useLeadById] Buscando lead ID: ${leadId}`);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // console.log(`ℹ️ [useLeadById] Lead ID ${leadId} não encontrado.`);
          return null;
        }
        console.error(`❌ [useLeadById] Erro ao buscar lead ID ${leadId}:`, error.message);
        throw new Error(error.message);
      }

      // console.log(`✅ [useLeadById] Lead ID ${data.id} encontrado.`);
      return data;
    },
    enabled: !!leadId,
    staleTime: 1000 * 60 * 5,
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
      // console.log(`🔍 [useLeadsByStage] Buscando leads da etapa ID: ${etapaId}`);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('etapa_kanban_id', etapaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`❌ [useLeadsByStage] Erro ao buscar leads da etapa ID ${etapaId}:`, error.message);
        throw new Error(error.message);
      }

      // console.log(`✅ [useLeadsByStage] Leads encontrados para etapa ID ${etapaId}: ${data?.length || 0}`);
      return data || [];
    },
    enabled: !!etapaId,
    staleTime: 1000 * 60 * 2,
  });
};
