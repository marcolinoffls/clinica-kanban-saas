
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Hook para gerenciar os anúncios personalizados
 * 
 * Este hook centraliza toda a lógica de comunicação com a tabela `custom_ads`.
 * Ele é usado pelo componente CustomAdsSettings para permitir que administradores
 * configurem regras para identificar automaticamente a origem de leads baseado
 * em frases específicas em mensagens.
 * 
 * Funcionalidades:
 * - Buscar todas as regras de anúncios de uma clínica
 * - Criar nova regra de anúncio
 * - Atualizar regra existente (incluindo status ativo/inativo)
 * - Excluir regra de anúncio
 * 
 * Utiliza React Query para cache e sincronização de dados do servidor.
 */

// Tipos para tipagem dos dados
export interface CustomAd {
  id: string;
  clinica_id: string;
  ad_name: string;
  ad_phrase: string;
  ad_source: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomAdData {
  clinica_id: string;
  ad_name: string;
  ad_phrase: string;
  ad_source: string;
  active?: boolean;
}

export interface UpdateCustomAdData {
  ad_name?: string;
  ad_phrase?: string;
  ad_source?: string;
  active?: boolean;
}

export const useCustomAds = (clinicaId: string) => {
  const queryClient = useQueryClient();

  // Query para buscar todas as regras de anúncios de uma clínica
  const customAdsQuery = useQuery({
    queryKey: ['custom-ads', clinicaId],
    queryFn: async () => {
      console.log(`🔍 [useCustomAds] Buscando anúncios personalizados da clínica: ${clinicaId}`);
      
      const { data, error } = await supabase
        .from('custom_ads')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useCustomAds] Erro ao buscar anúncios:', error);
        throw error;
      }

      console.log(`✅ [useCustomAds] Encontrados ${data?.length || 0} anúncios personalizados`);
      return data as CustomAd[];
    },
    enabled: !!clinicaId, // Só executa se clinicaId existir
  });

  // Mutation para criar novo anúncio personalizado
  const createCustomAdMutation = useMutation({
    mutationFn: async (data: CreateCustomAdData) => {
      console.log('🆕 [useCustomAds] Criando novo anúncio personalizado:', data);
      
      const { data: result, error } = await supabase
        .from('custom_ads')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ [useCustomAds] Erro ao criar anúncio:', error);
        throw error;
      }

      console.log('✅ [useCustomAds] Anúncio personalizado criado com sucesso');
      return result as CustomAd;
    },
    onSuccess: () => {
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['custom-ads', clinicaId] });
      
      toast({
        title: "Sucesso",
        description: "Anúncio personalizado criado com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('❌ [useCustomAds] Erro na criação:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar anúncio personalizado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar anúncio existente
  const updateCustomAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomAdData }) => {
      console.log(`🔧 [useCustomAds] Atualizando anúncio ${id}:`, data);
      
      const { data: result, error } = await supabase
        .from('custom_ads')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useCustomAds] Erro ao atualizar anúncio:', error);
        throw error;
      }

      console.log('✅ [useCustomAds] Anúncio personalizado atualizado com sucesso');
      return result as CustomAd;
    },
    onSuccess: () => {
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['custom-ads', clinicaId] });
      
      toast({
        title: "Sucesso",
        description: "Anúncio personalizado atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('❌ [useCustomAds] Erro na atualização:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar anúncio personalizado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir anúncio
  const deleteCustomAdMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`🗑️ [useCustomAds] Excluindo anúncio ${id}`);
      
      const { error } = await supabase
        .from('custom_ads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [useCustomAds] Erro ao excluir anúncio:', error);
        throw error;
      }

      console.log('✅ [useCustomAds] Anúncio personalizado excluído com sucesso');
      return id;
    },
    onSuccess: () => {
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['custom-ads', clinicaId] });
      
      toast({
        title: "Sucesso",
        description: "Anúncio personalizado excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('❌ [useCustomAds] Erro na exclusão:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir anúncio personalizado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    // Dados e estados das queries
    customAds: customAdsQuery.data || [],
    isLoading: customAdsQuery.isLoading,
    error: customAdsQuery.error,

    // Mutations
    createCustomAd: createCustomAdMutation.mutate,
    updateCustomAd: updateCustomAdMutation.mutate,
    deleteCustomAd: deleteCustomAdMutation.mutate,

    // Estados das mutations
    isCreating: createCustomAdMutation.isPending,
    isUpdating: updateCustomAdMutation.isPending,
    isDeleting: deleteCustomAdMutation.isPending,
  };
};
