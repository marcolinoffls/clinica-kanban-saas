
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar tags no Supabase
 * 
 * Funcionalidades:
 * - Buscar, criar, atualizar e excluir tags
 * - Validação de dados
 */

// ID da clínica de demonstração (em produção viria do contexto do usuário)
const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

export const useSupabaseTags = () => {
  const [tags, setTags] = useState<any[]>([]);

  // Função para salvar tag
  const salvarTag = async (tagData: { nome: string; cor: string }) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          nome: tagData.nome,
          cor: tagData.cor,
          clinica_id: DEMO_CLINIC_ID
        })
        .select()
        .single();

      if (error) throw error;

      setTags(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      throw error;
    }
  };

  // Função para atualizar tag
  const atualizarTag = async (tagId: string, tagData: { nome: string; cor: string }) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          nome: tagData.nome,
          cor: tagData.cor
        })
        .eq('id', tagId);

      if (error) throw error;

      setTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, ...tagData } : tag
      ));
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      throw error;
    }
  };

  // Função para excluir tag
  const excluirTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      setTags(prev => prev.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      throw error;
    }
  };

  // Função para buscar tags
  const buscarTags = async () => {
    try {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('clinica_id', DEMO_CLINIC_ID);

      if (tagsError) throw tagsError;
      setTags(tagsData || []);
      return tagsData || [];
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      return [];
    }
  };

  return {
    tags,
    setTags,
    salvarTag,
    atualizarTag,
    excluirTag,
    buscarTags
  };
};
