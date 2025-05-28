
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar envio de webhooks
 * 
 * Funcionalidades:
 * - Enviar webhook após nova mensagem
 * - Incluir estado do botão de IA no payload
 * - Integração com Edge Function
 * - Tratamento de erros
 * - Logs detalhados para diagnóstico
 */
export const useWebhook = () => {
  // Função para enviar webhook via Edge Function com logs detalhados
  const enviarWebhook = async (
    mensagemId: string,
    leadId: string,
    clinicaId: string,
    conteudo: string,
    tipo: string,
    createdAt: string,
    aiEnabled: boolean = false
  ) => {
    try {
      // Logs detalhados dos parâmetros recebidos
      console.log('🔍 [useWebhook] Iniciando envio de webhook:');
      console.log('- mensagemId:', mensagemId, 'type:', typeof mensagemId);
      console.log('- leadId:', leadId, 'type:', typeof leadId);
      console.log('- clinicaId:', clinicaId, 'type:', typeof clinicaId);
      console.log('- conteudo:', conteudo?.substring(0, 50) + '...');
      console.log('- tipo:', tipo);
      console.log('- createdAt:', createdAt);
      console.log('- aiEnabled:', aiEnabled);

      // Validações críticas antes de chamar a Edge Function
      if (!clinicaId || clinicaId === 'undefined' || clinicaId === 'null') {
        console.error('❌ [useWebhook] ERRO: clinicaId inválido:', clinicaId);
        throw new Error('clinicaId inválido para webhook');
      }

      if (!mensagemId || !leadId) {
        console.error('❌ [useWebhook] ERRO: mensagemId ou leadId inválidos');
        console.error('- mensagemId:', mensagemId);
        console.error('- leadId:', leadId);
        throw new Error('Parâmetros obrigatórios inválidos para webhook');
      }

      // Payload que será enviado para a Edge Function
      const webhookPayload = {
        mensagem_id: mensagemId,
        lead_id: leadId,
        clinica_id: clinicaId,
        conteudo: conteudo,
        tipo: tipo,
        created_at: createdAt,
        evento_boolean: aiEnabled
      };

      console.log('📤 [useWebhook] Payload a ser enviado para Edge Function:');
      console.log(JSON.stringify(webhookPayload, null, 2));
      
      // Chamar a Edge Function
      console.log('🚀 [useWebhook] Invocando Edge Function send-webhook...');
      
      const { data, error } = await supabase.functions.invoke('send-webhook', {
        body: webhookPayload
      });

      if (error) {
        console.error('❌ [useWebhook] Erro ao invocar Edge Function:', error);
        console.error('- Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ [useWebhook] Webhook enviado com sucesso!');
      console.log('- Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ [useWebhook] Erro completo no envio do webhook:', error);
      console.error('- Error stack:', error.stack);
      // Não lançar erro para não impedir o envio da mensagem
      return null;
    }
  };

  return {
    enviarWebhook
  };
};
