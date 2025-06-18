
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, verify } from 'https://deno.land/x/djwt@v2.7/mod.ts';

/**
 * Edge Function Otimizada para Geração de Relatórios de IA
 * 
 * O que faz:
 * - Valida autenticação via JWT usando EVOLUTION_API_KEY
 * - Recebe payload mínimo do frontend
 * - Envia dados essenciais para o webhook do n8n
 * - Delega coleta de dados para o n8n (mais eficiente)
 * - Atualiza status em caso de erro
 * 
 * Onde é chamada:
 * - Pelo hook useCreateAIReport quando usuário solicita relatório
 * 
 * Como funciona:
 * - Validação JWT rápida
 * - Payload mínimo para n8n
 * - Resposta rápida para o frontend
 * - n8n faz o trabalho pesado de coleta e análise de dados
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequestPayload {
  clinica_id: string;
  start_date: string;
  end_date: string;
  delivery_method: 'in_app' | 'whatsapp';
  recipient_phone_number?: string;
  report_request_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validar autenticação via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token de autorização não fornecido ou inválido');
    }

    const token = authHeader.replace('Bearer ', '');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionApiKey) {
      throw new Error('EVOLUTION_API_KEY não configurada');
    }

    // Verificar JWT usando EVOLUTION_API_KEY como segredo
    try {
      await verify(token, evolutionApiKey, "HS256");
    } catch (jwtError) {
      console.error('❌ JWT inválido ou expirado:', jwtError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token JWT inválido ou expirado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // 2. Parse do payload de entrada
    const requestData: ReportRequestPayload = await req.json();
    console.log('📊 Processando requisição otimizada de relatório:', requestData);

    const { 
      clinica_id, 
      start_date, 
      end_date, 
      delivery_method, 
      recipient_phone_number, 
      report_request_id 
    } = requestData;

    // Validar campos obrigatórios
    if (!clinica_id || !start_date || !end_date || !delivery_method || !report_request_id) {
      throw new Error('Campos obrigatórios faltando no payload');
    }

    // 3. Criar cliente Supabase para possíveis updates de status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Atualizar status do relatório para 'processing'
    await supabase
      .from('ai_reports')
      .update({ status: 'processing' })
      .eq('id', report_request_id);

    console.log('🔄 Status atualizado para processing');

    // 5. Preparar payload mínimo para o n8n
    const n8nPayload = {
      // IDs e metadados essenciais
      report_request_id,
      clinica_id,
      start_date,
      end_date,
      delivery_method,
      recipient_phone_number,
      
      // Timestamp do processamento
      processing_started_at: new Date().toISOString(),
      
      // Origem da requisição
      source: 'edge-function-optimized'
    };

    console.log('📤 Enviando payload mínimo para o n8n...');

    // 6. Gerar JWT para autenticação no n8n
    const jwtForN8n = await create(
      { alg: "HS256", typ: "JWT" },
      { 
        iss: "supabase-edge-function",
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
        data: { report_request_id, clinica_id }
      },
      evolutionApiKey
    );

    // 7. Enviar para o webhook do n8n
    const webhookUrl = 'https://webhooks.marcolinofernades.site/webhook/relatorio-crm-sistema';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtForN8n}`
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(`Erro no webhook do n8n: ${webhookResponse.status} - ${errorText}`);
    }

    const webhookResult = await webhookResponse.json();
    console.log('✅ Webhook n8n respondeu:', webhookResult);

    // 8. Retornar resposta rápida de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Relatório enviado para processamento no n8n',
        report_id: report_request_id,
        n8n_response: webhookResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function otimizada:', error);

    // Tentar atualizar o status para failed se temos o report_id
    try {
      const requestBody = await req.clone().json();
      if (requestBody.report_request_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('ai_reports')
          .update({ 
            status: 'failed'
          })
          .eq('id', requestBody.report_request_id);
      }
    } catch (updateError) {
      console.error('Erro ao atualizar status de falha:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Erro na Edge Function otimizada'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
