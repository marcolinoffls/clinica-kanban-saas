
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar etapas do kanban no Supabase
 * 
 * Este hook gerencia todas as operações relacionadas às etapas do kanban:
 * - Buscar etapas da clínica do usuário autenticado
 * - Criar novas etapas
 * - Atualizar etapas existentes
 * - Deletar etapas
 * - Reordenar etapas
 * 
 * Com as políticas RLS implementadas, as etapas são automaticamente
 * filtradas pela clínica do usuário logado.
 */

export interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  clinica_id: string | null;
  created_at: string | null;
}

export interface CreateEtapaData {
  nome: string;
  ordem: number;
  clinica_id: string; // Obrigatório para associar à clínica correta
}

export interface UpdateEtapaData extends Partial<CreateEtapaData> {
  id: string;
}

// Hook para buscar todas as etapas da clínica do usuário
export const useEtapas = () => {
  return useQuery({
    queryKey: ['etapas'],
    queryFn: async (): Promise<Etapa[]> => {
      console.log('Buscando etapas da clínica do usuário...');

      const { data, error } = await supabase
        .from('etapas_kanban')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) {
        console.error('Erro ao buscar etapas:', error);
        throw new Error(`Erro ao buscar etapas: ${error.message}`);
      }

      console.log(`${data?.length || 0} etapas encontradas`);
      return data || [];
    },
    staleTime: 60000, // Cache por 1 minuto (etapas mudam menos frequentemente)
  });
};

// Hook para criar nova etapa
export const useCreateEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaData: CreateEtapaData): Promise<Etapa> => {
      console.log('Criando nova etapa:', etapaData);

      const { data, error } = await supabase
        .from('etapas_kanban')
        .insert([etapaData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar etapa:', error);
        throw new Error(`Erro ao criar etapa: ${error.message}`);
      }

      console.log('Etapa criada com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache das etapas para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast.success('Etapa criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na criação da etapa:', error);
      toast.error(`Erro ao criar etapa: ${error.message}`);
    },
  });
};

// Hook para atualizar etapa existente
export const useUpdateEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaData: UpdateEtapaData): Promise<Etapa> => {
      const { id, ...updateData } = etapaData;
      console.log('Atualizando etapa:', id, updateData);

      const { data, error } = await supabase
        .from('etapas_kanban')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar etapa:', error);
        throw new Error(`Erro ao atualizar etapa: ${error.message}`);
      }

      console.log('Etapa atualizada com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache das etapas para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast.success('Etapa atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na atualização da etapa:', error);
      toast.error(`Erro ao atualizar etapa: ${error.message}`);
    },
  });
};

// Hook para deletar etapa
export const useDeleteEtapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaId: string): Promise<void> => {
      console.log('Deletando etapa:', etapaId);

      const { error } = await supabase
        .from('etapas_kanban')
        .delete()
        .eq('id', etapaId);

      if (error) {
        console.error('Erro ao deletar etapa:', error);
        throw new Error(`Erro ao deletar etapa: ${error.message}`);
      }

      console.log('Etapa deletada com sucesso');
    },
    onSuccess: () => {
      // Invalidar cache das etapas para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      // Também invalidar leads pois podem ter sido afetados
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Etapa deletada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na exclusão da etapa:', error);
      toast.error(`Erro ao deletar etapa: ${error.message}`);
    },
  });
};

// Hook para reordenar etapas
export const useReorderEtapas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapas: { id: string; ordem: number }[]): Promise<void> => {
      console.log('Reordenando etapas:', etapas);

      // Atualizar cada etapa com sua nova ordem
      const updates = etapas.map(({ id, ordem }) =>
        supabase
          .from('etapas_kanban')
          .update({ ordem })
          .eq('id', id)
      );

      const results = await Promise.all(updates);

      // Verificar se alguma atualização falhou
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Erro ao reordenar etapas:', errors);
        throw new Error('Erro ao reordenar algumas etapas');
      }

      console.log('Etapas reordenadas com sucesso');
    },
    onSuccess: () => {
      // Invalidar cache das etapas para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast.success('Etapas reordenadas com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na reordenação das etapas:', error);
      toast.error(`Erro ao reordenar etapas: ${error.message}`);
    },
  });
};

// Hook para obter próxima ordem disponível
export const useNextEtapaOrder = () => {
  const { data: etapas } = useEtapas();

  // Calcular a próxima ordem baseada nas etapas existentes
  const nextOrder = etapas && etapas.length > 0 
    ? Math.max(...etapas.map(e => e.ordem)) + 1 
    : 1;

  return nextOrder;
};
