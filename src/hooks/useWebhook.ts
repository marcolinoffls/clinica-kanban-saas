
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar envio de webhooks
 * 
 * Funcionalidades:
 * - Enviar webhook após nova mensagem
 * - Incluir estado do botão de IA no payload
 * - Integração com Edge Function
 * - Tratamento de erros
 */

export const useWebhook = () => {
  // Função para enviar webhook via Edge Function
  // Agora inclui o parâmetro aiEnabled para o estado da IA
  const enviarWebhook = async (
    mensagemId: string,
    leadId: string,
    clinicaId: string,
    conteudo: string,
    tipo: string,
    createdAt: string,
    aiEnabled: boolean = false // Novo parâmetro para estado da IA
  ) => {
    try {
      console.log('Enviando webhook para mensagem:', mensagemId);
      console.log('Estado da IA:', aiEnabled ? 'ativado' : 'desativado');
      
      const { data, error } = await supabase.functions.invoke('send-webhook', {
        body: {
          mensagem_id: mensagemId,
          lead_id: leadId,
          clinica_id: clinicaId,
          conteudo: conteudo,
          tipo: tipo,
          created_at: createdAt,
          evento_boolean: aiEnabled // Adicionar estado da IA ao payload
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
