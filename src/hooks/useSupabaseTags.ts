
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar tags no Supabase
 * 
 * Este hook gerencia todas as operações relacionadas às tags:
 * - Buscar tags da clínica do usuário autenticado
 * - Criar novas tags
 * - Atualizar tags existentes
 * - Deletar tags
 * 
 * Com as políticas RLS implementadas, as tags são automaticamente
 * filtradas pela clínica do usuário logado.
 */

export interface Tag {
  id: string;
  nome: string;
  cor: string | null;
  clinica_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateTagData {
  nome: string;
  cor?: string;
  clinica_id: string; // Obrigatório para associar à clínica correta
}

export interface UpdateTagData extends Partial<CreateTagData> {
  id: string;
}

// Hook para buscar todas as tags da clínica do usuário
export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      console.log('Buscando tags da clínica do usuário...');

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tags:', error);
        throw new Error(`Erro ao buscar tags: ${error.message}`);
      }

      console.log(`${data?.length || 0} tags encontradas`);
      return data || [];
    },
    staleTime: 60000, // Cache por 1 minuto
  });
};

// Hook para criar nova tag
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: CreateTagData): Promise<Tag> => {
      console.log('Criando nova tag:', tagData);

      const { data, error } = await supabase
        .from('tags')
        .insert([{
          ...tagData,
          cor: tagData.cor || '#3B82F6', // Cor padrão azul se não especificada
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tag:', error);
        throw new Error(`Erro ao criar tag: ${error.message}`);
      }

      console.log('Tag criada com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache das tags para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na criação da tag:', error);
      toast.error(`Erro ao criar tag: ${error.message}`);
    },
  });
};

// Hook para atualizar tag existente
export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: UpdateTagData): Promise<Tag> => {
      const { id, ...updateData } = tagData;
      console.log('Atualizando tag:', id, updateData);

      // Adicionar timestamp de atualização
      const dataWithTimestamp = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tags')
        .update(dataWithTimestamp)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar tag:', error);
        throw new Error(`Erro ao atualizar tag: ${error.message}`);
      }

      console.log('Tag atualizada com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache das tags para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na atualização da tag:', error);
      toast.error(`Erro ao atualizar tag: ${error.message}`);
    },
  });
};

// Hook para deletar tag
export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string): Promise<void> => {
      console.log('Deletando tag:', tagId);

      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) {
        console.error('Erro ao deletar tag:', error);
        throw new Error(`Erro ao deletar tag: ${error.message}`);
      }

      console.log('Tag deletada com sucesso');
    },
    onSuccess: () => {
      // Invalidar cache das tags para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      // Também invalidar leads pois podem ter tags removidas
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Tag deletada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro na exclusão da tag:', error);
      toast.error(`Erro ao deletar tag: ${error.message}`);
    },
  });
};

// Hook para buscar tag por ID
export const useTag = (tagId: string | null) => {
  return useQuery({
    queryKey: ['tag', tagId],
    queryFn: async (): Promise<Tag | null> => {
      if (!tagId) return null;

      console.log('Buscando tag por ID:', tagId);

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', tagId)
        .single();

      if (error) {
        console.error('Erro ao buscar tag:', error);
        return null;
      }

      return data;
    },
    enabled: !!tagId,
    staleTime: 60000,
  });
};

// Hook para cores pré-definidas de tags
export const useTagColors = () => {
  const colors = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#06B6D4', // Ciano
    '#84CC16', // Lima
    '#F97316', // Laranja
    '#EC4899', // Rosa
    '#6B7280', // Cinza
  ];

  return colors;
};
