
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function para Cancelar/Resetar Status de Relatórios de IA
 * 
 * O que faz:
 * - Valida autenticação via token JWT do Supabase
 * - Recebe report_id e clinica_id do frontend
 * - Atualiza o status do relatório para 'cancelled'
 * - Adiciona mensagem de erro indicando cancelamento pelo usuário
 * - Limpa dados de conteúdo e PDF se existirem
 * 
 * Onde é chamada:
 * - Pelo hook useCancelAIReport quando usuário cancela relatório
 * 
 * Como funciona:
 * - Validação JWT usando token do Supabase Auth
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
    // 1. Criar cliente Supabase com service role para operações administrativas
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
    const requestData: ResetReportPayload = await req.json();
    console.log('🚫 Processando cancelamento de relatório:', requestData);

    const { report_id, clinica_id } = requestData;

    // Validar campos obrigatórios
    if (!report_id || !clinica_id) {
      throw new Error('report_id e clinica_id são obrigatórios');
    }

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

    console.log('📋 Relatório encontrado:', existingReport);

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
