
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import type { AIReport } from '@/types/aiReports';

/**
 * Hook para buscar dados de relatórios de IA
 * 
 * O que faz:
 * - Busca todos os relatórios da clínica atual
 * - Ordena por data de criação (mais recentes primeiro)
 * - Categoriza os relatórios por status
 * - Fornece função de refetch para atualizar dados
 * 
 * Onde é usado:
 * - No hook principal useAIReport
 * - Qualquer componente que precise listar relatórios
 */
export const useAIReportsData = () => {
  const { clinicaId } = useClinica();

  // Query para buscar relatórios existentes da clínica
  const { data: reports = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ai-reports', clinicaId],
    queryFn: async () => {
      if (!clinicaId) return [];
      
      const { data, error } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar relatórios:', error);
        throw error;
      }

      return data as AIReport[];
    },
    enabled: !!clinicaId,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Categorizar relatórios por status
  const pendingReports = reports.filter(report => 
    report.status === 'pending' || report.status === 'processing'
  );

  const completedReports = reports.filter(report => 
    report.status === 'completed'
  );

  const failedReports = reports.filter(report => 
    report.status === 'failed'
  );

  return {
    reports,
    pendingReports,
    completedReports,
    failedReports,
    isLoading,
    error,
    refetch
  };
};
