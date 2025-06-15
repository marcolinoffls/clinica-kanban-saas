
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function para Webhook de Follow-up
 * 
 * O que faz:
 * - Envia webhooks específicos para follow-up automático e manual
 * - Integra com n8n usando endpoint /webhook/followup
 * - Processa templates de follow-up com variáveis personalizadas
 * - Mantém logs separados dos webhooks principais
 * 
 * Payload específico:
 * - event: "crm.followup.send"
 * - followup_type: "automatico" | "manual"
 * - campaign_info: dados da campanha
 * - template_info: dados do template
 * - lead_info: dados do lead
 * - execution_id: ID da execução para rastreamento
 * 
 * Como usar:
 * - Chamada automática pelo processador de campanhas (CRON)
 * - Chamada manual pelos botões de follow-up na interface
 * - Integração com Evolution API para WhatsApp/Instagram
 */

interface FollowupWebhookPayload {
  event: string;
  followup_type: 'automatico' | 'manual';
  execution_id: string;
  campaign_info: {
    id: string;
    nome: string;
    tipo: string;
  };
  template_info: {
    id: string;
    titulo: string;
    conteudo: string;
    sequencia: number;
  };
  lead_info: {
    id: string;
    nome: string | null;
    telefone: string | null;
    email: string | null;
    origem_lead: string | null;
  };
  clinica_info: {
    id: string;
    nome: string;
    evolution_instance_name: string | null;
  };
  timestamp: string;
}

serve(async (req) => {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse do corpo da requisição
    const { execution_id } = await req.json();

    if (!execution_id) {
      return new Response('execution_id é obrigatório', { status: 400 });
    }

    console.log('📤 Processando webhook de follow-up para execução:', execution_id);

    // Buscar dados completos da execução
    const { data: execution, error: executionError } = await supabase
      .from('follow_up_execucoes')
      .select(`
        *,
        campaign:follow_up_campaigns(*),
        template:follow_up_templates(*),
        lead:leads(*),
        clinica:leads(clinica:clinicas(*))
      `)
      .eq('id', execution_id)
      .single();

    if (executionError || !execution) {
      console.error('❌ Erro ao buscar execução:', executionError);
      return new Response('Execução não encontrada', { status: 404 });
    }

    // Extrair dados da consulta aninhada
    const campaign = execution.campaign;
    const template = execution.template;
    const lead = execution.lead;
    const clinica = lead.clinica;

    // Validar dados essenciais
    if (!campaign || !template || !lead || !clinica) {
      console.error('❌ Dados incompletos para execução:', execution_id);
      return new Response('Dados incompletos', { status: 400 });
    }

    // Processar conteúdo do template com variáveis
    let conteudoProcessado = template.conteudo;
    
    // Substituir variáveis comuns do follow-up
    const variaveis = {
      '{nome}': lead.nome || 'Cliente',
      '{nome_clinica}': clinica.nome || 'Clínica',
      '{campanha}': campaign.nome,
      '{sequencia}': template.sequencia.toString(),
    };

    // Aplicar substituições
    Object.entries(variaveis).forEach(([variavel, valor]) => {
      conteudoProcessado = conteudoProcessado.replace(new RegExp(variavel, 'g'), valor);
    });

    // Montar payload específico do follow-up
    const payload: FollowupWebhookPayload = {
      event: 'crm.followup.send',
      followup_type: execution.tipo_execucao as 'automatico' | 'manual',
      execution_id: execution.id,
      campaign_info: {
        id: campaign.id,
        nome: campaign.nome,
        tipo: campaign.tipo,
      },
      template_info: {
        id: template.id,
        titulo: template.titulo,
        conteudo: conteudoProcessado,
        sequencia: template.sequencia,
      },
      lead_info: {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        email: lead.email,
        origem_lead: lead.origem_lead,
      },
      clinica_info: {
        id: clinica.id,
        nome: clinica.nome,
        evolution_instance_name: clinica.evolution_instance_name,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('📦 Payload do follow-up preparado:', {
      execution_id,
      campaign: campaign.nome,
      template: template.titulo,
      lead: lead.nome || lead.telefone,
    });

    // URL do webhook do n8n (específica para follow-up)
    const webhookUrl = `${clinica.webhook_usuario}/webhook/followup`;

    // Enviar webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Followup-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await webhookResponse.text();
    
    console.log('📡 Resposta do webhook:', {
      status: webhookResponse.status,
      statusText: webhookResponse.statusText,
      response: responseText,
    });

    // Registrar log do webhook
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        clinica_id: clinica.id,
        lead_id: lead.id,
        mensagem_id: execution_id, // Usar execution_id como referência
        webhook_url: webhookUrl,
        status_code: webhookResponse.status,
        resposta: responseText,
        erro: webhookResponse.ok ? null : `Status ${webhookResponse.status}: ${responseText}`,
        tentativas: 1,
      });

    if (logError) {
      console.error('⚠️ Erro ao registrar log do webhook:', logError);
    }

    // Atualizar status da execução baseado na resposta
    let novoStatus: 'enviado' | 'erro' = 'enviado';
    let erroDetalhes: string | null = null;

    if (!webhookResponse.ok) {
      novoStatus = 'erro';
      erroDetalhes = `Webhook falhou: ${webhookResponse.status} - ${responseText}`;
    }

    // Atualizar execução
    const { error: updateError } = await supabase
      .from('follow_up_execucoes')
      .update({
        status: novoStatus,
        data_enviado: novoStatus === 'enviado' ? new Date().toISOString() : null,
        erro_detalhes: erroDetalhes,
      })
      .eq('id', execution_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar execução:', updateError);
    }

    // Atualizar data do último follow-up no lead
    if (novoStatus === 'enviado') {
      await supabase
        .from('leads')
        .update({
          data_ultimo_followup: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
    }

    if (webhookResponse.ok) {
      console.log('✅ Webhook de follow-up enviado com sucesso');
      return new Response(JSON.stringify({
        success: true,
        execution_id,
        status: 'enviado',
        message: 'Follow-up enviado com sucesso',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      console.error('❌ Webhook de follow-up falhou');
      return new Response(JSON.stringify({
        success: false,
        execution_id,
        status: 'erro',
        message: 'Falha no envio do follow-up',
        error: erroDetalhes,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Erro geral no webhook de follow-up:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno no processamento do follow-up',
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
