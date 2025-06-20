
/**
 * O que aquilo faz: Centraliza a lógica de busca e processamento dos dados do dashboard.
 * Onde ele é usado no app: É chamado pelo hook `useDashboardData` para obter todas as métricas necessárias para a página do dashboard.
 * Como ele se conecta com outras partes: 
 * - Interage com o Supabase para buscar dados das tabelas `leads`, `agendamentos` e `chat_mensagens`.
 * - Utiliza as funções de `dashboardUtils` para formatar os dados para os gráficos.
 * - Retorna um objeto `DashboardMetrics` que é usado para popular a UI do dashboard.
 * 
 * Se o código interage com o Supabase, explique também o que ele busca ou grava na tabela e quais campos são afetados.
 * - Busca na tabela `leads`: id, created_at, convertido, servico_interesse, anuncio, ad_name.
 * - Busca na tabela `agendamentos`: id, status, valor, data_inicio, titulo, created_at.
 * - Busca na tabela `chat_mensagens`: id, lead_id, clinica_id, conteudo, enviado_por, created_at.
 * - Busca na tabela `clinicas`: horario_funcionamento, ai_business_hours_start_weekday, ai_business_hours_end_weekday, ai_active_saturday, etc.
 * - Os filtros de data (`startDate`, `endDate`) são aplicados na coluna `created_at` de `leads`, `data_inicio` de `agendamentos` e `created_at` de `chat_mensagens`.
 */
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics } from '@/hooks/dashboard/types';
import { processarLeadsParaGrafico, processarConversoesPorCategoria, processarLeadsPorAnuncio } from '@/utils/dashboardUtils';
import { calculateResponseTime, BusinessHours, ChatMessage } from '@/utils/responseTimeUtils';

