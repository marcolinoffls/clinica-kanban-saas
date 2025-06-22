
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function Otimizada para Geração de Relatórios de IA
 * 
 * O que faz:
 * - Valida autenticação via JWT do Supabase Auth
 * - Recebe payload mínimo do frontend
 * - Converte datas para o fuso horário de São Paulo
 * - Envia dados essenciais para o webhook do n8n
 * - Inclui informações sobre quem solicitou (admin ou usuário da clínica)
 * - Delega coleta de dados para o n8n (mais eficiente)
 * - Atualiza status em caso de erro
 * 
 * Onde é chamada:
 * - Pelo hook useCreateAIReport quando usuário solicita relatório
 * 
 * Como funciona:
 * - Validação JWT usando Supabase Auth
 * - Conversão de datas para timezone de São Paulo
 * - Payload mínimo para n8n com identificação do solicitante
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
  requested_by_admin: boolean;
  requester_user_id: string;
  admin_clinic_context?: string | null;
}

/**
 * Converte uma data UTC para o fuso horário de São Paulo
 * @param utcDateString - Data em formato ISO string UTC
 * @returns Data convertida para o timezone de São Paulo
 */
function convertToSaoPauloTimezone(utcDateString: string): string {
  const utcDate = new Date(utcDateString);
  
  // Criar formatador para o timezone de São Paulo
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Obter as partes da data formatada
  const parts = formatter.formatToParts(utcDate);
  const partsObj = parts.reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {} as Record<string, string>);

  // Construir a string no formato ISO com timezone de São Paulo
  const saoPauloDateString = `${partsObj.year}-${partsObj.month}-${partsObj.day}T${partsObj.hour}:${partsObj.minute}:${partsObj.second}-03:00`;
  
  return saoPauloDateString;
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
      report_request_id,
      requested_by_admin,
      requester_user_id,
      admin_clinic_context
    } = requestData;

    // Validar campos obrigatórios
    if (!clinica_id || !start_date || !end_date || !delivery_method || !report_request_id) {
      throw new Error('Campos obrigatórios faltando no payload');
    }

    // Log das informações do solicitante
    console.log('🔐 Informações do solicitante:', {
      requested_by_admin,
      requester_user_id,
      admin_clinic_context
    });

    // 4. Atualizar status do relatório para 'processing'
    await supabase
      .from('ai_reports')
      .update({ status: 'processing' })
      .eq('id', report_request_id);

    console.log('🔄 Status atualizado para processing');

    // 5. Converter datas para fuso horário de São Paulo
    const startDateSaoPaulo = convertToSaoPauloTimezone(start_date);
    const endDateSaoPaulo = convertToSaoPauloTimezone(end_date);

    console.log('🕐 Datas convertidas para São Paulo:', {
      original_start: start_date,
      sao_paulo_start: startDateSaoPaulo,
      original_end: end_date,
      sao_paulo_end: endDateSaoPaulo
    });

    // 6. Preparar payload mínimo para o n8n com datas no fuso de São Paulo e informações do solicitante
    const n8nPayload = {
      // IDs e metadados essenciais
      report_request_id,
      clinica_id,
      start_date: startDateSaoPaulo,  // Data convertida para São Paulo
      end_date: endDateSaoPaulo,      // Data convertida para São Paulo
      delivery_method,
      recipient_phone_number,
      
      // Informações sobre quem solicitou o relatório
      requested_by_admin,
      requester_user_id,
      admin_clinic_context,
      
      // Timestamp do processamento
      processing_started_at: new Date().toISOString(),
      
      // Origem da requisição
      source: 'edge-function-optimized',
      
      // Informação sobre o timezone
      timezone: 'America/Sao_Paulo'
    };

    console.log('📤 Enviando payload completo para o n8n:', n8nPayload);

    // 7. Enviar para o webhook do n8n
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

    // 8. Retornar resposta rápida de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Relatório enviado para processamento no n8n',
        report_id: report_request_id,
        n8n_response: webhookResult,
        requester_info: {
          requested_by_admin,
          requester_user_id,
          admin_clinic_context
        },
        timezone_info: {
          original_dates: { start_date, end_date },
          sao_paulo_dates: { start_date: startDateSaoPaulo, end_date: endDateSaoPaulo }
        }
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
