
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v2.7/mod.ts';

/**
 * Edge Function para Cancelar/Resetar Status de Relatórios de IA
 * 
 * O que faz:
 * - Valida autenticação via JWT usando EVOLUTION_API_KEY
 * - Recebe report_id e clinica_id do frontend
 * - Atualiza o status do relatório para 'cancelled'
 * - Adiciona mensagem de erro indicando cancelamento pelo usuário
 * - Limpa dados de conteúdo e PDF se existirem
 * 
 * Onde é chamada:
 * - Pelo hook useCancelAIReport quando usuário cancela relatório
 * 
 * Como funciona:
 * - Validação JWT rápida
 * - Update direto na tabela ai_reports
 * - Resposta rápida para o frontend
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetReportPayload {
  report_id: string;
  clinica_id: string;
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
    const requestData: ResetReportPayload = await req.json();
    console.log('🚫 Processando cancelamento de relatório:', requestData);

    const { report_id, clinica_id } = requestData;

    // Validar campos obrigatórios
    if (!report_id || !clinica_id) {
      throw new Error('report_id e clinica_id são obrigatórios');
    }

    // 3. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Verificar se o relatório existe e pertence à clínica
    const { data: existingReport, error: fetchError } = await supabase
      .from('ai_reports')
      .select('id, status, clinica_id')
      .eq('id', report_id)
      .eq('clinica_id', clinica_id)
      .single();

    if (fetchError || !existingReport) {
      console.error('Relatório não encontrado:', fetchError);
      throw new Error('Relatório não encontrado ou sem permissão');
    }

    // 5. Atualizar status do relatório para 'cancelled'
    const { data: updatedReport, error: updateError } = await supabase
      .from('ai_reports')
      .update({
        status: 'cancelled',
        error_message: 'Geração cancelada pelo usuário',
        report_content: null,
        report_pdf_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', report_id)
      .eq('clinica_id', clinica_id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar relatório:', updateError);
      throw new Error('Erro ao cancelar relatório');
    }

    console.log('✅ Relatório cancelado com sucesso:', updatedReport.id);

    // 6. Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Relatório cancelado com sucesso',
        report_id: updatedReport.id,
        status: updatedReport.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function de cancelamento:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Erro na Edge Function de cancelamento'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
