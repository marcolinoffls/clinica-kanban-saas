
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
 * - Atualizar estado de ativação da IA por lead (NOVO)
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
  ai_conversation_enabled: boolean | null; // NOVO: Controle de IA por lead
}

// Interface para criação de lead (campos obrigatórios)
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
  ai_conversation_enabled?: boolean; // NOVO: Estado inicial da IA
}

// Hook para buscar todos os leads da clínica do usuário
export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      console.log('🔍 Buscando leads da clínica do usuário...');

      const { data, error } = await supabase
        .from('leads')
        .select('*') // Agora inclui ai_conversation_enabled
        .order('data_ultimo_contato', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar leads:', error);
        throw new Error(`Erro ao buscar leads: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} leads encontrados`);
      return data || [];
    },
    staleTime: 30000, // Cache por 30 segundos
  });
};

// Hook para criar novo lead
export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: CreateLeadData): Promise<Lead> => {
      console.log('➕ Criando novo lead:', leadData.nome);

      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar lead:', error);
        throw new Error(`Erro ao criar lead: ${error.message}`);
      }

      console.log('✅ Lead criado com sucesso:', data.nome);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na criação do lead:', error);
      toast.error(`Erro ao criar lead: ${error.message}`);
    },
  });
};

// Hook para atualizar lead existente
export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Lead> & { id: string }): Promise<Lead> => {
      console.log('📝 Atualizando lead:', id);

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
        console.error('❌ Erro ao atualizar lead:', error);
        throw new Error(`Erro ao atualizar lead: ${error.message}`);
      }

      console.log('✅ Lead atualizado com sucesso:', data.nome);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na atualização do lead:', error);
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });
};

// NOVO: Hook para atualizar apenas o estado da IA para um lead específico
export const useUpdateLeadAiConversationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, aiEnabled }: { leadId: string; aiEnabled: boolean }): Promise<Lead> => {
      console.log('🤖 Atualizando estado da IA para lead:', leadId, 'aiEnabled:', aiEnabled);

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
        console.error('❌ Erro ao atualizar estado da IA do lead:', error);
        throw new Error(`Erro ao atualizar estado da IA: ${error.message}`);
      }

      console.log('✅ Estado da IA atualizado com sucesso para lead:', data.nome);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Toast sutil para não poluir a interface
      console.log(`ℹ️ IA ${data.ai_conversation_enabled ? 'ativada' : 'desativada'} para ${data.nome}`);
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao atualizar estado da IA:', error);
      toast.error(`Erro ao atualizar IA: ${error.message}`);
    },
  });
};

// Hook para deletar lead
export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string): Promise<void> => {
      console.log('🗑️ Deletando lead:', leadId);

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('❌ Erro ao deletar lead:', error);
        throw new Error(`Erro ao deletar lead: ${error.message}`);
      }

      console.log('✅ Lead deletado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na exclusão do lead:', error);
      toast.error(`Erro ao deletar lead: ${error.message}`);
    },
  });
};

// Hook para mover lead entre etapas
export const useMoveLeadToStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, etapaId }: { leadId: string; etapaId: string }): Promise<Lead> => {
      console.log('🔄 Movendo lead para etapa:', leadId, '->', etapaId);

      const { data, error } = await supabase
        .from('leads')
        .update({ 
          etapa_kanban_id: etapaId,
          data_ultimo_contato: new Date().toISOString(), // Atualiza data_ultimo_contato
          updated_at: new Date().toISOString(), // Atualiza updated_at
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        // ...
        throw new Error(`Erro ao mover lead: ${error.message}`);
      }
      // ...
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] }); // Invalida a query 'leads'
    },
    // ...
  });
};