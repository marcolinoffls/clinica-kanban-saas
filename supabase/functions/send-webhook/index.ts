
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as djwt from "https://deno.land/x/djwt@v2.7/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function para envio de webhooks
 * 
 * Funcionalidades:
 * - Envia webhook automaticamente após nova mensagem no chat
 * - Inclui estado do botão de IA (evento_boolean)
 * - Usa URL fixa para webhook do n8n com multi-tenancy via clinica_id
 * - Inclui autenticação JWT segura usando djwt
 * - Busca e valida evolution_instance_name da clínica
 * - Ajusta timestamp para fuso horário de São Paulo
 * - Registra logs para auditoria
 * - Tenta reenvio em caso de falha
 * - Nova estrutura de payload inspirada na Evolution API
 */

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
    message: {
      conversation: string;
    };
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { 
      mensagem_id, 
      lead_id, 
      clinica_id, 
      conteudo, 
      tipo, 
      created_at,
      evento_boolean = false // Estado do botão IA
    } = await req.json()

    // Buscar dados da clínica incluindo evolution_instance_name
    const { data: clinica, error: clinicaError } = await supabaseClient
      .from('clinicas')
      .select('id, evolution_instance_name')
      .eq('id', clinica_id)
      .single()

    if (clinicaError || !clinica?.evolution_instance_name) {
      console.error('Erro ao buscar dados da clínica ou instância não configurada:', clinicaError)
      return new Response(
        JSON.stringify({ error: 'Instância Evolution não configurada ou clínica não encontrada' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // URL fixa para webhook do n8n (multi-tenancy via payload)
    const webhookUrl = `https://webhooks.marcolinofernades.site/webhook/crm`

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
        message: {
          conversation: conteudo // Conteúdo da mensagem
        },
        messageType: tipo || 'conversation', // Tipo da mensagem
        messageTimestamp: Math.floor(new Date(created_at).getTime() / 1000) // Timestamp Unix UTC
      },
      origin: {
        clinica_id: clinica_id, // ID da clínica para multi-tenancy
        lead_id: lead_id, // ID do lead no CRM
        ai_enabled: evento_boolean // Estado do botão IA
      },
      timestamp_sp: timestampSP // Timestamp formatado para São Paulo
    }

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

    console.log('Enviando webhook com novo payload estruturado:', JSON.stringify(webhookPayload, null, 2))
    console.log('URL do webhook:', webhookUrl)
    console.log('Instância Evolution:', clinica.evolution_instance_name)
    console.log('Telefone formatado:', formatarTelefone(lead?.telefone))

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
          console.log('Webhook enviado com sucesso:', resposta)
        } else {
          ultimoErro = `HTTP ${statusCode}: ${resposta}`
          console.error('Erro no webhook:', ultimoErro)
        }
      } catch (error) {
        ultimoErro = `Erro de rede: ${error.message}`
        statusCode = 0
        console.error('Erro de rede no webhook:', error)
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
    console.error('Erro na função webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
