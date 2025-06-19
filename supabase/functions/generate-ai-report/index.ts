
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function Otimizada para Geração de Relatórios de IA
 * 
 * O que faz:
 * - Valida autenticação via JWT do Supabase Auth
 * - Recebe payload mínimo do frontend
 * - Envia dados essenciais para o webhook do n8n
 * - Delega coleta de dados para o n8n (mais eficiente)
 * - Atualiza status em caso de erro
 * 
 * Onde é chamada:
 * - Pelo hook useCreateAIReport quando usuário solicita relatório
 * 
 * Como funciona:
 * - Validação JWT usando Supabase Auth
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
    // 1. Criar cliente Supabase para validação de usuário
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Validar autenticação via JWT do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token de autorização não fornecido');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar o token JWT usando o cliente Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token de autenticação inválido'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    console.log('✅ Usuário autenticado:', user.id);

    // 3. Parse do payload de entrada
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

    // 6. Enviar para o webhook do n8n
    const webhookUrl = 'https://webhooks.marcolinofernades.site/webhook/relatorio-crm-sistema';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Usar o token do usuário diretamente
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(`Erro no webhook do n8n: ${webhookResponse.status} - ${errorText}`);
    }

    const webhookResult = await webhookResponse.json();
    console.log('✅ Webhook n8n respondeu:', webhookResult);

    // 7. Retornar resposta rápida de sucesso
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
            status: 'failed',
            error_message: error.message
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
