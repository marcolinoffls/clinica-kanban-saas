
/**
 * O que aquilo faz: Define a estrutura de tipos para os dados do dashboard.
 * Onde ele é usado no app: Usado pelo hook `useDashboardData` e pelo `dashboardService` para garantir a consistência dos dados.
 * Como ele se conecta com outras partes: Exporta a interface `DashboardMetrics` que modela os dados retornados pela API e consumidos pelos componentes do dashboard.
 */
export interface DashboardMetrics {
  totalContatos: number;
  consultasAgendadas: number;
  taxaConversao: number;
  faturamentoRealizado: number;
  leadsParaGrafico: Array<{ label: string; leads: number }>;
  conversoesPorCategoria: Array<{ category: string; conversions: number }>;
  variacaoContatos: number;
  variacaoConsultas: number;
  variacaoConversao: number;
  variacaoFaturamento: number;
}
