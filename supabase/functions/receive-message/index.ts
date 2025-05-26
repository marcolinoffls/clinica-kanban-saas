
/**
 * Edge Function para receber mensagens do WhatsApp via n8n
 * 
 * Esta função:
 * - Recebe webhooks do n8n com mensagens do WhatsApp
 * - Valida JWT para segurança
 * - Busca ou cria leads automaticamente
 * - Salva mensagens na tabela chat_mensagens
 * - Retorna confirmação para o n8n
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as djwt from "https://deno.land/x/djwt@v2.7/mod.ts"

// Headers CORS para permitir chamadas do n8n
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Tratar requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Aceitar apenas POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    console.log('🔄 Recebendo webhook do n8n...')

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Validar JWT do Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token de autorização ausente ou inválido')
      return new Response(
        JSON.stringify({ error: 'Token de autorização obrigatório' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.split(' ')[1]
    const secret = Deno.env.get('EVOLUTION_API_KEY')
    
    if (!secret) {
      console.error('❌ EVOLUTION_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    try {
      // Verificar JWT usando HS256
      const key = await djwt.importKey(new TextEncoder().encode(secret), "HS256")
      const payload = await djwt.verify(token, key)
      console.log('✅ JWT válido:', payload)
    } catch (jwtError) {
      console.error('❌ JWT inválido:', jwtError)
      return new Response(
        JSON.stringify({ error: 'Token de autorização inválido' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parsear payload do n8n
    const webhookData = await req.json()
    console.log('📨 Dados recebidos do n8n:', webhookData)

    const { 
      sender, 
      content, 
      message_type = 'text', 
      clinica_id, 
      timestamp 
    } = webhookData

    // Validar campos obrigatórios
    if (!sender || !content || !clinica_id) {
      console.error('❌ Campos obrigatórios ausentes:', { sender, content, clinica_id })
      return new Response(
        JSON.stringify({ 
          error: 'Campos obrigatórios: sender, content, clinica_id' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Limpar número do telefone (remover caracteres especiais)
    const telefoneFormatado = sender.replace(/\D/g, '')
    console.log('📞 Telefone formatado:', telefoneFormatado)

    // Buscar lead existente pelo telefone e clínica
    let { data: leadExistente, error: leadSearchError } = await supabaseClient
      .from('leads')
      .select('id, nome')
      .eq('telefone', telefoneFormatado)
      .eq('clinica_id', clinica_id)
      .single()

    if (leadSearchError && leadSearchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar lead:', leadSearchError)
      throw leadSearchError
    }

    let leadId: string

    if (leadExistente) {
      // Lead já existe
      leadId = leadExistente.id
      console.log('👤 Lead encontrado:', leadId, leadExistente.nome)
    } else {
      // Criar novo lead
      console.log('🆕 Criando novo lead...')
      
      const { data: novoLead, error: createLeadError } = await supabaseClient
        .from('leads')
        .insert({
          nome: `Contato ${telefoneFormatado}`, // Nome temporário
          telefone: telefoneFormatado,
          clinica_id: clinica_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createLeadError) {
        console.error('❌ Erro ao criar lead:', createLeadError)
        throw createLeadError
      }

      leadId = novoLead.id
      console.log('✅ Novo lead criado:', leadId)
    }

    // Inserir mensagem na tabela chat_mensagens
    const { data: novaMensagem, error: insertError } = await supabaseClient
      .from('chat_mensagens')
      .insert({
        lead_id: leadId,
        clinica_id: clinica_id,
        conteudo: content,
        tipo: message_type,
        enviado_por: 'lead', // Mensagem recebida do paciente
        lida: false,
        created_at: timestamp || new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('❌ Erro ao inserir mensagem:', insertError)
      throw insertError
    }

    console.log('✅ Mensagem salva com sucesso:', novaMensagem.id)

    // Atualizar timestamp do lead
    await supabaseClient
      .from('leads')
      .update({ 
        updated_at: new Date().toISOString(),
        data_ultimo_contato: new Date().toISOString()
      })
      .eq('id', leadId)

    // Resposta de sucesso para o n8n
    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: novaMensagem.id,
        lead_id: leadId 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro interno do servidor:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
