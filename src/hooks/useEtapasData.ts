
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthUser } from './useAuthUser';

/**
 * Hook para gerenciar dados de etapas do kanban
 * 
 * Este hook centraliza todas as operações relacionadas às etapas:
 * - Buscar etapas da clínica do usuário (protegido por RLS)
 * - Criar novas etapas (com clinica_id automático)
 * - Atualizar etapas existentes
 * - Deletar etapas
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

// Interface para criação de etapa (clinica_id será preenchido automaticamente)
export interface CreateEtapaData {
  nome: string;
  ordem: number;
}

// Hook para buscar todas as etapas da clínica do usuário
export const useEtapas = () => {
  return useQuery({
    queryKey: ['etapas'],
    queryFn: async (): Promise<Etapa[]> => {
      console.log('🔍 Buscando etapas da clínica do usuário (protegido por RLS)...');

      // As políticas RLS garantem que apenas etapas da clínica do usuário sejam retornadas
      const { data, error } = await supabase
        .from('etapas_kanban')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar etapas:', error);
        throw new Error(`Erro ao buscar etapas: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} etapas encontradas para a clínica do usuário`);
      return data || [];
    },
    staleTime: 30000, // Cache por 30 segundos
  });
};

// Hook para criar nova etapa
export const useCreateEtapa = () => {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthUser();

  return useMutation({
    mutationFn: async (etapaData: CreateEtapaData): Promise<Etapa> => {
      console.log('➕ Criando nova etapa:', etapaData.nome);

      if (!userProfile?.clinica_id) {
        throw new Error('Usuário não está associado a uma clínica');
      }

      // Incluir clinica_id do usuário automaticamente
      const dataComClinica = {
        ...etapaData,
        clinica_id: userProfile.clinica_id,
      };

      const { data, error } = await supabase
        .from('etapas_kanban')
        .insert([dataComClinica])
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

      // As políticas RLS garantem que apenas etapas da própria clínica podem ser atualizadas
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

      // As políticas RLS garantem que apenas etapas da própria clínica podem ser deletadas
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
