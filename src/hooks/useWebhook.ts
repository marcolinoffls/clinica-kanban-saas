
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar envio de webhooks
 * 
 * Funcionalidades:
 * - Enviar webhook após nova mensagem
 * - Integração com Edge Function
 * - Tratamento de erros
 */

export const useWebhook = () => {
  // Função para enviar webhook via Edge Function
  const enviarWebhook = async (
    mensagemId: string,
    leadId: string,
    clinicaId: string,
    conteudo: string,
    tipo: string,
    createdAt: string
  ) => {
    try {
      console.log('Enviando webhook para mensagem:', mensagemId);
      
      const { data, error } = await supabase.functions.invoke('send-webhook', {
        body: {
          mensagem_id: mensagemId,
          lead_id: leadId,
          clinica_id: clinicaId,
          conteudo: conteudo,
          tipo: tipo,
          created_at: createdAt
        }
      });

      if (error) {
        console.error('Erro ao invocar função webhook:', error);
        throw error;
      }

      console.log('Webhook enviado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro no envio do webhook:', error);
      // Não lançar erro para não impedir o envio da mensagem
      return null;
    }
  };

  return {
    enviarWebhook
  };
};
