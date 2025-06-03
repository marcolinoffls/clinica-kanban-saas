
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar dados de tags
 * 
 * Este hook centraliza todas as operações relacionadas às tags:
 * - Buscar tags da clínica do usuário
 * - Criar novas tags
 * - Atualizar tags existentes
 * - Deletar tags
 * 
 * Utiliza as políticas RLS para garantir isolamento por clínica
 */

export interface Tag {
  id: string;
  nome: string;
  cor: string;
  clinica_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Interface para criação de tag (campos obrigatórios)
export interface CreateTagData {
  nome: string;
  cor?: string;
  clinica_id: string;
}

// Hook para buscar todas as tags da clínica do usuário
export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      console.log('🔍 Buscando tags da clínica do usuário...');

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar tags:', error);
        throw new Error(`Erro ao buscar tags: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} tags encontradas`);
      return data || [];
    },
    staleTime: 30000, // Cache por 30 segundos
  });
};

// Hook para criar nova tag
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: CreateTagData): Promise<Tag> => {
      console.log('➕ Criando nova tag:', tagData.nome);

      const { data, error } = await supabase
        .from('tags')
        .insert([tagData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar tag:', error);
        throw new Error(`Erro ao criar tag: ${error.message}`);
      }

      console.log('✅ Tag criada com sucesso:', data.nome);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na criação da tag:', error);
      toast.error(`Erro ao criar tag: ${error.message}`);
    },
  });
};

// Hook para atualizar tag existente
export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Tag> & { id: string }): Promise<Tag> => {
      console.log('📝 Atualizando tag:', id);

      const { data, error } = await supabase
        .from('tags')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar tag:', error);
        throw new Error(`Erro ao atualizar tag: ${error.message}`);
      }

      console.log('✅ Tag atualizada com sucesso:', data.nome);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na atualização da tag:', error);
      toast.error(`Erro ao atualizar tag: ${error.message}`);
    },
  });
};

// Hook para deletar tag
export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string): Promise<void> => {
      console.log('🗑️ Deletando tag:', tagId);

      const { data, error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) {
        console.error('❌ Erro ao deletar tag:', error);
        throw new Error(`Erro ao deletar tag: ${error.message}`);
      }

      console.log('✅ Tag deletada com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deletada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na exclusão da tag:', error);
      toast.error(`Erro ao deletar tag: ${error.message}`);
    },
  });
};
export const useTagsData = useTags;