
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import type { AIReport } from '@/types/aiReports';

/**
 * Hook para buscar dados dos relatórios de IA
 * 
 * O que faz:
 * - Busca todos os relatórios de uma clínica específica
 * - Organiza os relatórios por status (pendente, completo, falha)
 * - Suporte a modo administrador com clinicaId específica
 * 
 * Onde é usado:
 * - No hook principal useAIReport
 * - Componentes que precisam listar relatórios
 */
export const useAIReportsData = (targetClinicaId?: string) => {
  const { clinicaId: contextClinicaId } = useClinica();
  
  // Usar clinicaId fornecida ou do contexto
  const effectiveClinicaId = targetClinicaId || contextClinicaId;

  const { data: reports = [], isLoading, error, refetch } = useQuery<AIReport[]>({
    queryKey: ['aiReports', effectiveClinicaId],
    queryFn: async () => {
      if (!effectiveClinicaId) {
        console.log('🔍 [useAIReportsData] Nenhuma clínica especificada');
        return [];
      }

      console.log('📊 [useAIReportsData] Buscando relatórios para clínica:', effectiveClinicaId);

      const { data, error } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('clinica_id', effectiveClinicaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useAIReportsData] Erro ao buscar relatórios:', error);
        throw error;
      }

      console.log(`✅ [useAIReportsData] Carregados ${data?.length || 0} relatórios`);
      return data || [];
    },
    enabled: !!effectiveClinicaId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    retry: 1
  });

  // Organizar relatórios por status
  const pendingReports = reports.filter(report => 
    report.status === 'pending' || report.status === 'processing'
  );
  
  const completedReports = reports.filter(report => 
    report.status === 'completed'
  );
  
  const failedReports = reports.filter(report => 
    report.status === 'failed' || report.status === 'cancelled'
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
