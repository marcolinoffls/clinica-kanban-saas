
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthUser } from './useAuthUser';

/**
 * Hook para gerenciar dados de etapas do kanban
 * 
 * Este hook centraliza todas as operações relacionadas às etapas:
 * - Buscar etapas da clínica do usuário (TOTALMENTE protegido por RLS)
 * - Criar novas etapas (com clinica_id automático via RLS)
 * - Atualizar etapas existentes (protegido por RLS)
 * - Deletar etapas (protegido por RLS)
 * 
 * As políticas RLS garantem isolamento TOTAL por clínica:
 * - SELECT: só vê etapas da própria clínica
 * - INSERT: só pode criar etapas para sua clínica
 * - UPDATE/DELETE: só pode modificar etapas da própria clínica
 */

export interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  clinica_id: string | null;
  created_at: string | null;
}

// Interface para criação de etapa (clinica_id será preenchido automaticamente via RLS)
export interface CreateEtapaData {
  nome: string;
  ordem: number;
}

// Hook para buscar todas as etapas da clínica do usuário
export const useEtapas = () => {
  const { isAuthenticated } = useAuthUser();

  return useQuery({
    queryKey: ['etapas'],
    queryFn: async (): Promise<Etapa[]> => {
      console.log('🔍 Buscando etapas da clínica do usuário (isolado por RLS)...');

      // As políticas RLS garantem que APENAS etapas da clínica do usuário sejam retornadas
      // Não precisamos de filtro .eq('clinica_id', xxx) pois a RLS já faz isso automaticamente
      const { data, error } = await supabase
        .from('etapas_kanban')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar etapas:', error);
        
        // Se o erro for relacionado à política RLS, dar uma mensagem mais clara
        if (error.code === '42501' || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para acessar estas etapas. Verifique se está logado corretamente.');
        }
        
        throw new Error(`Erro ao buscar etapas: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} etapas encontradas para a clínica do usuário`);
      return data || [];
    },
    enabled: isAuthenticated, // Só busca se o usuário estiver autenticado
    staleTime: 30000, // Cache por 30 segundos
    retry: (failureCount, error: any) => {
      // Não retenta se for erro de permissão/RLS
      if (error?.message?.includes('policy') || error?.code === '42501') {
        return false;
      }
      return failureCount < 2;
    },
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
        throw new Error('Usuário não está associado a uma clínica válida');
      }

      // Incluir clinica_id explicitamente para garantir que a RLS funcione corretamente
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
        
        // Mensagem específica para erros de RLS
        if (error.code === '42501' || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para criar etapas. Verifique se está logado corretamente.');
        }
        
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
      toast.error(error.message || 'Erro ao criar etapa');
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
      // Removemos clinica_id do updateData para evitar tentativas de alterar a clínica
      const { clinica_id, ...safeUpdateData } = updateData;

      const { data, error } = await supabase
        .from('etapas_kanban')
        .update(safeUpdateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar etapa:', error);
        
        // Mensagem específica para erros de RLS
        if (error.code === '42501' || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para atualizar esta etapa.');
        }
        
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
      toast.error(error.message || 'Erro ao atualizar etapa');
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
        
        // Mensagem específica para erros de RLS
        if (error.code === '42501' || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para deletar esta etapa.');
        }
        
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
      toast.error(error.message || 'Erro ao deletar etapa');
    },
  });
};
