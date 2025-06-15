
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function para Processamento Automático de Campanhas de Follow-up
 * 
 * O que faz:
 * - Roda via CRON para detectar leads inativos
 * - Cria execuções automáticas baseado nas campanhas ativas
 * - Processa sequências de templates de follow-up
 * - Respeita horários de funcionamento e dias úteis
 * 
 * Lógica de detecção:
 * - Identifica leads sem atividade recente baseado em dias_inatividade
 * - Verifica se lead não está com follow-up pausado
 * - Considera horários de envio configurados
 * - Evita duplicação de execuções pendentes
 * 
 * Como usar:
 * - Configurar CRON no Supabase para executar a cada X minutos
 * - Chamada manual para testes via interface administrativa
 * - Logs detalhados para monitoramento
 */

interface ProcessingResult {
  campanhas_processadas: number;
  leads_detectados: number;
  execucoes_criadas: number;
  execucoes_enviadas: number;
  erros: string[];
}

serve(async (req) => {
  console.log('🚀 Iniciando processamento de campanhas de follow-up');

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result: ProcessingResult = {
      campanhas_processadas: 0,
      leads_detectados: 0,
      execucoes_criadas: 0,
      execucoes_enviadas: 0,
      erros: [],
    };

    // Buscar campanhas automáticas ativas
    const { data: campanhas, error: campanhasError } = await supabase
      .from('follow_up_campaigns')
      .select(`
        *,
        templates:follow_up_templates(*)
      `)
      .eq('tipo', 'automatico')
      .eq('ativo', true);

    if (campanhasError) {
      console.error('❌ Erro ao buscar campanhas:', campanhasError);
      throw new Error(`Erro ao buscar campanhas: ${campanhasError.message}`);
    }

    if (!campanhas || campanhas.length === 0) {
      console.log('ℹ️ Nenhuma campanha automática ativa encontrada');
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma campanha ativa para processar',
        result,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Processando ${campanhas.length} campanhas ativas`);

    // Processar cada campanha
    for (const campanha of campanhas) {
      try {
        console.log(`🔄 Processando campanha: ${campanha.nome}`);
        result.campanhas_processadas++;

        // Verificar se está no horário de envio
        const agora = new Date();
        const horarioAtual = agora.toTimeString().slice(0, 5); // HH:MM
        const diaSemana = agora.getDay(); // 0 = domingo, 6 = sábado

        // Verificar dias úteis
        if (campanha.apenas_dias_uteis && (diaSemana === 0 || diaSemana === 6)) {
          console.log(`⏸️ Pulando campanha ${campanha.nome} - fim de semana`);
          continue;
        }

        // Verificar horário de envio
        if (campanha.horario_envio && horarioAtual < campanha.horario_envio) {
          console.log(`⏸️ Pulando campanha ${campanha.nome} - fora do horário`);
          continue;
        }

        // Calcular data limite para inatividade
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - campanha.dias_inatividade);

        // Buscar leads inativos da clínica desta campanha
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('clinica_id', campanha.clinica_id)
          .eq('follow_up_pausado', false)
          .or(`data_ultimo_contato.lt.${dataLimite.toISOString()},data_ultimo_contato.is.null`)
          .not('telefone', 'is', null); // Apenas leads com telefone

        if (leadsError) {
          console.error(`❌ Erro ao buscar leads da campanha ${campanha.nome}:`, leadsError);
          result.erros.push(`Erro ao buscar leads: ${leadsError.message}`);
          continue;
        }

        if (!leads || leads.length === 0) {
          console.log(`ℹ️ Nenhum lead inativo encontrado para campanha ${campanha.nome}`);
          continue;
        }

        console.log(`📍 ${leads.length} leads inativos encontrados para campanha ${campanha.nome}`);
        result.leads_detectados += leads.length;

        // Processar cada lead
        for (const lead of leads) {
          try {
            // Verificar se já existe execução pendente para este lead nesta campanha
            const { data: execucoesPendentes, error: execucoesError } = await supabase
              .from('follow_up_execucoes')
              .select('id')
              .eq('lead_id', lead.id)
              .eq('campaign_id', campanha.id)
              .eq('status', 'pendente');

            if (execucoesError) {
              console.error(`❌ Erro ao verificar execuções pendentes:`, execucoesError);
              continue;
            }

            if (execucoesPendentes && execucoesPendentes.length > 0) {
              console.log(`⏸️ Lead ${lead.id} já possui execução pendente`);
              continue;
            }

            // Verificar qual sequência aplicar
            // Por enquanto, começar sempre com sequência 1
            // TODO: Implementar lógica para sequências subsequentes
            const templateSequencia1 = campanha.templates?.find(t => t.sequencia === 1 && t.ativo);

            if (!templateSequencia1) {
              console.log(`⚠️ Campanha ${campanha.nome} não possui template ativo para sequência 1`);
              continue;
            }

            // Criar execução
            const dataAgendada = new Date();
            
            const { data: execucao, error: execucaoError } = await supabase
              .from('follow_up_execucoes')
              .insert({
                lead_id: lead.id,
                campaign_id: campanha.id,
                template_id: templateSequencia1.id,
                tipo_execucao: 'automatico',
                status: 'pendente',
                data_agendada: dataAgendada.toISOString(),
              })
              .select()
              .single();

            if (execucaoError) {
              console.error(`❌ Erro ao criar execução:`, execucaoError);
              result.erros.push(`Erro ao criar execução: ${execucaoError.message}`);
              continue;
            }

            console.log(`✅ Execução criada: ${execucao.id} para lead ${lead.id}`);
            result.execucoes_criadas++;

            // Enviar webhook imediatamente
            try {
              const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/send-followup-webhook`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({ execution_id: execucao.id }),
              });

              if (webhookResponse.ok) {
                console.log(`📤 Webhook enviado para execução ${execucao.id}`);
                result.execucoes_enviadas++;
              } else {
                const errorText = await webhookResponse.text();
                console.error(`❌ Erro no webhook para execução ${execucao.id}:`, errorText);
                result.erros.push(`Webhook falhou para execução ${execucao.id}: ${errorText}`);
              }
            } catch (webhookError) {
              console.error(`❌ Erro ao enviar webhook:`, webhookError);
              result.erros.push(`Erro de webhook: ${webhookError.message}`);
            }

          } catch (leadError) {
            console.error(`❌ Erro ao processar lead ${lead.id}:`, leadError);
            result.erros.push(`Erro no lead ${lead.id}: ${leadError.message}`);
          }
        }

      } catch (campanhaError) {
        console.error(`❌ Erro ao processar campanha ${campanha.nome}:`, campanhaError);
        result.erros.push(`Erro na campanha ${campanha.nome}: ${campanhaError.message}`);
      }
    }

    console.log('✅ Processamento de campanhas concluído:', result);

    return new Response(JSON.stringify({
      success: true,
      message: 'Processamento concluído',
      result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro geral no processamento:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro no processamento',
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
