
/**
 * Edge Function para envio de webhooks do Instagram Direct
 * 
 * O que faz:
 * - Esta função é acionada para enviar uma mensagem do CRM para o Instagram Direct, via n8n.
 * - Ela é uma variação da 'send-webhook' (para WhatsApp), mas adaptada para o Instagram.
 *
 * Como funciona:
 * 1.  Recebe um payload com os detalhes da mensagem (mensagem_id, lead_id, clinica_id, etc.).
 * 2.  Busca os dados da clínica, incluindo as novas configurações de webhook do Instagram:
 *     - `instagram_webhook_type`: 'padrao' ou 'personalizado'.
 *     - `instagram_webhook_url`: A URL, se o tipo for 'padrao'.
 *     - `instagram_user_handle`: O nome de usuário, se o tipo for 'personalizado'.
 * 3.  Busca os dados do lead, incluindo `id_direct` (destinatário) e `meu_id_direct` (remetente).
 * 4.  Constrói a URL do webhook de destino com base no tipo selecionado.
 * 5.  Monta um payload específico para o Instagram, incluindo `meu_id_direct` nos metadados.
 * 6.  Envia o payload para o n8n de forma segura, usando um token JWT.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as djwt from "https://deno.land/x/djwt@v2.7/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookMessageContent {
  conversation?: string;
  image?: { url: string; caption?: string; mimetype?: string };
  audio?: { url:string; ptt?: boolean; mimetype?: string };
}

interface WebhookPayload {
  event: string;
  platform: string; 
  instance: string; 
  data: {
    key: {
      remoteJid: string; // ID do usuário do Instagram (destinatário)
      fromMe: boolean;
      id: string;
    };
    pushName: string | null;
    message: WebhookMessageContent;
    messageType: string;
    messageTimestamp: number;
  };
  origin: {
    clinica_id: string;
    lead_id: string;
    ai_enabled: boolean;
    meu_id_direct: string | null; // ID da conta do Instagram que está enviando (remetente)
  };
  timestamp_sp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 [send-instagram-webhook] Requisição recebida');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const requestBody = await req.json();
    console.log('📋 [send-instagram-webhook] Payload recebido:', JSON.stringify(requestBody, null, 2));

    const { 
      mensagem_id, 
      lead_id, 
      clinica_id, 
      conteudo,
      tipo,
      created_at,
      evento_boolean = false,
      anexo_url
    } = requestBody

    if (!clinica_id) {
      return new Response(JSON.stringify({ error: 'clinica_id é obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Busca os dados da clínica, incluindo as novas colunas do Instagram
    const { data: clinica, error: clinicaError } = await supabaseClient
      .from('clinicas')
      .select('id, evolution_instance_name, instagram_user_handle, instagram_webhook_type, instagram_webhook_url')
      .eq('id', clinica_id)
      .single();

    if (clinicaError || !clinica) {
      console.error('❌ [send-instagram-webhook] Clínica não encontrada ou erro:', clinicaError?.message);
      return new Response(JSON.stringify({ error: 'Clínica não encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('✅ [send-instagram-webhook] Dados da clínica carregados:', clinica);

    // LÓGICA PARA DETERMINAR A URL DO WEBHOOK
    let webhookUrl = '';
    if (clinica.instagram_webhook_type === 'padrao' && clinica.instagram_webhook_url) {
      webhookUrl = clinica.instagram_webhook_url;
      console.log(`[send-instagram-webhook] Usando webhook padrão: ${webhookUrl}`);
    } else if (clinica.instagram_webhook_type === 'personalizado' && clinica.instagram_user_handle) {
      // CORREÇÃO: Corrigido o erro de digitação no domínio de 'fernades' para 'fernandes'.
      webhookUrl = `https://webhooks.marcolinofernandes.site/webhook-instagram/${clinica.instagram_user_handle}`;
      console.log(`[send-instagram-webhook] Usando webhook personalizado com URL corrigida: ${webhookUrl}`);
    }

    if (!webhookUrl) {
      console.error('❌ [send-instagram-webhook] URL do webhook do Instagram não pôde ser determinada.');
      return new Response(JSON.stringify({ error: 'Configuração do webhook do Instagram incompleta para esta clínica' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Busca dados do lead (incluindo o id_direct e meu_id_direct para o Instagram)
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('nome, id_direct, meu_id_direct') // Adicionado 'meu_id_direct'
      .eq('id', lead_id)
      .single();

    const dataUTC = new Date(created_at);
    const timestampSP = dataUTC.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });

    let messagePayload: WebhookMessageContent;
    if ((tipo === 'image' || tipo === 'photo') && anexo_url) {
        messagePayload = { image: { url: anexo_url, caption: conteudo } };
    } else if (tipo === 'audio' && anexo_url) {
        messagePayload = { audio: { url: anexo_url, ptt: true } };
    } else {
        messagePayload = { conversation: conteudo };
    }
    
    // CORREÇÃO: Lógica aprimorada para mapear o tipo da mensagem do nosso banco de dados
    // para o formato esperado pelo webhook (ex: 'texto' -> 'conversation').
    let messageTypeForWebhook: string;
    switch (tipo) {
      case 'texto':
      case 'text':
        messageTypeForWebhook = 'conversation';
        break;
      case 'image':
      case 'photo':
        messageTypeForWebhook = 'imageMessage';
        break;
      case 'audio':
        messageTypeForWebhook = 'audioMessage';
        break;
      default:
        // Se o tipo não for reconhecido, assume que é texto como um fallback seguro.
        messageTypeForWebhook = 'conversation';
        break;
    }

    const webhookPayload: WebhookPayload = {
      event: "instagram.send.message",
      platform: "instagram",
      instance: clinica.evolution_instance_name || clinica.id, // Fallback para clinica.id
      data: {
        key: {
          remoteJid: lead?.id_direct || '', // ID de usuário do Instagram (destinatário)
          fromMe: true,
          id: mensagem_id
        },
        pushName: lead?.nome || null,
        message: messagePayload,
        messageType: messageTypeForWebhook, // AQUI: Usando o tipo de mensagem corrigido
        messageTimestamp: Math.floor(dataUTC.getTime() / 1000)
      },
      origin: {
        clinica_id: clinica_id,
        lead_id: lead_id,
        ai_enabled: evento_boolean,
        meu_id_direct: lead?.meu_id_direct || null, // Campo adicionado aqui
      },
      timestamp_sp: timestampSP
    };

    console.log('📤 [send-instagram-webhook] Payload final para n8n:', JSON.stringify(webhookPayload, null, 2));

    // CRIAÇÃO DO JWT COM LOGS DETALHADOS
    console.log('🔐 [send-instagram-webhook] Iniciando criação do token JWT...');
    const secretKey = Deno.env.get('EVOLUTION_API_KEY') || 'default-secret';
    console.log('🔐 [send-instagram-webhook] Secret key definida:', secretKey.substring(0, 10) + '...');
    
    const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secretKey), { name: "HMAC", hash: "SHA-256" }, true, ["sign", "verify"]);
    console.log('🔐 [send-instagram-webhook] Crypto key importada com sucesso');
    
    const jwt = await djwt.create({ alg: "HS256", typ: "JWT" }, { clinica_id, exp: djwt.getNumericDate(60 * 60) }, cryptoKey);
    console.log('🔐 [send-instagram-webhook] JWT criado com sucesso:', jwt.substring(0, 50) + '...');

    // ENVIO DO WEBHOOK COM LOGS DETALHADOS E TIMEOUT
    console.log('🚀 [send-instagram-webhook] Iniciando envio do webhook...');
    console.log('🚀 [send-instagram-webhook] URL de destino:', webhookUrl);
    console.log('🚀 [send-instagram-webhook] Headers que serão enviados:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt.substring(0, 20)}...`
    });

    // Criando um AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${jwt}`,
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 [send-instagram-webhook] Resposta recebida do webhook:');
      console.log('📡 [send-instagram-webhook] Status:', webhookResponse.status);
      console.log('📡 [send-instagram-webhook] StatusText:', webhookResponse.statusText);
      console.log('📡 [send-instagram-webhook] Headers:', Object.fromEntries(webhookResponse.headers.entries()));

      const responseText = await webhookResponse.text();
      console.log('📡 [send-instagram-webhook] Conteúdo da resposta:', responseText);

      if (webhookResponse.ok) {
        console.log('✅ [send-instagram-webhook] Webhook enviado com sucesso:', responseText);
        return new Response(JSON.stringify({ success: true, response: responseText }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } else {
        console.error('❌ [send-instagram-webhook] Erro no webhook - Status:', webhookResponse.status);
        console.error('❌ [send-instagram-webhook] Erro no webhook - Response:', responseText);
        return new Response(JSON.stringify({ 
          error: 'Falha ao enviar webhook', 
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          details: responseText 
        }), { 
          status: webhookResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ [send-instagram-webhook] Erro durante o fetch:', fetchError);
      console.error('❌ [send-instagram-webhook] Tipo do erro:', fetchError.constructor.name);
      console.error('❌ [send-instagram-webhook] Mensagem do erro:', fetchError.message);
      
      // Verificar se é erro de timeout
      if (fetchError.name === 'AbortError') {
        console.error('❌ [send-instagram-webhook] Erro de timeout - O servidor webhook não respondeu em 30 segundos');
        return new Response(JSON.stringify({ 
          error: 'Timeout na requisição do webhook', 
          message: 'O servidor webhook não respondeu em 30 segundos',
          webhookUrl: webhookUrl
        }), { 
          status: 408, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Verificar se é erro de DNS/conectividade
      if (fetchError.message.includes('error sending request')) {
        console.error('❌ [send-instagram-webhook] Erro de conectividade - Não foi possível conectar ao webhook');
        return new Response(JSON.stringify({ 
          error: 'Erro de conectividade com o webhook', 
          message: 'Não foi possível conectar ao servidor webhook. Verifique se a URL está correta e o servidor está online.',
          webhookUrl: webhookUrl,
          originalError: fetchError.message
        }), { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      throw fetchError; // Re-throw se não for um erro conhecido
    }

  } catch (error) {
    console.error('❌ [send-instagram-webhook] Erro geral na função:', error);
    console.error('❌ [send-instagram-webhook] Stack trace:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor', 
      message: error.message,
      type: error.constructor.name
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
