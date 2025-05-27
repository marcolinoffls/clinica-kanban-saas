
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
}

// Hook para buscar todos os leads da clínica do usuário
export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      console.log('🔍 Buscando leads da clínica do usuário...');

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('data_ultimo_contato', { ascending: false, nullsLast: true })
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
    mutationFn: async (leadData: Partial<Lead>): Promise<Lead> => {
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
          data_ultimo_contato: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao mover lead:', error);
        throw new Error(`Erro ao mover lead: ${error.message}`);
      }

      console.log('✅ Lead movido com sucesso');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao mover lead:', error);
      toast.error(`Erro ao mover lead: ${error.message}`);
    },
  });
};
