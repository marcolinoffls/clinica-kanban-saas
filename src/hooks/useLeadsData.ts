import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types';
import { toast } from 'sonner';
import { useClinicaData } from './useClinicaData';

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
        .update({ ai_enabled: enabled })
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
 * MODIFICADO: Hook principal para buscar leads
 * 
 * Agora aceita um parâmetro opcional clinicaIdFilter para filtrar leads por clínica:
 * - Se clinicaIdFilter for fornecido: busca leads apenas dessa clínica
 * - Se clinicaIdFilter for null: busca leads de todas as clínicas (modo Admin)
 * - Se clinicaIdFilter for undefined: usa o comportamento padrão (clinica do usuário)
 */
export const useLeads = (clinicaIdFilter?: string | null) => {
  const { clinicaId } = useClinicaData();
  
  // Determinar qual clinica_id usar para a query
  const effectiveClinicaId = (() => {
    if (clinicaIdFilter !== undefined) {
      // Se foi passado um filtro explícito
      return clinicaIdFilter; // null para "todas", string para clínica específica
    } else {
      // Comportamento padrão: usar clínica do usuário
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

      // Aplicar filtro de clínica se especificado
      if (effectiveClinicaId !== null) {
        query = query.eq('clinica_id', effectiveClinicaId);
      }
      // Se effectiveClinicaId for null, não aplica filtro (busca todas as clínicas)

      const { data, error } = await query;

      if (error) {
        console.error('[useLeads] Erro ao buscar leads:', error);
        throw error;
      }

      console.log(`[useLeads] ✅ ${data?.length || 0} leads encontrados`);
      return data || [];
    },
    enabled: effectiveClinicaId !== undefined, // Só executa se tiver clinica definida ou null explícito
    staleTime: 30000, // 30 segundos
  });
};
