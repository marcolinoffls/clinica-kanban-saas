
/**
 * O que aquilo faz: Define a estrutura de tipos para os dados do dashboard.
 * Onde ele é usado no app: Usado pelo hook `useDashboardData` e pelo `dashboardService` para garantir a consistência dos dados.
 * Como ele se conecta com outras partes: Exporta a interface `DashboardMetrics` que modela os dados retornados pela API e consumidos pelos componentes do dashboard.
 */
export interface DashboardMetrics {
  totalContatos: number;
  consultasAgendadas: number;
  consultasRealizadas: number;
  taxaConversao: number;
  faturamentoRealizado: number;
  leadsAnuncios: number;
  /**
   * NOVO CAMPO: Contagem de leads que possuem o campo 'ad_name' preenchido.
   * Usado para exibir o novo card de "Leads de Anúncios Específicos".
   */
  leadsComAdName: number;
  leadsParaGrafico: Array<{ label: string; leads: number }>;
  conversoesPorCategoria: Array<{ category: string; conversions: number }>;
  /**
   * NOVO CAMPO: Dados para gráfico de performance por anúncio específico.
   * Formato: Array de objetos com nome do anúncio e quantidade de leads.
   */
  leadsPorAnuncio: Array<{ anuncio: string; leads: number; conversoes: number }>;
  variacaoContatos: number;
  variacaoConsultas: number;
  variacaoConsultasRealizadas: number;
  variacaoConversao: number;
  variacaoFaturamento: number;
  variacaoLeadsAnuncios: number;
  /**
   * NOVO CAMPO: Variação percentual para os leads com ad_name.
   */
  variacaoLeadsAdName: number;
  
  /**
   * NOVOS CAMPOS: Métricas de tempo médio de resposta
   */
  tempoMedioResposta: {
    // Tempo médio geral em minutos
    tempoMedioMinutos: number;
    // Tempo médio formatado para exibição (ex: "2h 15min")
    tempoMedioFormatado: string;
    // Classificação de performance (excelente, bom, regular, ruim)
    classificacao: 'excelente' | 'bom' | 'regular' | 'ruim';
    // Dados detalhados para análises
    detalhes: {
      // Apenas respostas humanas
      tempoMedioHumano: number;
      tempoMedioHumanoFormatado: string;
      // Apenas respostas da IA
      tempoMedioIA: number;
      tempoMedioIAFormatado: string;
      // Durante horário comercial
      tempoMedioComercial: number;
      tempoMedioComercialFormatado: string;
      // Distribuição por faixas de tempo
      distribuicao: {
        ate30min: number;
        de30mina1h: number;
        de1ha4h: number;
        acimaDe4h: number;
      };
    };
    // Variação em relação ao período anterior
    variacao: number;
  };
}
