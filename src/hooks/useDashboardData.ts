
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
// Adicionando as funções 'differenceInDays', 'eachDayOfInterval' e 'eachMonthOfInterval' do date-fns
import { format, isWithinInterval, differenceInDays, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Hook para buscar dados dinâmicos do dashboard.
 * ... keep existing code
 */

interface DashboardMetrics {
  totalContatos: number;
  consultasAgendadas: number;
  taxaConversao: number;
  faturamentoRealizado: number;
  // O tipo de dado do gráfico foi alterado para ter um 'label' genérico,
  // que pode representar um dia ('dd/MM') ou um mês ('MMM/yy').
  leadsParaGrafico: Array<{ label: string; leads: number }>;
  conversoesPorCategoria: Array<{ category:string; conversions: number }>;
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

        // 4. Dados para gráfico de linha - Leads por período
        // A função de processamento agora recebe as datas para ser dinâmica
        const leadsParaGrafico = processarLeadsParaGrafico(
          leadsData || [],
          startDate,
          endDate
        );

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
          leadsParaGrafico, // Retorna os dados do gráfico com o novo nome e formato
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
 * Processa dados de leads para o gráfico de linha, adaptando-se ao período.
 * - Para períodos de até 31 dias, agrupa os leads por dia.
 * - Para períodos maiores, agrupa por mês.
 * Isso torna o gráfico mais relevante para o filtro de data selecionado.
 * @param leads Array de leads buscados do Supabase.
 * @param startDate Data de início do filtro.
 * @param endDate Data de fim do filtro.
 * @returns Array de dados formatados para o gráfico.
 */
function processarLeadsParaGrafico(leads: any[], startDate: Date | null, endDate: Date | null) {
  // Se não houver leads, retorna um array vazio para evitar erros.
  if (!leads || leads.length === 0) {
    return [];
  }
  
  // Função interna para agrupar por mês, usada no filtro "Máximo" ou em falhas.
  const agruparPorMesPadrao = (dados: any[]) => {
    const contagemMensal = new Map<string, number>();
    
    // Contabiliza os leads por mês usando a chave 'yyyy-MM'
    dados.forEach(lead => {
      const mesChave = format(new Date(lead.created_at), 'yyyy-MM');
      contagemMensal.set(mesChave, (contagemMensal.get(mesChave) || 0) + 1);
    });
    
    // Ordena as chaves (ex: '2023-11', '2023-12') para garantir a ordem cronológica.
    const chavesOrdenadas = Array.from(contagemMensal.keys()).sort();
    
    // Mapeia para o formato final, criando um label legível (ex: 'Nov/23').
    return chavesOrdenadas.map(chave => ({
      label: format(new Date(`${chave}-02`), 'MMM/yy', { locale: ptBR }),
      leads: contagemMensal.get(chave) || 0,
    }));
  };

  // Se não houver intervalo de datas, aplica o agrupamento padrão por mês.
  if (!startDate || !endDate) {
    return agruparPorMesPadrao(leads);
  }

  const duracaoEmDias = differenceInDays(endDate, startDate);

  // Agrupamento por dia (para intervalos curtos, até 31 dias).
  if (duracaoEmDias <= 31) {
    const contagemDiaria = new Map<string, number>();
    const diasDoIntervalo = eachDayOfInterval({ start: startDate, end: endDate });

    // Inicializa todos os dias do intervalo com 0 leads para garantir um gráfico contínuo.
    diasDoIntervalo.forEach(dia => {
      const diaChave = format(dia, 'yyyy-MM-dd');
      contagemDiaria.set(diaChave, 0);
    });

    // Preenche o mapa com a contagem de leads de cada dia.
    leads.forEach(lead => {
      const diaChave = format(new Date(lead.created_at), 'yyyy-MM-dd');
      if (contagemDiaria.has(diaChave)) {
        contagemDiaria.set(diaChave, contagemDiaria.get(diaChave)! + 1);
      }
    });

    // Mapeia para o formato final, com labels ordenadas por data (ex: '25/12').
    return Array.from(contagemDiaria.entries()).sort().map(([chave, contagem]) => ({
      label: format(new Date(chave), 'dd/MM', { locale: ptBR }),
      leads: contagem,
    }));
  }
  
  // Agrupamento por mês (para intervalos longos, maiores que 31 dias).
  const contagemMensal = new Map<string, number>();
  const mesesDoIntervalo = eachMonthOfInterval({ start: startDate, end: endDate });

  // Inicializa todos os meses do intervalo com 0 leads.
  mesesDoIntervalo.forEach(mes => {
    const mesChave = format(mes, 'yyyy-MM');
    contagemMensal.set(mesChave, 0);
  });

  // Preenche o mapa com a contagem de leads de cada mês.
  leads.forEach(lead => {
    const mesChave = format(new Date(lead.created_at), 'yyyy-MM');
    if (contagemMensal.has(mesChave)) {
      contagemMensal.set(mesChave, contagemMensal.get(mesChave)! + 1);
    }
  });

  // Mapeia para o formato final, com labels ordenadas por data (ex: 'Dez/23').
  return Array.from(contagemMensal.entries()).sort().map(([chave, contagem]) => ({
    label: format(new Date(`${chave}-02`), 'MMM/yy', { locale: ptBR }),
    leads: contagem,
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
