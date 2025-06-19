
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import { toast } from 'sonner';
import type { CancelReportPayload } from '@/types/aiReports';

/**
 * Hook para cancelamento de relatórios de IA
 * 
 * O que faz:
 * - Gerencia o processo de cancelamento de relatórios em andamento
 * - Chama a Edge Function reset-ai-report-status
 * - Atualiza o status do relatório para 'cancelled'
 * - Exibe toasts de feedback para o usuário
 * 
 * Onde é usado:
 * - No hook principal useAIReport
 * - Componentes que precisam cancelar relatórios em processamento
 */
export const useCancelAIReport = (refetchReports: () => void) => {
  const { clinicaId } = useClinica();

  // Mutation para cancelar um relatório
  const cancelReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      console.log('🚫 Cancelando relatório:', reportId);

      // Preparar payload para a Edge Function
      const payload: CancelReportPayload = {
        report_id: reportId,
        clinica_id: clinicaId
      };

      // Obter o token JWT do usuário atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar a Edge Function para cancelar o relatório
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('reset-ai-report-status', {
        body: payload,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (functionError) {
        console.error('Erro na Edge Function de cancelamento:', functionError);
        throw functionError;
      }

      console.log('✅ Relatório cancelado com sucesso:', functionResponse);
      return functionResponse;
    },
    onSuccess: () => {
      toast.success('Geração de relatório cancelada com sucesso.');
      refetchReports();
    },
    onError: (error) => {
      console.error('❌ Erro ao cancelar relatório:', error);
      toast.error('Erro ao cancelar relatório. Tente novamente.');
    }
  });

  return {
    cancelReport: cancelReportMutation.mutate,
    isCancelling: cancelReportMutation.isPending
  };
};
