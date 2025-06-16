
/**
 * Hook para gerenciar apelidos de anúncios
 * 
 * O que faz:
 * - Busca apelidos existentes para os anúncios da clínica
 * - Permite criar novos apelidos
 * - Permite atualizar apelidos existentes
 * - NOVO: Normaliza nomes de anúncios para melhor correspondência
 * 
 * Onde é usado:
 * - Componente AdPerformanceCard para edição inline de nomes
 * 
 * Como se conecta:
 * - Interage com a tabela 'ad_aliases' do Supabase
 * - Utiliza RLS para segurança por clínica
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';

export interface AdAlias {
  id: string;
  clinica_id: string;
  ad_name_original: string;
  ad_alias: string;
  created_at: string;
  updated_at: string;
}

export const useAdAliases = () => {
  const { clinicaId } = useClinica();
  const queryClient = useQueryClient();

  // Buscar todos os apelidos da clínica
  const { data: aliases = [], isLoading } = useQuery({
    queryKey: ['ad-aliases', clinicaId],
    queryFn: async () => {
      if (!clinicaId) return [];
      
      const { data, error } = await supabase
        .from('ad_aliases')
        .select('*')
        .eq('clinica_id', clinicaId);

      if (error) {
        console.error('Erro ao buscar apelidos de anúncios:', error);
        throw error;
      }

      return data as AdAlias[];
    },
    enabled: !!clinicaId,
  });

  // Função para normalizar nome do anúncio (igual à do dashboardUtils)
  const normalizarNomeAnuncio = (nome: string): string => {
    return nome.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  // Função para obter o apelido de um anúncio específico
  // MELHORADA: Busca por correspondência normalizada também
  const getAliasForAd = (adNameOriginal: string): string | null => {
    // Primeiro, busca exata
    let alias = aliases.find(a => a.ad_name_original === adNameOriginal);
    
    // Se não encontrou, busca por nome normalizado
    if (!alias) {
      const nomeNormalizado = normalizarNomeAnuncio(adNameOriginal);
      alias = aliases.find(a => normalizarNomeAnuncio(a.ad_name_original) === nomeNormalizado);
    }
    
    return alias?.ad_alias || null;
  };

  // Mutation para criar ou atualizar apelido
  const saveAliasMutation = useMutation({
    mutationFn: async ({ adNameOriginal, alias }: { adNameOriginal: string; alias: string }) => {
      if (!clinicaId) throw new Error('ID da clínica não encontrado');

      // Verificar se já existe um apelido para este anúncio (busca normalizada)
      const nomeNormalizado = normalizarNomeAnuncio(adNameOriginal);
      const existingAlias = aliases.find(a => 
        a.ad_name_original === adNameOriginal || 
        normalizarNomeAnuncio(a.ad_name_original) === nomeNormalizado
      );

      if (existingAlias) {
        // Atualizar apelido existente
        const { data, error } = await supabase
          .from('ad_aliases')
          .update({ 
            ad_alias: alias,
            ad_name_original: adNameOriginal // Atualizar também o nome original para a versão mais recente
          })
          .eq('id', existingAlias.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo apelido
        const { data, error } = await supabase
          .from('ad_aliases')
          .insert({
            clinica_id: clinicaId,
            ad_name_original: adNameOriginal,
            ad_alias: alias
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      // Recarregar a lista de apelidos
      queryClient.invalidateQueries({ queryKey: ['ad-aliases', clinicaId] });
      // Também invalidar dados do dashboard para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: ['dashboardData', clinicaId] });
    },
    onError: (error) => {
      console.error('Erro ao salvar apelido do anúncio:', error);
    }
  });

  // Mutation para deletar apelido
  const deleteAliasMutation = useMutation({
    mutationFn: async (adNameOriginal: string) => {
      const nomeNormalizado = normalizarNomeAnuncio(adNameOriginal);
      const existingAlias = aliases.find(a => 
        a.ad_name_original === adNameOriginal || 
        normalizarNomeAnuncio(a.ad_name_original) === nomeNormalizado
      );
      
      if (!existingAlias) throw new Error('Apelido não encontrado');

      const { error } = await supabase
        .from('ad_aliases')
        .delete()
        .eq('id', existingAlias.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-aliases', clinicaId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData', clinicaId] });
    },
    onError: (error) => {
      console.error('Erro ao deletar apelido do anúncio:', error);
    }
  });

  return {
    aliases,
    isLoading,
    getAliasForAd,
    saveAlias: saveAliasMutation.mutateAsync,
    deleteAlias: deleteAliasMutation.mutateAsync,
    isSaving: saveAliasMutation.isPending,
    isDeleting: deleteAliasMutation.isPending
  };
};
