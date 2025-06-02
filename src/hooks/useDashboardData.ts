
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import { format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Hook para buscar dados dinâmicos do dashboard
 * 
 * Busca dados agregados do Supabase para exibir métricas da clínica:
 * - Total de contatos/leads no período
 * - Consultas agendadas
 * - Taxa de conversão
 * - Faturamento estimado/realizado
 * - Dados para gráficos (leads por mês, conversões por categoria)
 * 
 * @param startDate Data de início do período
 * @param endDate Data de fim do período
 * @returns Dados processados e estado de carregamento
 */

interface DashboardMetrics {
  totalContatos: number;
  consultasAgendadas: number;
  taxaConversao: number;
  faturamentoRealizado: number;
  leadsPorMes: Array<{ month: string; leads: number }>;
  conversoesPorCategoria: Array<{ category: string; conversions: number }>;
  // Dados para calcular variações (comparar com período anterior)
  variacaoContatos: number;
  variacaoConsultas: number;
  variacaoConversao: number;
  variacaoFaturamento: number;
}

export const useDashboardData = (startDate: Date, endDate: Date) => {
  const { clinicaId } = useClinica();

  const { data, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboardData', clinicaId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      try {
        // 1. Buscar total de contatos/leads no período
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, created_at, convertido, servico_interesse')
          .eq('clinica_id', clinicaId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (leadsError) {
          console.error('Erro ao buscar leads:', leadsError.message);
          throw new Error('Falha ao carregar dados de leads');
        }

        // 2. Buscar consultas agendadas no período
        const { data: agendamentosData, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id, status, valor, data_inicio, titulo, created_at')
          .eq('clinica_id', clinicaId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (agendamentosError) {
          console.error('Erro ao buscar agendamentos:', agendamentosError.message);
          throw new Error('Falha ao carregar dados de agendamentos');
        }

        // 3. Processar dados para métricas
        const totalContatos = leadsData?.length || 0;
        
        // Consultas agendadas (status AGENDADO ou CONFIRMADO)
        const consultasAgendadas = agendamentosData?.filter(ag => 
          ag.status === 'agendado' || ag.status === 'confirmado'
        ).length || 0;

        // Leads convertidos (com agendamentos realizados/pagos ou marcados como convertidos)
        const agendamentosRealizados = agendamentosData?.filter(ag => 
          ag.status === 'realizado' || ag.status === 'pago'
        ).length || 0;
        
        const leadsConvertidos = (leadsData?.filter(lead => lead.convertido).length || 0) + agendamentosRealizados;
        
        // Taxa de conversão
        const taxaConversao = totalContatos > 0 ? (leadsConvertidos / totalContatos) * 100 : 0;

        // Faturamento realizado (soma dos valores pagos/realizados)
        const faturamentoRealizado = agendamentosData
          ?.filter(ag => ag.status === 'realizado' || ag.status === 'pago')
          .reduce((total, ag) => total + (Number(ag.valor) || 0), 0) || 0;

        // 4. Dados para gráfico de linha - Leads por mês
        const leadsPorMes = processarLeadsPorMes(leadsData || [], startDate, endDate);

        // 5. Dados para gráfico de barras - Conversões por categoria/serviço
        const conversoesPorCategoria = processarConversoesPorCategoria(
          leadsData || [], 
          agendamentosData || []
        );

        // 6. Cálculo de variações (simplificado por enquanto - pode ser melhorado futuramente)
        // Por enquanto, retornamos valores positivos fixos como placeholder
        const variacaoContatos = 5; // +5%
        const variacaoConsultas = 8; // +8%
        const variacaoConversao = 3; // +3%
        const variacaoFaturamento = 12; // +12%

        return {
          totalContatos,
          consultasAgendadas,
          taxaConversao: Math.round(taxaConversao),
          faturamentoRealizado,
          leadsPorMes,
          conversoesPorCategoria,
          variacaoContatos,
          variacaoConsultas,
          variacaoConversao,
          variacaoFaturamento
        };

      } catch (error: any) {
        console.error('Erro ao buscar dados do dashboard:', error.message);
        throw error;
      }
    },
    enabled: !!clinicaId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  return {
    data: data || null,
    isLoading,
    error
  };
};

/**
 * Processa dados de leads para o gráfico de linha (leads por mês)
 */
function processarLeadsPorMes(leads: any[], startDate: Date, endDate: Date) {
  const monthsMap = new Map<string, number>();
  
  leads.forEach(lead => {
    const leadDate = new Date(lead.created_at);
    if (isWithinInterval(leadDate, { start: startDate, end: endDate })) {
      const monthKey = format(leadDate, 'MMM', { locale: ptBR });
      monthsMap.set(monthKey, (monthsMap.get(monthKey) || 0) + 1);
    }
  });

  // Converter para array no formato esperado pelo recharts
  return Array.from(monthsMap.entries()).map(([month, leads]) => ({
    month,
    leads
  }));
}

/**
 * Processa dados de conversões por categoria/serviço para o gráfico de barras
 */
function processarConversoesPorCategoria(leads: any[], agendamentos: any[]) {
  const categoriesMap = new Map<string, number>();
  
  // Contar agendamentos realizados/pagos por serviço
  agendamentos
    .filter(ag => ag.status === 'realizado' || ag.status === 'pago')
    .forEach(ag => {
      const categoria = ag.titulo || 'Outros';
      categoriesMap.set(categoria, (categoriesMap.get(categoria) || 0) + 1);
    });

  // Adicionar leads convertidos por serviço de interesse
  leads
    .filter(lead => lead.convertido && lead.servico_interesse)
    .forEach(lead => {
      const categoria = lead.servico_interesse || 'Outros';
      categoriesMap.set(categoria, (categoriesMap.get(categoria) || 0) + 1);
    });

  // Converter para array no formato esperado pelo recharts (limitado a top 5)
  return Array.from(categoriesMap.entries())
    .map(([category, conversions]) => ({
      category,
      conversions
    }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 5);
}