export const fetchDashboardData = async (
  clinicaId: string, 
  startDate: Date | null, 
  endDate: Date | null
): Promise<DashboardMetrics> => {
  try {
    // 1. Buscar total de contatos/leads no período
    let leadsQuery = supabase
      .from('leads')
      .select('id, created_at, convertido, servico_interesse, anuncio, ad_name')
      .eq('clinica_id', clinicaId);

    if (startDate) {
      leadsQuery = leadsQuery.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      leadsQuery = leadsQuery.lte('created_at', endDate.toISOString());
    }

    const { data: leadsData, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error('Erro ao buscar leads:', leadsError.message);
      throw new Error('Falha ao carregar dados de leads');
    }

    // 2. Buscar agendamentos no período
    let agendamentosQuery = supabase
      .from('agendamentos')
      .select('id, status, valor, data_inicio, titulo, created_at')
      .eq('clinica_id', clinicaId);

    if (startDate) {
      agendamentosQuery = agendamentosQuery.gte('data_inicio', startDate.toISOString());
    }
    if (endDate) {
      agendamentosQuery = agendamentosQuery.lte('data_inicio', endDate.toISOString());
    }
    
    const { data: agendamentosData, error: agendamentosError } = await agendamentosQuery;

    if (agendamentosError) {
      console.error('Erro ao buscar agendamentos:', agendamentosError.message);
      throw new Error('Falha ao carregar dados de agendamentos');
    }

    // 3. Buscar mensagens de chat para cálculo de tempo médio de resposta
    let chatQuery = supabase
      .from('chat_mensagens')
      .select('id, lead_id, clinica_id, conteudo, enviado_por, created_at')
      .eq('clinica_id', clinicaId);

    if (startDate) {
      chatQuery = chatQuery.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      chatQuery = chatQuery.lte('created_at', endDate.toISOString());
    }

    const { data: chatData, error: chatError } = await chatQuery;

    if (chatError) {
      console.error('Erro ao buscar mensagens de chat:', chatError.message);
      throw new Error('Falha ao carregar dados de chat');
    }

    // 4. Buscar configurações de horário comercial da clínica
    const { data: clinicaData, error: clinicaError } = await supabase
      .from('clinicas')
      .select(`
        ai_business_hours_start_weekday,
        ai_business_hours_end_weekday,
        ai_active_saturday,
        ai_saturday_hours_start,
        ai_saturday_hours_end,
        ai_active_sunday,
        ai_sunday_hours_start,
        ai_sunday_hours_end
      `)
      .eq('id', clinicaId)
      .single();

    if (clinicaError) {
      console.error('Erro ao buscar configurações da clínica:', clinicaError.message);
      throw new Error('Falha ao carregar configurações da clínica');
    }

    // 5. Processar dados para métricas básicas
    const totalContatos = leadsData?.length || 0;
    
    // Contabiliza leads que possuem o campo 'anuncio' preenchido (método antigo)
    const leadsAnuncios = leadsData?.filter(lead => lead.anuncio).length || 0;

    // NOVA MÉTRICA: Contabiliza leads que vieram de anúncios específicos (ad_name)
    const leadsComAdName = leadsData?.filter(lead => lead.ad_name && lead.ad_name.trim() !== '').length || 0;

    const consultasAgendadas = agendamentosData?.filter(ag => 
      ag.status === 'agendado' || ag.status === 'confirmado'
    ).length || 0;

    const agendamentosRealizados = agendamentosData?.filter(ag => 
      ag.status === 'realizado' || ag.status === 'pago'
    ).length || 0;
    
    const leadsConvertidos = (leadsData?.filter(lead => lead.convertido).length || 0) + agendamentosRealizados;
    
    const taxaConversao = totalContatos > 0 ? (leadsConvertidos / totalContatos) * 100 : 0;

    const faturamentoRealizado = agendamentosData
      ?.filter(ag => ag.status === 'realizado' || ag.status === 'pago')
      .reduce((total, ag) => total + (Number(ag.valor) || 0), 0) || 0;

    // 6. Dados para gráficos
    const leadsParaGrafico = processarLeadsParaGrafico(
      leadsData || [],
      startDate,
      endDate
    );

    const conversoesPorCategoria = processarConversoesPorCategoria(
      leadsData || [], 
      agendamentosData || []
    );

    const leadsPorAnuncio = processarLeadsPorAnuncio(leadsData || []);

    // 7. NOVO: Calcular tempo médio de resposta
    const businessHours: BusinessHours = {
      weekdayStart: clinicaData?.ai_business_hours_start_weekday || '08:00',
      weekdayEnd: clinicaData?.ai_business_hours_end_weekday || '18:00',
      saturdayActive: clinicaData?.ai_active_saturday || false,
      saturdayStart: clinicaData?.ai_saturday_hours_start || undefined,
      saturdayEnd: clinicaData?.ai_saturday_hours_end || undefined,
      sundayActive: clinicaData?.ai_active_sunday || false,
      sundayStart: clinicaData?.ai_sunday_hours_start || undefined,
      sundayEnd: clinicaData?.ai_sunday_hours_end || undefined,
    };

    // Mapear mensagens de chat para o formato esperado pelas funções utilitárias
    const chatMessages: ChatMessage[] = (chatData || []).map(msg => ({
      id: msg.id,
      lead_id: msg.lead_id,
      clinica_id: msg.clinica_id,
      conteudo: msg.conteudo,
      enviado_por: msg.enviado_por as 'lead' | 'usuario' | 'ia',
      created_at: msg.created_at,
    }));

    // Calcular tempo médio geral
    const responseTimeData = calculateResponseTime(chatMessages, businessHours, {
      includeHuman: true,
      includeAI: true,
      businessHoursOnly: false
    });

    // Calcular tempo médio apenas para respostas humanas
    const humanResponseTimeData = calculateResponseTime(chatMessages, businessHours, {
      includeHuman: true,
      includeAI: false,
      businessHoursOnly: false
    });

    // Calcular tempo médio apenas para respostas da IA
    const aiResponseTimeData = calculateResponseTime(chatMessages, businessHours, {
      includeHuman: false,
      includeAI: true,
      businessHoursOnly: false
    });

    // Calcular tempo médio durante horário comercial
    const businessHoursResponseTimeData = calculateResponseTime(chatMessages, businessHours, {
      includeHuman: true,
      includeAI: true,
      businessHoursOnly: true
    });

    // Montar objeto de tempo médio de resposta
    const tempoMedioResposta = {
      tempoMedioMinutos: responseTimeData.tempoMedioMinutos,
      tempoMedioFormatado: responseTimeData.tempoMedioFormatado,
      classificacao: responseTimeData.classificacao,
      detalhes: {
        tempoMedioHumano: humanResponseTimeData.tempoMedioMinutos,
        tempoMedioHumanoFormatado: humanResponseTimeData.tempoMedioFormatado,
        tempoMedioIA: aiResponseTimeData.tempoMedioMinutos,
        tempoMedioIAFormatado: aiResponseTimeData.tempoMedioFormatado,
        tempoMedioComercial: businessHoursResponseTimeData.tempoMedioMinutos,
        tempoMedioComercialFormatado: businessHoursResponseTimeData.tempoMedioFormatado,
        distribuicao: responseTimeData.detalhes.distribuicao,
      },
      variacao: 0, // Placeholder - seria calculado comparando com período anterior
    };

    // 8. Cálculo de variações (placeholder)
    const variacaoContatos = 5;
    const variacaoConsultas = 8;
    const variacaoConsultasRealizadas = 4;
    const variacaoConversao = 3;
    const variacaoFaturamento = 12;
    const variacaoLeadsAnuncios = 9;
    const variacaoLeadsAdName = 15; // NOVA variação para leads com ad_name

    return {
      totalContatos,
      leadsAnuncios,
      leadsComAdName, // NOVA métrica
      consultasAgendadas,
      consultasRealizadas: agendamentosRealizados,
      taxaConversao: Math.round(taxaConversao),
      faturamentoRealizado,
      leadsParaGrafico,
      conversoesPorCategoria,
      leadsPorAnuncio, // NOVO dados para gráfico de anúncios
      tempoMedioResposta, // NOVA métrica de tempo médio de resposta
      variacaoContatos,
      variacaoConsultas,
      variacaoConsultasRealizadas,
      variacaoConversao,
      variacaoFaturamento,
      variacaoLeadsAnuncios,
      variacaoLeadsAdName // NOVA variação
    };

  } catch (error: any) {
    console.error('Erro ao buscar dados do dashboard:', error.message);
    throw error;
  }
};
