
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
 * - Diferencia no payload se foi solicitado por admin ou usuário da clínica
 * 
 * Onde é usado:
 * - No hook principal useAIReport
 * - Componentes que precisam criar relatórios
 */
export const useCreateAIReport = (refetchReports: () => void, targetClinicaId?: string, isAdminMode?: boolean) => {
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
      console.log('🔐 Modo admin:', isAdminMode || false);

      // 1. Obter dados do usuário atual para identificar quem está solicitando
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // 2. Criar registro na tabela ai_reports
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

      // 3. Preparar payload mínimo para a Edge Function com identificação de quem solicitou
      const payload: ReportRequestPayload = {
        clinica_id: effectiveClinicaId,
        start_date: reportData.period_start.toISOString(),
        end_date: reportData.period_end.toISOString(),
        delivery_method: reportData.delivery_method,
        recipient_phone_number: reportData.recipient_phone_number,
        report_request_id: reportRecord.id,
        // Novos campos para identificar quem solicitou
        requested_by_admin: isAdminMode || false,
        requester_user_id: user.id,
        // Se foi solicitado por admin, incluir ID da clínica do contexto (clínica do admin)
        admin_clinic_context: isAdminMode ? contextClinicaId : null
      };

      console.log('📤 Payload com informações do solicitante:', {
        requested_by_admin: payload.requested_by_admin,
        requester_user_id: payload.requester_user_id,
        admin_clinic_context: payload.admin_clinic_context
      });

      // 4. Chamar a Edge Function otimizada
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
      const successMessage = isAdminMode 
        ? 'Relatório solicitado com sucesso para a clínica selecionada! O processamento foi iniciado no n8n.'
        : 'Relatório solicitado com sucesso! O processamento foi iniciado no n8n.';
      
      toast.success(successMessage);
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
