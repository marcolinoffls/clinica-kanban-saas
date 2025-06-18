
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function para Geração de Relatórios de IA
 * 
 * O que faz:
 * - Recebe requisições do frontend para gerar relatórios
 * - Coleta todos os dados relevantes da clínica no período especificado
 * - Compila os dados e envia para o webhook do n8n para processamento
 * - Atualiza o status do relatório conforme o processamento
 * 
 * Onde é chamada:
 * - Pelo hook useAIReport quando o usuário solicita um novo relatório
 * 
 * Como funciona:
 * - Valida a autenticação via JWT
 * - Busca dados de leads, mensagens, agendamentos e clínica
 * - Envia tudo para o n8n via webhook
 * - Retorna resposta rápida para o frontend
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  clinica_id: string;
  start_date: string;
  end_date: string;
  delivery_method: 'system' | 'whatsapp';
  phone_number?: string;
  report_request_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização não fornecido');
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse do body da requisição
    const requestData: ReportRequest = await req.json();
    console.log('📊 Processando requisição de relatório:', requestData);

    const { 
      clinica_id, 
      start_date, 
      end_date, 
      delivery_method, 
      phone_number, 
      report_request_id 
    } = requestData;

    // Atualizar status do relatório para 'processing'
    await supabase
      .from('ai_reports')
      .update({ status: 'processing' })
      .eq('id', report_request_id);

    console.log('🔄 Status atualizado para processing');

    // 1. Buscar dados da clínica
    const { data: clinica, error: clinicaError } = await supabase
      .from('clinicas')
      .select('*')
      .eq('id', clinica_id)
      .single();

    if (clinicaError || !clinica) {
      throw new Error(`Clínica não encontrada: ${clinicaError?.message}`);
    }

    console.log('🏥 Dados da clínica coletados:', clinica.nome);

    // 2. Buscar leads do período
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('clinica_id', clinica_id)
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    if (leadsError) {
      throw new Error(`Erro ao buscar leads: ${leadsError.message}`);
    }

    console.log(`📋 ${leads?.length || 0} leads coletados`);

    // 3. Buscar mensagens dos leads
    const leadIds = leads?.map(lead => lead.id) || [];
    let mensagens = [];
    
    if (leadIds.length > 0) {
      const { data: mensagensData, error: mensagensError } = await supabase
        .from('chat_mensagens')
        .select('*')
        .in('lead_id', leadIds)
        .gte('created_at', start_date)
        .lte('created_at', end_date);

      if (mensagensError) {
        console.warn('Aviso ao buscar mensagens:', mensagensError.message);
      } else {
        mensagens = mensagensData || [];
      }
    }

    console.log(`💬 ${mensagens.length} mensagens coletadas`);

    // 4. Buscar agendamentos do período
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('clinica_id', clinica_id)
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    if (agendamentosError) {
      console.warn('Aviso ao buscar agendamentos:', agendamentosError.message);
    }

    console.log(`📅 ${agendamentos?.length || 0} agendamentos coletados`);

    // 5. Buscar aliases de anúncios
    const { data: adAliases, error: aliasesError } = await supabase
      .from('ad_aliases')
      .select('*')
      .eq('clinica_id', clinica_id);

    if (aliasesError) {
      console.warn('Aviso ao buscar aliases:', aliasesError.message);
    }

    console.log(`🏷️ ${adAliases?.length || 0} aliases coletados`);

    // 6. Preparar payload para o n8n
    const webhookPayload = {
      // Metadados da requisição
      report_request_id,
      clinica_id,
      start_date,
      end_date,
      delivery_method,
      phone_number,
      
      // Dados coletados
      clinica_data: clinica,
      leads_data: leads || [],
      mensagens_data: mensagens,
      agendamentos_data: agendamentos || [],
      ad_aliases_data: adAliases || [],
      
      // Estatísticas básicas
      stats: {
        total_leads: leads?.length || 0,
        total_mensagens: mensagens.length,
        total_agendamentos: agendamentos?.length || 0,
        leads_convertidos: leads?.filter(lead => lead.convertido).length || 0,
        periodo_analise: {
          inicio: start_date,
          fim: end_date
        }
      }
    };

    console.log('📤 Enviando dados para o n8n...');

    // 7. Gerar JWT para autenticação no n8n
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const jwtToken = evolutionApiKey; // Usando a mesma chave por simplicidade

    // 8. Enviar para o webhook do n8n
    const webhookUrl = 'https://webhooks.marcolinofernades.site/webhook/relatorio-crm-sistema';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(`Erro no webhook do n8n: ${webhookResponse.status} - ${errorText}`);
    }

    const webhookResult = await webhookResponse.json();
    console.log('✅ Webhook n8n respondeu:', webhookResult);

    // 9. Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Relatório enviado para processamento',
        report_id: report_request_id,
        stats: webhookPayload.stats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error);

    // Tentar atualizar o status para failed se temos o report_id
    try {
      const requestData = await req.json();
      if (requestData.report_request_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('ai_reports')
          .update({ 
            status: 'failed', 
            error_message: error.message 
          })
          .eq('id', requestData.report_request_id);
      }
    } catch (updateError) {
      console.error('Erro ao atualizar status de falha:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Erro interno da função'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
