
/**
 * Hook para gerenciar dados de relatórios de IA
 * 
 * CORREÇÃO: Ajustado para trabalhar corretamente com o novo sistema de administração
 * e tipagem correta do useQuery
 * 
 * O que faz:
 * - Busca relatórios de IA da clínica
 * - Suporte a modo admin para buscar relatórios de clínicas específicas
 * - Filtragem e ordenação dos relatórios
 * 
 * Como se conecta:
 * - Supabase para buscar dados de ai_reports
 * - Aplica filtros por clínica automaticamente
 * - Retorna dados prontos para exibição
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';
import { useAdminCheck } from './useAdminCheck';
import { AIReport } from '@/types/aiReports';

interface UseAIReportsDataProps {
  adminMode?: boolean;
  targetClinicaId?: string;
}

export const useAIReportsData = ({ adminMode = false, targetClinicaId }: UseAIReportsDataProps = {}) => {
  const { clinicaId: userClinicaId, loading: clinicaLoading } = useClinicaData();
  const { isAdmin } = useAdminCheck();

  // Determinar qual clinica_id usar
  const clinicaId = adminMode && targetClinicaId ? targetClinicaId : userClinicaId;

  return useQuery<AIReport[]>({
    queryKey: ['ai-reports', clinicaId, adminMode],
    queryFn: async () => {
      if (!clinicaId) {
        console.warn('[useAIReportsData] Nenhuma clinica_id disponível');
        return [];
      }

      console.log('[useAIReportsData] Buscando relatórios para clinica_id:', clinicaId);
      
      let query = supabase
        .from('ai_reports')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('[useAIReportsData] Erro ao buscar relatórios:', error);
        throw error;
      }

      console.log(`[useAIReportsData] Encontrados ${data?.length || 0} relatórios`);
      return data || [];
    },
    enabled: !!clinicaId && !clinicaLoading,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
