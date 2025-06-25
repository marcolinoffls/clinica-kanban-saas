import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as djwt from "https://deno.land/x/djwt@v2.7/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function para envio de webhooks - VERSÃO COM WEBHOOK PERSONALIZADO POR CLÍNICA
 * 
 * NOVA FUNCIONALIDADE:
 * - Suporte a webhook personalizado por clínica
 * - Busca configurações webhook_type e webhook_url da clínica
 * - Mantém compatibilidade total com clínicas existentes
 * - Fallback automático para webhook padrão se configuração não encontrada
 */

// Interface atualizada para suportar diferentes tipos de mensagem
interface WebhookMessageContent {
  conversation?: string;
  image?: { url: string; caption?: string; mimetype?: string };
  audio?: { url: string; ptt?: boolean; mimetype?: string };
}

interface WebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName: string | null;
    message: WebhookMessageContent; // Campo atualizado para suportar mídia
    messageType: string;
    messageTimestamp: number;
  };
  origin: {
    clinica_id: string;
    lead_id: string;
    ai_enabled: boolean;
  };
  timestamp_sp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log da requisição recebida
    console.log('🔍 [send-webhook] Requisição recebida');
    console.log('- Method:', req.method);
    console.log('- Headers:', Object.fromEntries(req.headers.entries()));

    // CORREÇÃO: Usa a Service Role Key para criar um cliente Supabase com privilégios de administrador.
    // Isso é necessário para que a Edge Function possa ler dados de qualquer tabela (como 'clinicas'),
    // ignorando as políticas de Row Level Security (RLS). O cliente anterior usava a chave anônima,
    // que não tinha permissão para ler os dados da clínica, causando o erro "Clínica não encontrada".
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } } // Boa prática para clientes server-side
    )

    const requestBody = await req.json()
    console.log('📋 [send-webhook] Payload recebido:');
    console.log(JSON.stringify(requestBody, null, 2));

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

    // Validações detalhadas do payload (incluindo anexo_url)
    console.log('✅ [send-webhook] Validando parâmetros (com anexo):');
    console.log('- mensagem_id:', mensagem_id, 'type:', typeof mensagem_id);
    console.log('- lead_id:', lead_id, 'type:', typeof lead_id);
    console.log('- clinica_id:', clinica_id, 'type:', typeof clinica_id);
    console.log('- conteudo length:', conteudo?.length);
    console.log('- tipo:', tipo);
    console.log('- created_at:', created_at);
    console.log('- evento_boolean:', evento_boolean);
    console.log('- anexo_url:', anexo_url); // Log do novo parâmetro

    if (!clinica_id) {
      console.error('❌ [send-webhook] ERRO: clinica_id não fornecido');
      return new Response(
        JSON.stringify({ error: 'clinica_id é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validação de formato UUID do clinica_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clinica_id)) {
      console.error('❌ [send-webhook] clinica_id com formato inválido:', clinica_id);
      return new Response(
        JSON.stringify({ 
          error: 'clinica_id deve ter formato UUID válido',
          clinica_id_fornecido: clinica_id
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // CORREÇÃO: Buscar dados da clínica incluindo configurações de webhook
    console.log('🔍 [send-webhook] Buscando dados da clínica com configurações de webhook...');
    console.log('- Executando query: SELECT id, evolution_instance_name, webhook_type, webhook_url FROM clinicas WHERE id =', clinica_id);

    const { data: clinicasEncontradas, error: clinicaError } = await supabaseClient
      .from('clinicas')
      .select('id, evolution_instance_name, webhook_type, webhook_url')
      .eq('id', clinica_id)

    console.log('📊 [send-webhook] Resultado da query:');
    console.log('- data:', clinicasEncontradas);
    console.log('- error:', clinicaError);

    if (clinicaError) {
      console.error('❌ [send-webhook] Erro na query da clínica:', clinicaError);
      console.error('- Code:', clinicaError.code);
      console.error('- Message:', clinicaError.message);
      console.error('- Details:', clinicaError.details);
      console.error('- Hint:', clinicaError.hint);
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar dados da clínica',
          details: clinicaError.message,
          code: clinicaError.code
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se nenhuma clínica foi encontrada
    if (!clinicasEncontradas || clinicasEncontradas.length === 0) {
      console.error('❌ [send-webhook] Clínica não encontrada para ID:', clinica_id);
      console.log('- Verificando se o ID existe na tabela...');
      
      // Query adicional para verificar se existe alguma clínica
      const { data: todasClinicas, error: errorTodasClinicas } = await supabaseClient
        .from('clinicas')
        .select('id, nome')
        .limit(5)

      console.log('📋 [send-webhook] Primeiras 5 clínicas na tabela:');
      console.log('- data:', todasClinicas);
      console.log('- error:', errorTodasClinicas);

      return new Response(
        JSON.stringify({ 
          error: 'Clínica não encontrada',
          clinica_id_procurado: clinica_id,
          clinicas_existentes: todasClinicas?.map(c => ({ id: c.id, nome: c.nome })) || [],
          sugestao: 'Verifique se o clinica_id do lead está correto e aponta para uma clínica existente'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se múltiplas clínicas foram encontradas (não deveria acontecer)
    if (clinicasEncontradas.length > 1) {
      console.error('❌ [send-webhook] Múltiplas clínicas encontradas para ID:', clinica_id);
      return new Response(
        JSON.stringify({ 
          error: 'Múltiplas clínicas encontradas para o mesmo ID',
          clinica_id_procurado: clinica_id,
          quantidade_encontrada: clinicasEncontradas.length
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Usar a clínica encontrada
    const clinica = clinicasEncontradas[0];

    if (!clinica.evolution_instance_name) {
      console.error('❌ [send-webhook] evolution_instance_name não configurado para clínica:', clinica_id);
      return new Response(
        JSON.stringify({ 
          error: 'Instância Evolution não configurada para esta clínica',
          clinica_id: clinica_id
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [send-webhook] Clínica encontrada com sucesso:');
    console.log('- ID:', clinica.id);
    console.log('- Evolution Instance:', clinica.evolution_instance_name);
    console.log('- Webhook Type:', clinica.webhook_type || 'padrao');
    console.log('- Webhook URL:', clinica.webhook_url || 'padrão');

    // 🆕 LÓGICA DE WEBHOOK PERSONALIZADO: Determinar URL do webhook baseado na configuração da clínica
    let webhookUrl: string;
    
    if (clinica.webhook_type === 'personalizado' && clinica.webhook_url) {
      // Usar webhook personalizado da clínica
      webhookUrl = clinica.webhook_url;
      console.log('🔗 [send-webhook] Usando webhook personalizado da clínica:', webhookUrl);
    } else {
      // Usar webhook padrão (compatibilidade com clínicas existentes)
      webhookUrl = `https://webhooks.marcolinofernades.site/webhook/crm`;
      console.log('🔗 [send-webhook] Usando webhook padrão do sistema:', webhookUrl);
    }

    // Buscar dados do lead para contexto adicional (incluindo telefone e nome)
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('nome, telefone')
      .eq('id', lead_id)
      .single()

    // Ajustar timestamp para fuso horário de São Paulo
    const dataUTC = new Date(created_at);
    const timestampSP = dataUTC.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });

    // Função para limpar e formatar número de telefone
    const formatarTelefone = (telefone: string | null): string => {
      if (!telefone) return ''
      // Remove todos os caracteres não numéricos
      const numeroLimpo = telefone.replace(/\D/g, '')
      return `${numeroLimpo}@s.whatsapp.net`
    }

    // NOVA LÓGICA: Construção condicional do messagePayload baseado no tipo
    let messagePayload: WebhookMessageContent;

    if (tipo === 'image' && anexo_url) {
      console.log('[send-webhook] Preparando payload para IMAGEM');
      messagePayload = {
        image: { url: anexo_url }, // Evolution API espera 'url' para a imagem
        caption: conteudo // Usando 'conteudo' como legenda da imagem
      };
    } else if (tipo === 'audio' && anexo_url) {
      console.log('[send-webhook] Preparando payload para ÁUDIO');
      messagePayload = {
        audio: { url: anexo_url },
        ptt: true // Geralmente 'true' para áudios de WhatsApp (Push to Talk)
      };
    } else {
      console.log('[send-webhook] Preparando payload para TEXTO');
      messagePayload = {
        conversation: conteudo
      };
    }

    // Criar payload do webhook com nova estrutura inspirada na Evolution API
    const webhookPayload: WebhookPayload = {
      event: "crm.send.message", // Identificador do evento
      instance: clinica.evolution_instance_name, // ID da instância Evolution
      data: {
        key: {
          remoteJid: formatarTelefone(lead?.telefone), // Telefone formatado para WhatsApp
          fromMe: true, // Sempre true para mensagens saindo do CRM
          id: mensagem_id // ID da mensagem no nosso banco
        },
        pushName: lead?.nome || null, // Nome do lead no CRM (pode ser null)
        message: messagePayload, // PAYLOAD CONDICIONAL (texto, imagem ou áudio)
        messageType: tipo || 'conversation', // Tipo real da mensagem
        messageTimestamp: Math.floor(new Date(created_at).getTime() / 1000) // Timestamp Unix UTC
      },
      origin: {
        clinica_id: clinica_id, // ID da clínica para multi-tenancy
        lead_id: lead_id, // ID do lead no CRM
        ai_enabled: evento_boolean // Estado do botão IA
      },
      timestamp_sp: timestampSP // Timestamp formatado para São Paulo
    }

    // Log do payload final que será enviado para o n8n/Evolution API
    console.log('📤 [send-webhook] Payload final para n8n/Evolution API:', JSON.stringify(webhookPayload, null, 2));

    // Gerar JWT seguro usando djwt
    const secretKey = Deno.env.get('EVOLUTION_API_KEY') || 'default-secret'
    
    // Importar chave criptográfica para HMAC
    const cryptoKey = await crypto.subtle.importKey(
      "raw", 
      new TextEncoder().encode(secretKey), 
      { name: "HMAC", hash: "SHA-256" },
      true, 
      ["sign", "verify"]
    )

    // Criar JWT com payload seguro
    const jwt = await djwt.create(
      { alg: "HS256", typ: "JWT" }, 
      { 
        clinica_id,
        exp: djwt.getNumericDate(60 * 60) // Expira em 1 hora
      }, 
      cryptoKey
    )

    let tentativas = 1
    let sucesso = false
    let ultimoErro = ''
    let statusCode = 0
    let resposta = ''

    console.log('🚀 [send-webhook] Enviando webhook:');
    console.log('- URL:', webhookUrl);
    console.log('- Tipo:', clinica.webhook_type || 'padrao');
    console.log('- Instância Evolution:', clinica.evolution_instance_name);
    console.log('- Telefone formatado:', formatarTelefone(lead?.telefone));
    console.log('- Tipo de mensagem:', tipo);
    console.log('- Anexo URL:', anexo_url);

    // Tentar enviar webhook (máximo 3 tentativas com backoff exponencial)
    while (tentativas <= 3 && !sucesso) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}` // JWT seguro para autenticação
          },
          body: JSON.stringify(webhookPayload)
        })

        statusCode = webhookResponse.status
        resposta = await webhookResponse.text()

        if (webhookResponse.ok) {
          sucesso = true
          console.log('✅ [send-webhook] Webhook enviado com sucesso:', resposta)
        } else {
          ultimoErro = `HTTP ${statusCode}: ${resposta}`
          console.error('❌ [send-webhook] Erro no webhook:', ultimoErro)
        }
      } catch (error) {
        ultimoErro = `Erro de rede: ${error.message}`
        statusCode = 0
        console.error('❌ [send-webhook] Erro de rede no webhook:', error)
      }

      if (!sucesso) {
        tentativas++
        // Aguardar antes de tentar novamente (backoff exponencial)
        if (tentativas <= 3) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativas) * 1000))
        }
      }
    }

    // Registrar log do webhook para auditoria
    await supabaseClient
      .from('webhook_logs')
      .insert({
        clinica_id,
        lead_id,
        mensagem_id,
        webhook_url: webhookUrl,
        status_code: statusCode,
        resposta: sucesso ? resposta : null,
        erro: sucesso ? null : ultimoErro,
        tentativas: tentativas - 1
      })

    if (sucesso) {
      return new Response(
        JSON.stringify({ success: true, tentativas: tentativas - 1 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Falha ao enviar webhook após múltiplas tentativas',
          ultimo_erro: ultimoErro,
          tentativas: tentativas - 1
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ [send-webhook] Erro geral na função:', error);
    console.error('- Stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
