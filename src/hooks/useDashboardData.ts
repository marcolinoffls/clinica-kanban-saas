import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import { format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Hook para buscar dados dinâmicos do dashboard.
 * A assinatura da função foi alterada para aceitar `Date | null` para
 * as datas de início e fim, permitindo que o filtro "Máximo" funcione.
 * 
 * @param startDate Data de início do período (ou null)
 * @param endDate Data de fim do período (ou null)
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

export const useDashboardData = (startDate: Date | null, endDate: Date | null) => {
  const { clinicaId } = useClinica();

  // A queryKey foi ajustada para lidar com datas nulas, garantindo que a busca
  // seja refeita corretamente quando o filtro de data é alterado.
  const { data, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboardData', clinicaId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      try {
        // 1. Buscar total de contatos/leads no período
        // A consulta ao Supabase agora é construída de forma condicional.
        // O filtro de data só é adicionado se startDate e endDate forem fornecidos.
        let leadsQuery = supabase
          .from('leads')
          .select('id, created_at, convertido, servico_interesse')
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
        // A mesma lógica de filtro condicional é aplicada aqui.
        let agendamentosQuery = supabase
          .from('agendamentos')
          .select('id, status, valor, data_inicio, titulo, created_at')
          .eq('clinica_id', clinicaId);

        if (startDate) {
          agendamentosQuery = agendamentosQuery.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          agendamentosQuery = agendamentosQuery.lte('created_at', endDate.toISOString());
        }
        
        const { data: agendamentosData, error: agendamentosError } = await agendamentosQuery;

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
        // A função `processarLeadsPorMes` agora recebe os leads já filtrados pela data.
        const leadsPorMes = processarLeadsPorMes(leadsData || []);

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
 * Processa dados de leads para o gráfico de linha (leads por mês).
 * A função foi simplificada. Como os dados já vêm pré-filtrados pela data
 * da consulta ao Supabase, não é mais necessário verificar o intervalo aqui.
 */
function processarLeadsPorMes(leads: any[]) {
  const monthsMap = new Map<string, number>();
  
  leads.forEach(lead => {
    const leadDate = new Date(lead.created_at);
    const monthKey = format(leadDate, 'MMM', { locale: ptBR });
    monthsMap.set(monthKey, (monthsMap.get(monthKey) || 0) + 1);
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
