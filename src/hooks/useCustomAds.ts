
/**
 * Hook para gerenciar anúncios personalizados
 * 
 * O que faz:
 * - Buscar, criar, atualizar e deletar anúncios personalizados da clínica
 * - Gerenciar estados de loading e erro
 * - Integração com React Query para cache otimizado
 * 
 * Onde é usado:
 * - Componente CustomAdsSettings para configuração de anúncios
 * - Integração com n8n para contabilização de origens
 * 
 * Como se conecta:
 * - Usa políticas RLS para segurança por clínica
 * - Supabase para persistência dos dados
 * - Toast notifications para feedback ao usuário
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/useAuthUser';

// Interface para definir a estrutura de um anúncio personalizado
export interface CustomAd {
  id: string;
  clinica_id: string;
  ad_phrase: string;      // Frase personalizada do anúncio
  ad_source: string;      // Origem: whatsapp, direct, google, ou personalizada
  ad_name: string;        // Nome identificador do anúncio
  active: boolean;        // Se está ativo para detecção
  created_at: string;
  updated_at: string;
}

// Interface para criar/atualizar um anúncio
export interface CreateCustomAdData {
  ad_phrase: string;
  ad_source: string;
  ad_name: string;
  active?: boolean;
}

export const useCustomAds = (clinicaId?: string) => {
  const { userProfile } = useAuthUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ID da clínica: usar o parâmetro ou o da sessão do usuário
  const targetClinicaId = clinicaId || userProfile?.clinica_id;

  // ===============================
  // QUERY: Buscar anúncios personalizados
  // ===============================
  const { data: customAds = [], isLoading, error } = useQuery({
    queryKey: ['custom-ads', targetClinicaId],
    queryFn: async () => {
      if (!targetClinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      console.log('🔍 [useCustomAds] Buscando anúncios personalizados da clínica:', targetClinicaId);

      const { data, error } = await supabase
        .from('custom_ads')
        .select('*')
        .eq('clinica_id', targetClinicaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useCustomAds] Erro ao buscar anúncios:', error);
        throw new Error(error.message || 'Erro ao buscar anúncios personalizados');
      }

      console.log('✅ [useCustomAds] Anúncios carregados:', data.length);
      return data as CustomAd[];
    },
    enabled: !!targetClinicaId,
  });

  // ===============================
  // MUTATION: Criar novo anúncio
  // ===============================
  const createCustomAdMutation = useMutation({
    mutationFn: async (adData: CreateCustomAdData) => {
      if (!targetClinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      console.log('➕ [useCustomAds] Criando novo anúncio:', adData);

      const { data, error } = await supabase
        .from('custom_ads')
        .insert([{
          ...adData,
          clinica_id: targetClinicaId,
          active: adData.active ?? true
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [useCustomAds] Erro ao criar anúncio:', error);
        throw new Error(error.message || 'Erro ao criar anúncio personalizado');
      }

      console.log('✅ [useCustomAds] Anúncio criado com sucesso:', data);
      return data as CustomAd;
    },
    onSuccess: () => {
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['custom-ads', targetClinicaId] });
      
      toast({
        title: 'Sucesso',
        description: 'Anúncio personalizado criado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('❌ [useCustomAds] Erro na criação:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar anúncio personalizado.',
        variant: 'destructive',
      });
    },
  });

  // ===============================
  // MUTATION: Atualizar anúncio
  // ===============================
  const updateCustomAdMutation = useMutation({
    mutationFn: async ({ id, ...adData }: { id: string } & Partial<CreateCustomAdData>) => {
      console.log('✏️ [useCustomAds] Atualizando anúncio:', id, adData);

      const { data, error } = await supabase
        .from('custom_ads')
        .update(adData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useCustomAds] Erro ao atualizar anúncio:', error);
        throw new Error(error.message || 'Erro ao atualizar anúncio personalizado');
      }

      console.log('✅ [useCustomAds] Anúncio atualizado com sucesso:', data);
      return data as CustomAd;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-ads', targetClinicaId] });
      
      toast({
        title: 'Sucesso',
        description: 'Anúncio personalizado atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('❌ [useCustomAds] Erro na atualização:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar anúncio personalizado.',
        variant: 'destructive',
      });
    },
  });

  // ===============================
  // MUTATION: Deletar anúncio
  // ===============================
  const deleteCustomAdMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ [useCustomAds] Deletando anúncio:', id);

      const { error } = await supabase
        .from('custom_ads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [useCustomAds] Erro ao deletar anúncio:', error);
        throw new Error(error.message || 'Erro ao deletar anúncio personalizado');
      }

      console.log('✅ [useCustomAds] Anúncio deletado com sucesso');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-ads', targetClinicaId] });
      
      toast({
        title: 'Sucesso',
        description: 'Anúncio personalizado deletado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('❌ [useCustomAds] Erro na exclusão:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar anúncio personalizado.',
        variant: 'destructive',
      });
    },
  });

  // ===============================
  // MUTATION: Alternar status ativo/inativo
  // ===============================
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      console.log('🔄 [useCustomAds] Alternando status do anúncio:', id, 'para:', active);

      const { data, error } = await supabase
        .from('custom_ads')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useCustomAds] Erro ao alterar status:', error);
        throw new Error(error.message || 'Erro ao alterar status do anúncio');
      }

      console.log('✅ [useCustomAds] Status alterado com sucesso:', data);
      return data as CustomAd;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-ads', targetClinicaId] });
      
      toast({
        title: 'Sucesso',
        description: `Anúncio ${variables.active ? 'ativado' : 'desativado'} com sucesso!`,
      });
    },
    onError: (error: any) => {
      console.error('❌ [useCustomAds] Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status do anúncio.',
        variant: 'destructive',
      });
    },
  });

  // Funções wrapper para facilitar o uso
  const createCustomAd = async (adData: CreateCustomAdData) => {
    return createCustomAdMutation.mutateAsync(adData);
  };

  const updateCustomAd = async (id: string, adData: Partial<CreateCustomAdData>) => {
    return updateCustomAdMutation.mutateAsync({ id, ...adData });
  };

  const deleteCustomAd = async (id: string) => {
    return deleteCustomAdMutation.mutateAsync(id);
  };

  const toggleActiveStatus = async (id: string, active: boolean) => {
    return toggleActiveStatusMutation.mutateAsync({ id, active });
  };

  return {
    // Dados
    customAds,
    isLoading,
    error,
    
    // Funções
    createCustomAd,
    updateCustomAd,
    deleteCustomAd,
    toggleActiveStatus,
    
    // Estados de loading das operações
    isCreating: createCustomAdMutation.isPending,
    isUpdating: updateCustomAdMutation.isPending,
    isDeleting: deleteCustomAdMutation.isPending,
    isToggling: toggleActiveStatusMutation.isPending,
    
    // Mutations para acesso direto se necessário
    createCustomAdMutation,
    updateCustomAdMutation,
    deleteCustomAdMutation,
    toggleActiveStatusMutation,
  };
};
