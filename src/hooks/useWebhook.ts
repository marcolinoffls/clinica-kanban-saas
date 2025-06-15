
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gerenciar envio de webhooks
 * 
 * O que faz:
 * - Roteia o envio de webhooks para a Edge Function correta (WhatsApp ou Instagram).
 * - Identifica a plataforma do lead (WhatsApp vs. Instagram) com base nos campos 'telefone' ou 'id_direct'.
 * - Monta e envia o payload com todos os dados necessários, incluindo anexos e estado da IA.
 * 
 * Como funciona:
 * 1. A função `enviarWebhook` recebe os dados da mensagem.
 * 2. Ela consulta a tabela 'leads' para verificar se o lead possui `id_direct` (Instagram) ou `telefone` (WhatsApp).
 * 3. Com base nessa verificação, define qual Edge Function (`send-instagram-webhook` ou `send-webhook`) deve ser chamada.
 * 4. Invoca a função correspondente com o payload da mensagem.
 * 5. Registra logs detalhados para facilitar a depuração.
 */
export const useWebhook = () => {
  /**
   * Envia um webhook para a plataforma correta (WhatsApp ou Instagram).
   * @param mensagemId - ID da mensagem no banco de dados.
   * @param leadId - ID do lead para quem a mensagem está sendo enviada.
   * @param clinicaId - ID da clínica que está enviando a mensagem.
   * @param conteudo - O texto da mensagem ou legenda do anexo.
   * @param tipo - O tipo de mensagem ('text', 'image', 'audio', etc.).
   * @param createdAt - Timestamp de criação da mensagem.
   * @param aiEnabled - Booleano que indica se a IA estava ativa no momento do envio.
   * @param anexo_url - URL do anexo (se houver), vinda do Supabase Storage (MinIO).
   */
  const enviarWebhook = async (
    mensagemId: string,
    leadId: string,
    clinicaId: string,
    conteudo: string,
    tipo: string,
    createdAt: string,
    aiEnabled: boolean = false,
    anexo_url?: string | null
  ) => {
    try {
      console.log('🚀 [useWebhook] INICIANDO PROCESSO DE WEBHOOK');
      console.log('📊 [useWebhook] Parâmetros recebidos:', {
        mensagemId,
        leadId,
        clinicaId,
        conteudo: conteudo?.substring(0, 50) + '...',
        tipo,
        createdAt,
        aiEnabled,
        anexo_url
      });

      // Validações críticas antes de qualquer outra coisa
      if (!clinicaId || clinicaId === 'undefined' || clinicaId === 'null') {
        console.error('❌ [useWebhook] ERRO CRÍTICO: clinicaId inválido:', clinicaId);
        throw new Error('clinicaId inválido para webhook');
      }
      if (!leadId) {
        console.error('❌ [useWebhook] ERRO CRÍTICO: leadId inválido:', leadId);
        throw new Error('leadId inválido para webhook');
      }
      if (!mensagemId) {
        console.error('❌ [useWebhook] ERRO CRÍTICO: mensagemId inválido:', mensagemId);
        throw new Error('mensagemId inválido para webhook');
      }

      console.log('✅ [useWebhook] Validações iniciais passaram');

      // Passo 1: Buscar o lead para determinar a plataforma de destino (Instagram ou WhatsApp)
      console.log(`🔍 [useWebhook] Buscando dados do lead: ${leadId}`);
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, id_direct, telefone, nome, meu_id_direct') // Campos que definem a plataforma
        .eq('id', leadId)
        .single();

      if (leadError) {
        console.error(`❌ [useWebhook] Erro ao buscar dados do lead ${leadId}:`, leadError);
        throw new Error('Erro ao buscar dados do lead para roteamento do webhook.');
      }
      if (!lead) {
        console.error(`❌ [useWebhook] Lead com ID ${leadId} não foi encontrado.`);
        throw new Error('Lead não encontrado.');
      }

      console.log('📋 [useWebhook] Dados do lead encontrados:', {
        id: lead.id,
        nome: lead.nome,
        tem_id_direct: !!lead.id_direct,
        tem_telefone: !!lead.telefone,
        id_direct_valor: lead.id_direct?.substring(0, 10) + '...',
        telefone_valor: lead.telefone,
        meu_id_direct: lead.meu_id_direct?.substring(0, 10) + '...'
      });

      // Passo 2: Definir qual Edge Function usar com base nos dados do lead
      let targetFunction = '';
      if (lead.id_direct) {
        // Se o lead tem 'id_direct', ele veio do Instagram.
        targetFunction = 'send-instagram-webhook';
        console.log(`📱 [useWebhook] ➡️ ROTEANDO PARA INSTAGRAM`);
        console.log(`📱 [useWebhook] Lead: ${leadId}, Função: ${targetFunction}`);
        console.log(`📱 [useWebhook] id_direct: ${lead.id_direct}`);
        console.log(`📱 [useWebhook] meu_id_direct: ${lead.meu_id_direct}`);
      } else if (lead.telefone) {
        // Se tem 'telefone' (e não 'id_direct'), é do WhatsApp.
        targetFunction = 'send-webhook';
        console.log(`📞 [useWebhook] ➡️ ROTEANDO PARA WHATSAPP`);
        console.log(`📞 [useWebhook] Lead: ${leadId}, Função: ${targetFunction}`);
        console.log(`📞 [useWebhook] telefone: ${lead.telefone}`);
      } else {
        // Se não tiver nenhum dos dois, não é possível contatar o lead.
        console.error(`❌ [useWebhook] Lead ${leadId} não tem 'id_direct' nem 'telefone'. Impossível enviar webhook.`);
        console.error(`❌ [useWebhook] Dados do lead:`, lead);
        return null; // Interrompe a execução para não causar erros.
      }
      
      // Monta o payload que será enviado para a Edge Function.
      // A estrutura é a mesma para ambas as funções.
      const webhookPayload = {
        mensagem_id: mensagemId,
        lead_id: leadId,
        clinica_id: clinicaId,
        conteudo: conteudo,
        tipo: tipo,
        created_at: createdAt,
        evento_boolean: aiEnabled,
        anexo_url: anexo_url
      };

      console.log(`📤 [useWebhook] Payload montado para '${targetFunction}':`);
      console.log(JSON.stringify(webhookPayload, null, 2));

      // Passo 3: Invocar a Edge Function correta
      console.log(`🚀 [useWebhook] INVOCANDO EDGE FUNCTION: '${targetFunction}'`);
      console.log(`🚀 [useWebhook] URL da função: https://wabnuxerjnecrjynyyfo.supabase.co/functions/v1/${targetFunction}`);
      
      const { data, error } = await supabase.functions.invoke(targetFunction, {
        body: webhookPayload
      });

      if (error) {
        console.error(`❌ [useWebhook] ERRO ao invocar Edge Function '${targetFunction}':`, error);
        console.error(`❌ [useWebhook] Detalhes do erro:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log(`✅ [useWebhook] WEBHOOK ENVIADO COM SUCESSO via '${targetFunction}'!`);
      console.log('📊 [useWebhook] Response data:', data);
      
      return data;

    } catch (error) {
      console.error('❌ [useWebhook] ERRO COMPLETO no processo de envio do webhook:');
      console.error('❌ [useWebhook] Error object:', error);
      console.error('❌ [useWebhook] Error message:', error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('❌ [useWebhook] Error stack:', error instanceof Error ? error.stack : 'Sem stack trace');
      
      // Retorna null para não quebrar a aplicação principal (ex: envio de mensagem na UI).
      // O erro já foi logado para depuração.
      return null;
    }
  };

  return {
    enviarWebhook
  };
};
