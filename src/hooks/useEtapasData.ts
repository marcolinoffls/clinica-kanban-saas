
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar etapas do kanban
 * 
 * Este hook centraliza todas as operações relacionadas às etapas:
 * - Buscar etapas da clínica do usuário
 * - Criar novas etapas
 * - Atualizar etapas existentes
 * - Deletar etapas
 * - Reordenar etapas
 * 
 * Utiliza as políticas RLS para garantir isolamento por clínica
 */

export interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  clinica_id: string | null;
  created_at: string | null;
}

// Hook para buscar todas as etapas da clínica do usuário
export const useEtapas = () => {
  return useQuery({
    queryKey: ['etapas'],
    queryFn: async (): Promise<Etapa[]> => {
      console.log('🔍 Buscando etapas da clínica do usuário...');

      const { data, error } = await supabase
        .from('etapas_kanban')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar etapas:', error);
        throw new Error(`Erro ao buscar etapas: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} etapas encontradas`);
      return data || [];
    },
    staleTime: 60000, // Cache por 1 minuto (etapas mudam menos frequentemente)
  });
};

// Hook para criar nova etapa
export const useCreateEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaData: { nome: string; ordem: number }): Promise<Etapa> => {
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

// Hook para atualizar etapa existente
export const useUpdateEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Etapa> & { id: string }): Promise<Etapa> => {
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

// Hook para deletar etapa
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
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Etapa deletada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na exclusão da etapa:', error);
      toast.error(`Erro ao deletar etapa: ${error.message}`);
    },
  });
};
