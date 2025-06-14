
/**
 * O que aquilo faz: Define a estrutura de tipos para os dados do dashboard.
 * Onde ele é usado no app: Usado pelo hook `useDashboardData` e pelo `dashboardService` para garantir a consistência dos dados.
 * Como ele se conecta com outras partes: Exporta a interface `DashboardMetrics` que modela os dados retornados pela API e consumidos pelos componentes do dashboard.
 */
export interface DashboardMetrics {
  totalContatos: number;
  consultasAgendadas: number;
  /**
   * NOVO CAMPO: Contagem de consultas com status 'realizado' ou 'pago'.
   * Usado para exibir o novo card de "Consultas Realizadas".
   */
  consultasRealizadas: number;
  taxaConversao: number;
  faturamentoRealizado: number;
  /**
   * NOVO CAMPO: Contagem de leads que vieram de anúncios.
   * Usado para exibir o novo card de "Leads de Anúncios".
   */
  leadsAnuncios: number;
  leadsParaGrafico: Array<{ label: string; leads: number }>;
  conversoesPorCategoria: Array<{ category: string; conversions: number }>;
  variacaoContatos: number;
  variacaoConsultas: number;
  /**
   * NOVO CAMPO: Variação percentual para as consultas realizadas.
   */
  variacaoConsultasRealizadas: number;
  variacaoConversao: number;
  variacaoFaturamento: number;
  /**
   * NOVO CAMPO: Variação percentual para os leads de anúncios.
   */
  variacaoLeadsAnuncios: number;
}
