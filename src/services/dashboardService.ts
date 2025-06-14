/**
 * O que aquilo faz: Centraliza a lógica de busca e processamento dos dados do dashboard.
 * Onde ele é usado no app: É chamado pelo hook `useDashboardData` para obter todas as métricas necessárias para a página do dashboard.
 * Como ele se conecta com outras partes: 
 * - Interage com o Supabase para buscar dados das tabelas `leads` e `agendamentos`.
 * - Utiliza as funções de `dashboardUtils` para formatar os dados para os gráficos.
 * - Retorna um objeto `DashboardMetrics` que é usado para popular a UI do dashboard.
 * 
 * Se o código interage com o Supabase, explique também o que ele busca ou grava na tabela e quais campos são afetados.
 * - Busca na tabela `leads`: id, created_at, convertido, servico_interesse, anuncio.
 * - Busca na tabela `agendamentos`: id, status, valor, data_inicio, titulo, created_at.
 * - Os filtros de data (`startDate`, `endDate`) são aplicados na coluna `created_at` de `leads` e `data_inicio` de `agendamentos`.
 */
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics } from '@/hooks/dashboard/types';
import { processarLeadsParaGrafico, processarConversoesPorCategoria } from '@/utils/dashboardUtils';

export const fetchDashboardData = async (
  clinicaId: string, 
  startDate: Date | null, 
  endDate: Date | null
): Promise<DashboardMetrics> => {
  try {
    // 1. Buscar total de contatos/leads no período
    let leadsQuery = supabase
      .from('leads')
      .select('id, created_at, convertido, servico_interesse, anuncio')
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

    // ALTERAÇÃO: A busca de agendamentos agora usa a data de início da consulta (data_inicio)
    // ao invés da data de criação (created_at), para refletir o período de análise corretamente.
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

    // 3. Processar dados para métricas
    const totalContatos = leadsData?.length || 0;
    
    // NOVO CÁLCULO: Conta os leads que possuem o campo 'anuncio' preenchido.
    // Este cálculo agora funciona pois o campo 'anuncio' foi incluído na busca.
    const leadsAnuncios = leadsData?.filter(lead => lead.anuncio).length || 0;

    const consultasAgendadas = agendamentosData?.filter(ag => 
      ag.status === 'agendado' || ag.status === 'confirmado'
    ).length || 0;

    // O cálculo de agendamentos realizados já existia, agora será retornado.
    const agendamentosRealizados = agendamentosData?.filter(ag => 
      ag.status === 'realizado' || ag.status === 'pago'
    ).length || 0;
    
    const leadsConvertidos = (leadsData?.filter(lead => lead.convertido).length || 0) + agendamentosRealizados;
    
    const taxaConversao = totalContatos > 0 ? (leadsConvertidos / totalContatos) * 100 : 0;

    const faturamentoRealizado = agendamentosData
      ?.filter(ag => ag.status === 'realizado' || ag.status === 'pago')
      .reduce((total, ag) => total + (Number(ag.valor) || 0), 0) || 0;

    // 4. Dados para gráfico de linha
    const leadsParaGrafico = processarLeadsParaGrafico(
      leadsData || [],
      startDate,
      endDate
    );

    // 5. Dados para gráfico de barras
    const conversoesPorCategoria = processarConversoesPorCategoria(
      leadsData || [], 
      agendamentosData || []
    );

    // 6. Cálculo de variações (placeholder)
    const variacaoContatos = 5;
    const variacaoConsultas = 8;
    const variacaoConsultasRealizadas = 4; // Placeholder para nova métrica
    const variacaoConversao = 3;
    const variacaoFaturamento = 12;
    const variacaoLeadsAnuncios = 9; // Placeholder para nova métrica

    return {
      totalContatos,
      leadsAnuncios, // Nova métrica retornada
      consultasAgendadas,
      consultasRealizadas: agendamentosRealizados, // Nova métrica retornada
      taxaConversao: Math.round(taxaConversao),
      faturamentoRealizado,
      leadsParaGrafico,
      conversoesPorCategoria,
      variacaoContatos,
      variacaoConsultas,
      variacaoConsultasRealizadas, // Nova variação retornada
      variacaoConversao,
      variacaoFaturamento,
      variacaoLeadsAnuncios // Nova variação retornada
    };

  } catch (error: any) {
    console.error('Erro ao buscar dados do dashboard:', error.message);
    throw error;
  }
};
