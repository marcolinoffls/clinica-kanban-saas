
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar dados do pipeline de qualquer clínica (modo admin)
 * 
 * O que faz:
 * - Permite que administradores busquem etapas e leads de qualquer clínica
 * - Retorna dados formatados para o componente PipelineBoard
 * 
 * Onde é usado:
 * - Página de pipeline em modo admin
 * 
 * Como se conecta:
 * - Busca dados diretamente do Supabase sem depender do contexto
 * - Aplica as mesmas regras de negócio do pipeline normal
 */

export const useAdminPipelineData = (clinicaId: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminPipelineData', clinicaId],
    queryFn: async () => {
      if (!clinicaId) {
        throw new Error('ID da clínica é obrigatório');
      }

      console.log('🏥 [useAdminPipelineData] Buscando dados do pipeline para clínica:', clinicaId);

      // Buscar etapas da clínica
      const { data: etapas, error: etapasError } = await supabase
        .from('etapas_kanban')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('ordem');

      if (etapasError) {
        console.error('❌ [useAdminPipelineData] Erro ao buscar etapas:', etapasError);
        throw etapasError;
      }

      // Buscar leads da clínica
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('❌ [useAdminPipelineData] Erro ao buscar leads:', leadsError);
        throw leadsError;
      }

      console.log(`✅ [useAdminPipelineData] Carregados ${etapas?.length || 0} etapas e ${leads?.length || 0} leads`);

      return {
        etapas: etapas || [],
        leads: leads || [],
        clinicaId
      };
    },
    enabled: !!clinicaId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 1
  });

  return {
    data,
    isLoading,
    error,
    refetch
  };
};
