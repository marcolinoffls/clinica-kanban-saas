
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import { toast } from 'sonner';
import type { CreateReportData, ReportRequestPayload } from '@/types/aiReports';

/**
 * Hook para criação de relatórios de IA
 * 
 * O que faz:
 * - Gerencia o processo de criação de novos relatórios
 * - Cria registro na tabela ai_reports
 * - Chama a Edge Function otimizada que envia payload mínimo para o n8n
 * - Gerencia estados de loading e erro
 * - Exibe toasts de feedback para o usuário
 * - Suporte a modo administrador com clinicaId específica
 * 
 * Onde é usado:
 * - No hook principal useAIReport
 * - Componentes que precisam criar relatórios
 */
export const useCreateAIReport = (refetchReports: () => void, targetClinicaId?: string) => {
  const { clinicaId: contextClinicaId } = useClinica();

  // Mutation para criar um novo relatório
  const createReportMutation = useMutation({
    mutationFn: async (reportData: CreateReportData) => {
      // Usar clinicaId fornecida (admin) ou do contexto (usuário normal)
      const effectiveClinicaId = targetClinicaId || contextClinicaId;
      
      if (!effectiveClinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      console.log('📊 Criando novo relatório para clínica:', effectiveClinicaId, reportData);

      // 1. Criar registro na tabela ai_reports
      const { data: reportRecord, error: createError } = await supabase
        .from('ai_reports')
        .insert({
          clinica_id: effectiveClinicaId,
          start_date: reportData.period_start.toISOString(),
          end_date: reportData.period_end.toISOString(),
          delivery_method: reportData.delivery_method,
          phone_number: reportData.recipient_phone_number,
          status: 'pending'
        })
        .select()
        .single();

      if (createError || !reportRecord) {
        console.error('Erro ao criar registro do relatório:', createError);
        throw createError;
      }

      console.log('✅ Registro do relatório criado:', reportRecord.id);

      // 2. Preparar payload mínimo para a Edge Function
      const payload: ReportRequestPayload = {
        clinica_id: effectiveClinicaId,
        start_date: reportData.period_start.toISOString(),
        end_date: reportData.period_end.toISOString(),
        delivery_method: reportData.delivery_method,
        recipient_phone_number: reportData.recipient_phone_number,
        report_request_id: reportRecord.id
      };

      // 3. Chamar a Edge Function otimizada
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('generate-ai-report', {
        body: payload
      });

      if (functionError) {
        console.error('Erro na Edge Function:', functionError);
        
        // Atualizar status para falha
        await supabase
          .from('ai_reports')
          .update({ 
            status: 'failed',
            error_message: functionError.message || 'Erro na Edge Function'
          })
          .eq('id', reportRecord.id);
        
        throw functionError;
      }

      console.log('✅ Edge Function executada com sucesso:', functionResponse);
      return reportRecord;
    },
    onSuccess: (data) => {
      toast.success('Relatório solicitado com sucesso! O processamento foi iniciado no n8n.');
      refetchReports();
    },
    onError: (error) => {
      console.error('❌ Erro ao criar relatório:', error);
      toast.error('Erro ao solicitar relatório. Tente novamente.');
    }
  });

  return {
    createReport: createReportMutation.mutate,
    isCreating: createReportMutation.isPending
  };
};
