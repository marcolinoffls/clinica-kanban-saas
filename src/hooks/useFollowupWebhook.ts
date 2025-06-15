
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para Webhook de Follow-up
 * 
 * O que faz:
 * - Dispara webhooks específicos para follow-up
 * - Integra com a Edge Function send-followup-webhook
 * - Processa tanto follow-ups automáticos quanto manuais
 * - Mantém controle de execuções e status
 * 
 * Onde é usado:
 * - Botões de follow-up manual nos cards do Kanban/Pipeline
 * - Interface de follow-up no chat
 * - Processamento automático de campanhas
 * 
 * Como se conecta:
 * - Chama a Edge Function send-followup-webhook
 * - Atualiza status das execuções via useFollowupData
 * - Integra com sistema de webhooks existente
 */

interface SendFollowupWebhookParams {
  execution_id: string;
}

interface SendFollowupWebhookResponse {
  success: boolean;
  execution_id: string;
  status: 'enviado' | 'erro';
  message: string;
  error?: string;
}

export const useSendFollowupWebhook = () => {
  return useMutation({
    mutationFn: async ({ 
      execution_id 
    }: SendFollowupWebhookParams): Promise<SendFollowupWebhookResponse> => {
      console.log('🚀 Enviando webhook de follow-up para execução:', execution_id);

      // Chamar a Edge Function específica do follow-up
      const { data, error } = await supabase.functions.invoke('send-followup-webhook', {
        body: { execution_id },
      });

      if (error) {
        console.error('❌ Erro ao enviar webhook de follow-up:', error);
        throw new Error(`Erro no webhook: ${error.message}`);
      }

      console.log('✅ Resposta do webhook de follow-up:', data);
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        console.log('✅ Follow-up enviado com sucesso');
        toast.success('Follow-up enviado com sucesso!');
      } else {
        console.error('❌ Follow-up falhou:', data.error);
        toast.error(`Erro no follow-up: ${data.message}`);
      }
    },
    onError: (error: Error) => {
      console.error('❌ Erro no hook de webhook de follow-up:', error);
      toast.error(`Erro ao enviar follow-up: ${error.message}`);
    },
  });
};

// Hook para envio de follow-up manual
export const useSendManualFollowup = () => {
  return useMutation({
    mutationFn: async ({
      leadId,
      campaignId,
      templateId,
      userId,
    }: {
      leadId: string;
      campaignId: string;
      templateId: string;
      userId?: string;
    }): Promise<SendFollowupWebhookResponse> => {
      console.log('🔄 Criando execução manual de follow-up:', {
        leadId,
        campaignId,
        templateId,
      });

      // Primeiro, criar a execução manual
      const { data: execution, error: executionError } = await supabase
        .from('follow_up_execucoes')
        .insert({
          lead_id: leadId,
          campaign_id: campaignId,
          template_id: templateId,
          tipo_execucao: 'manual',
          status: 'pendente',
          data_agendada: new Date().toISOString(),
          user_id_manual: userId,
        })
        .select()
        .single();

      if (executionError || !execution) {
        console.error('❌ Erro ao criar execução manual:', executionError);
        throw new Error(`Erro ao criar execução: ${executionError?.message}`);
      }

      console.log('✅ Execução manual criada:', execution.id);

      // Agora, enviar o webhook
      const { data, error } = await supabase.functions.invoke('send-followup-webhook', {
        body: { execution_id: execution.id },
      });

      if (error) {
        // Se o webhook falhou, atualizar a execução com erro
        await supabase
          .from('follow_up_execucoes')
          .update({
            status: 'erro',
            erro_detalhes: `Erro no webhook: ${error.message}`,
          })
          .eq('id', execution.id);

        throw new Error(`Erro no webhook: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        console.log('✅ Follow-up manual enviado com sucesso');
        toast.success('Follow-up enviado com sucesso!');
      } else {
        console.error('❌ Follow-up manual falhou:', data.error);
        toast.error(`Erro no follow-up: ${data.message}`);
      }
    },
    onError: (error: Error) => {
      console.error('❌ Erro no follow-up manual:', error);
      toast.error(`Erro ao enviar follow-up: ${error.message}`);
    },
  });
};
