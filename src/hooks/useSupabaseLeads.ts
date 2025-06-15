
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar leads no Supabase
 * 
 * Este hook gerencia todas as operações CRUD relacionadas aos leads:
 * - Buscar leads da clínica do usuário autenticado
 * - Criar novos leads
 * - Atualizar leads existentes
 * - Deletar leads
 * - Controlar follow-up automático (NOVO)
 * 
 * Com as políticas RLS implementadas, os leads são automaticamente
 * filtrados pela clínica do usuário logado, garantindo isolamento de dados.
 * 
 * NOVO: Campos de controle de follow-up:
 * - follow_up_pausado: controla se o lead deve receber follow-ups automáticos
 * - data_ultimo_followup: registra quando foi enviado o último follow-up
 */

export interface Lead {
  id: string;
  // CORREÇÃO: O nome agora pode ser nulo para acomodar leads de fontes como o Instagram
  nome: string | null;
  telefone: string | null;
  email: string | null;
  etapa_kanban_id: string | null;
  tag_id: string | null;
  anotacoes: string | null;
  origem_lead: string | null;
  servico_interesse: string | null;
  status_conversao: string | null;
  convertido: boolean | null;
  ltv: number | null;
  data_ultimo_contato: string | null;
  clinica_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  // NOVOS CAMPOS para follow-up
  follow_up_pausado: boolean | null;
  data_ultimo_followup: string | null;
  ai_conversation_enabled: boolean | null;
}

export interface CreateLeadData {
  // CORREÇÃO: O nome agora é opcional na criação do lead
  nome?: string;
  telefone?: string;
  email?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  anotacoes?: string;
  origem_lead?: string;
  servico_interesse?: string;
  clinica_id: string; // Obrigatório para associar à clínica correta
  // NOVOS CAMPOS opcionais para follow-up
  follow_up_pausado?: boolean;
  ai_conversation_enabled?: boolean;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
  id: string;
  data_ultimo_followup?: string; // NOVO: permite atualizar data do último follow-up
}

// Hook para buscar todos os leads da clínica do usuário
export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      console.log('Buscando leads da clínica do usuário...');

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar leads:', error);
        throw new Error(`Erro ao buscar leads: ${error.message}`);
      }

      console.log(`${data?.length || 0} leads encontrados`);
      return data || [];
    },
    staleTime: 30000, // Cache por 30 segundos
  });
};

// Hook para buscar leads por etapa kanban
export const useLeadsByEtapa = (etapaId: string | null) => {
  return useQuery({
    queryKey: ['leads', 'etapa', etapaId],
    queryFn: async (): Promise<Lead[]> => {
      if (!etapaId) return [];

      console.log('Buscando leads da etapa:', etapaId);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('etapa_kanban_id', etapaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar leads por etapa:', error);
        throw new Error(`Erro ao buscar leads: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!etapaId,
    staleTime: 30000,
  });
};

// Hook para criar novo lead
export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: CreateLeadData): Promise<Lead> => {
      console.log('Criando novo lead:', leadData);

      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar lead:', error);
        throw new Error(`Erro ao criar lead: ${error.message}`);
      }

      console.log('Lead criado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache dos leads para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na criação do lead:', error);
      toast.error(`Erro ao criar lead: ${error.message}`);
    },
  });
};

// Hook para atualizar lead existente
export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: UpdateLeadData): Promise<Lead> => {
      const { id, ...updateData } = leadData;
      console.log('Atualizando lead:', id, updateData);

      // Adicionar timestamp de atualização
      const dataWithTimestamp = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('leads')
        .update(dataWithTimestamp)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar lead:', error);
        throw new Error(`Erro ao atualizar lead: ${error.message}`);
      }

      console.log('Lead atualizado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache dos leads para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na atualização do lead:', error);
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });
};

// Hook para deletar lead
export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string): Promise<void> => {
      console.log('Deletando lead:', leadId);

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao deletar lead:', error);
        throw new Error(`Erro ao deletar lead: ${error.message}`);
      }

      console.log('Lead deletado com sucesso');
    },
    onSuccess: () => {
      // Invalidar cache dos leads para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na exclusão do lead:', error);
      toast.error(`Erro ao deletar lead: ${error.message}`);
    },
  });
};

// Hook para mover lead para outra etapa
export const useMoveLeadToEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, etapaId }: { leadId: string; etapaId: string }) => {
      console.log('Movendo lead para etapa:', leadId, etapaId);

      const { data, error } = await supabase
        .from('leads')
        .update({ 
          etapa_kanban_id: etapaId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao mover lead:', error);
        throw new Error(`Erro ao mover lead: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar cache dos leads para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead movido com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao mover lead:', error);
      toast.error(`Erro ao mover lead: ${error.message}`);
    },
  });
};

// NOVO: Hook para atualizar estado da IA por lead
export const useUpdateLeadAiConversationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      leadId, 
      enabled 
    }: { 
      leadId: string; 
      enabled: boolean; 
    }): Promise<Lead> => {
      console.log('Atualizando status de IA para lead:', leadId, enabled);

      const { data, error } = await supabase
        .from('leads')
        .update({ 
          ai_conversation_enabled: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar status de IA:', error);
        throw new Error(`Erro ao atualizar IA: ${error.message}`);
      }

      console.log('Status de IA atualizado com sucesso:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(
        variables.enabled 
          ? 'IA ativada para este lead' 
          : 'IA desativada para este lead'
      );
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar IA:', error);
      toast.error(`Erro ao alterar IA: ${error.message}`);
    },
  });
};

// NOVO: Hook para pausar/despausar follow-up de um lead
export const useToggleLeadFollowup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      leadId, 
      pausado 
    }: { 
      leadId: string; 
      pausado: boolean; 
    }): Promise<Lead> => {
      console.log('Alterando status de follow-up do lead:', leadId, pausado);

      const { data, error } = await supabase
        .from('leads')
        .update({ 
          follow_up_pausado: pausado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao alterar follow-up:', error);
        throw new Error(`Erro ao alterar follow-up: ${error.message}`);
      }

      console.log('Follow-up do lead alterado com sucesso:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(
        variables.pausado 
          ? 'Follow-up pausado para este lead' 
          : 'Follow-up reativado para este lead'
      );
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar follow-up:', error);
      toast.error(`Erro ao alterar follow-up: ${error.message}`);
    },
  });
};
