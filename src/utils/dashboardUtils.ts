
/**
 * O que aquilo faz: Fornece funções utilitárias para processar e formatar dados brutos para os gráficos do dashboard.
 * Onde ele é usado no app: Utilizado pelo `dashboardService` para transformar os dados de leads e agendamentos em um formato consumível pelos componentes de gráfico (Recharts).
 * Como ele se conecta com outras partes: Recebe dados brutos (leads, agendamentos) e retorna arrays estruturados para os gráficos. Não possui dependências diretas de hooks ou contextos.
 */
import { format, differenceInDays, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
export function processarLeadsParaGrafico(leads: any[], startDate: Date | null, endDate: Date | null) {
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
    
    // Ordena as chaves (ex: '2023-11', '2023-12') para garantir la ordem cronológica.
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
export function processarConversoesPorCategoria(leads: any[], agendamentos: any[]) {
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
