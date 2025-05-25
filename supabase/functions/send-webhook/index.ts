
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function para envio de webhooks
 * 
 * Funcionalidades:
 * - Envia webhook automaticamente após nova mensagem no chat
 * - Inclui autenticação JWT no header
 * - Registra logs para auditoria
 * - Tenta reenvio em caso de falha
 */

interface WebhookPayload {
  timestamp: string;
  lead_id: string;
  usuario_id: string;
  mensagem: string;
  tipo_mensagem: string;
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
      created_at 
    } = await req.json()

    // Buscar dados da clínica para obter o webhook_usuario
    const { data: clinica, error: clinicaError } = await supabaseClient
      .from('clinicas')
      .select('webhook_usuario')
      .eq('id', clinica_id)
      .single()

    if (clinicaError || !clinica?.webhook_usuario) {
      console.error('Erro ao buscar dados da clínica:', clinicaError)
      return new Response(
        JSON.stringify({ error: 'Webhook usuario não configurado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Construir URL do webhook
    const webhookUrl = `https://webhooks.marcolinofernades.site/webhook/${clinica.webhook_usuario}`

    // Buscar dados do lead
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('nome, telefone')
      .eq('id', lead_id)
      .single()

    // Criar payload do webhook
    const webhookPayload: WebhookPayload = {
      timestamp: created_at,
      lead_id: lead_id,
      usuario_id: clinica_id, // Usando clinica_id como usuario_id do software
      mensagem: conteudo,
      tipo_mensagem: tipo || 'texto'
    }

    // Gerar JWT simples para autenticação (usando secret da API)
    const secret = Deno.env.get('EVOLUTION_API_KEY') || 'default-secret'
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({ 
      clinica_id, 
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hora
    }))
    const signature = btoa(secret) // Simplificado para demo
    const jwt = `${header}.${payload}.${signature}`

    let tentativas = 1
    let sucesso = false
    let ultimoErro = ''
    let statusCode = 0
    let resposta = ''

    // Tentar enviar webhook (máximo 3 tentativas)
    while (tentativas <= 3 && !sucesso) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify(webhookPayload)
        })

        statusCode = webhookResponse.status
        resposta = await webhookResponse.text()

        if (webhookResponse.ok) {
          sucesso = true
        } else {
          ultimoErro = `HTTP ${statusCode}: ${resposta}`
        }
      } catch (error) {
        ultimoErro = `Erro de rede: ${error.message}`
        statusCode = 0
      }

      if (!sucesso) {
        tentativas++
        // Aguardar antes de tentar novamente (backoff exponencial)
        if (tentativas <= 3) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, tentativas) * 1000))
        }
      }
    }

    // Registrar log do webhook
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
