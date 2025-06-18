
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import { toast } from 'sonner';
import type { CreateReportData } from '@/types/aiReports';

/**
 * Hook para criação de relatórios de IA
 * 
 * O que faz:
 * - Gerencia o processo de criação de novos relatórios
 * - Cria registro na tabela ai_reports
 * - Chama a Edge Function para processamento
 * - Gerencia estados de loading e erro
 * - Exibe toasts de feedback para o usuário
 * 
 * Onde é usado:
 * - No hook principal useAIReport
 * - Componentes que precisam criar relatórios
 */
export const useCreateAIReport = (refetchReports: () => void) => {
  const { clinicaId } = useClinica();

  // Mutation para criar um novo relatório
  const createReportMutation = useMutation({
    mutationFn: async (reportData: CreateReportData) => {
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      console.log('📊 Criando novo relatório:', reportData);

      // 1. Criar registro na tabela ai_reports
      const { data: reportRecord, error: createError } = await supabase
        .from('ai_reports')
        .insert({
          clinica_id: clinicaId,
          start_date: reportData.start_date.toISOString(),
          end_date: reportData.end_date.toISOString(),
          delivery_method: reportData.delivery_method,
          phone_number: reportData.phone_number,
          status: 'pending'
        })
        .select()
        .single();

      if (createError || !reportRecord) {
        console.error('Erro ao criar registro do relatório:', createError);
        throw createError;
      }

      console.log('✅ Registro do relatório criado:', reportRecord.id);

      // 2. Chamar a Edge Function para processar o relatório
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('generate-ai-report', {
        body: {
          clinica_id: clinicaId,
          start_date: reportData.start_date.toISOString(),
          end_date: reportData.end_date.toISOString(),
          delivery_method: reportData.delivery_method,
          phone_number: reportData.phone_number,
          report_request_id: reportRecord.id
        }
      });

      if (functionError) {
        console.error('Erro na Edge Function:', functionError);
        
        // Atualizar status para falha
        await supabase
          .from('ai_reports')
          .update({ 
            status: 'failed', 
            error_message: functionError.message 
          })
          .eq('id', reportRecord.id);
        
        throw functionError;
      }

      console.log('✅ Edge Function executada com sucesso:', functionResponse);
      return reportRecord;
    },
    onSuccess: (data) => {
      toast.success('Relatório solicitado com sucesso! Aguarde o processamento.');
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
