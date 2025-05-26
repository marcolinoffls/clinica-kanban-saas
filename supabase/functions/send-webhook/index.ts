
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
 * - Registra logs para auditoria
 * - Tenta reenvio em caso de falha
 */

interface WebhookPayload {
  timestamp: string;
  lead_id: string;
  usuario_id: string;
  mensagem: string;
  tipo_mensagem: string;
  evento_boolean: boolean;
  clinica_id: string; // Campo explícito para multi-tenancy
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

    // Verificar se a clínica existe (sem buscar webhook_usuario)
    const { data: clinica, error: clinicaError } = await supabaseClient
      .from('clinicas')
      .select('id')
      .eq('id', clinica_id)
      .single()

    if (clinicaError) {
      console.error('Erro ao buscar/verificar dados da clínica:', clinicaError)
      return new Response(
        JSON.stringify({ error: 'Clínica não encontrada ou erro' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // URL fixa para webhook do n8n (multi-tenancy via payload)
    const webhookUrl = `https://webhooks.marcolinofernades.site/webhook/crm`

    // Buscar dados do lead para contexto adicional
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('nome, telefone')
      .eq('id', lead_id)
      .single()

    // Criar payload do webhook com clinica_id para multi-tenancy
    const webhookPayload: WebhookPayload = {
      timestamp: created_at,
      lead_id: lead_id,
      usuario_id: clinica_id, // Mantido para compatibilidade
      mensagem: conteudo,
      tipo_mensagem: tipo || 'texto',
      evento_boolean: evento_boolean,
      clinica_id: clinica_id // Campo explícito para n8n identificar a clínica
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

    console.log('Enviando webhook com payload:', JSON.stringify(webhookPayload, null, 2))
    console.log('URL do webhook:', webhookUrl)

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
