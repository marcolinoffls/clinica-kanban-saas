
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClinicaData } from './useClinicaData';
import type { Lead, CreateLeadData, UpdateLeadData } from '@/types';

/**
 * Hook para criar um novo lead
 */
export const useCreateLead = () => {
  return useMutation({
    mutationFn: async (newLead: Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar lead:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Lead criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar lead: ${error.message}`);
    },
  });
};

/**
 * Hook para atualizar um lead existente
 */
export const useUpdateLead = () => {
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar lead:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar lead: ${error.message}`);
    },
  });
};

/**
 * Hook para atualizar o status da conversa com a IA de um lead
 */
export const useUpdateLeadAiConversationStatus = () => {
  return useMutation({
    mutationFn: async ({ leadId, enabled }: { leadId: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ ai_conversation_enabled: enabled })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar status da IA do lead:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Status da IA do lead atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status da IA do lead: ${error.message}`);
    },
  });
};

/**
 * Hook principal para buscar leads
 */
export const useLeads = (clinicaIdFilter?: string | null) => {
  const { clinicaId } = useClinicaData();
  
  const effectiveClinicaId = (() => {
    if (clinicaIdFilter !== undefined) {
      return clinicaIdFilter;
    } else {
      return clinicaId;
    }
  })();

  console.log('[useLeads] Filtro de clínica:', { clinicaIdFilter, clinicaId, effectiveClinicaId });

  return useQuery({
    queryKey: ['leads', effectiveClinicaId],
    queryFn: async () => {
      console.log('[useLeads] Buscando leads para clínica:', effectiveClinicaId || 'todas');
      
      let query = supabase
        .from('leads')
        .select(`
          *,
          etapas_kanban!inner(nome, ordem)
        `)
        .order('updated_at', { ascending: false });

      if (effectiveClinicaId !== null) {
        query = query.eq('clinica_id', effectiveClinicaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useLeads] Erro ao buscar leads:', error);
        throw error;
      }

      console.log(`[useLeads] ✅ ${data?.length || 0} leads encontrados`);
      return data || [];
    },
    enabled: effectiveClinicaId !== undefined,
    staleTime: 30000,
  });
};

/**
 * Hook para deletar lead
 */
export const useDeleteLead = () => {
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao deletar lead:', error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Lead deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar lead: ${error.message}`);
    },
  });
};

/**
 * Hook para mover lead para outra etapa
 */
export const useMoveLeadToStage = () => {
  return useMutation({
    mutationFn: async ({ leadId, etapaId }: { leadId: string; etapaId: string }) => {
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
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Lead movido com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao mover lead: ${error.message}`);
    },
  });
};

// Exportar tipos para compatibilidade
export type { Lead, CreateLeadData, UpdateLeadData };
