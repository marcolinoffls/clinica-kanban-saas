
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClinicaData } from './useClinicaData';
import type { Etapa, CreateEtapaData, UpdateEtapaData } from '@/types';

/**
 * Hook para buscar etapas do kanban
 */
export const useEtapas = (clinicaIdFilter?: string | null) => {
  const { clinicaId } = useClinicaData();
  
  const effectiveClinicaId = (() => {
    if (clinicaIdFilter !== undefined) {
      return clinicaIdFilter;
    } else {
      return clinicaId;
    }
  })();

  console.log('[useEtapas] Filtro de clínica:', { clinicaIdFilter, clinicaId, effectiveClinicaId });

  return useQuery({
    queryKey: ['etapas', effectiveClinicaId],
    queryFn: async (): Promise<Etapa[]> => {
      console.log('[useEtapas] Buscando etapas para clínica:', effectiveClinicaId || 'todas');
      
      let query = supabase
        .from('etapas_kanban')
        .select('*')
        .order('ordem');

      if (effectiveClinicaId !== null) {
        query = query.eq('clinica_id', effectiveClinicaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useEtapas] Erro ao buscar etapas:', error);
        throw error;
      }

      console.log(`[useEtapas] ✅ ${data?.length || 0} etapas encontradas`);
      return data || [];
    },
    enabled: effectiveClinicaId !== undefined,
    staleTime: 60000,
  });
};

/**
 * Hook para criar nova etapa
 */
export const useCreateEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaData: CreateEtapaData): Promise<Etapa> => {
      console.log('➕ Criando nova etapa:', etapaData.nome);

      const { data, error } = await supabase
        .from('etapas_kanban')
        .insert([etapaData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar etapa:', error);
        throw new Error(`Erro ao criar etapa: ${error.message}`);
      }

      console.log('✅ Etapa criada com sucesso:', data.nome);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast.success('Etapa criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na criação da etapa:', error);
      toast.error(`Erro ao criar etapa: ${error.message}`);
    },
  });
};

/**
 * Hook para atualizar etapa existente
 */
export const useUpdateEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateEtapaData): Promise<Etapa> => {
      console.log('📝 Atualizando etapa:', id);

      const { data, error } = await supabase
        .from('etapas_kanban')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar etapa:', error);
        throw new Error(`Erro ao atualizar etapa: ${error.message}`);
      }

      console.log('✅ Etapa atualizada com sucesso:', data.nome);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast.success('Etapa atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na atualização da etapa:', error);
      toast.error(`Erro ao atualizar etapa: ${error.message}`);
    },
  });
};

/**
 * Hook para deletar etapa
 */
export const useDeleteEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaId: string): Promise<void> => {
      console.log('🗑️ Deletando etapa:', etapaId);

      const { error } = await supabase
        .from('etapas_kanban')
        .delete()
        .eq('id', etapaId);

      if (error) {
        console.error('❌ Erro ao deletar etapa:', error);
        throw new Error(`Erro ao deletar etapa: ${error.message}`);
      }

      console.log('✅ Etapa deletada com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast.success('Etapa deletada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na exclusão da etapa:', error);
      toast.error(`Erro ao deletar etapa: ${error.message}`);
    },
  });
};

// Exportar tipos para compatibilidade
export type { Etapa, CreateEtapaData, UpdateEtapaData };
