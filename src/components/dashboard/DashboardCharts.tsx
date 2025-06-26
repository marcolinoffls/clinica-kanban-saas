
import { ChartCard } from './ChartCard';
import { AdPerformanceCard } from './AdPerformanceCard';
import { LeadSourceChartCard } from './LeadSourceChartCard';
import { TrendingUp } from 'lucide-react';
import { DashboardMetrics } from '@/hooks/dashboard/types';

/**
 * Componente da seção de gráficos do Dashboard
 * 
 * O que faz:
 * - Renderiza os gráficos de leads e conversões
 * - Exibe a performance de anúncios
 * - Mostra gráfico de origens dos leads
 * - Inclui espaço reservado para futuras métricas
 * 
 * Onde é usado:
 * - Componente Dashboard principal
 * 
 * Como se conecta:
 * - Recebe dados processados do Supabase via props
 * - Passa dados brutos filtrados para os gráficos
 */

interface DashboardChartsProps {
  dashboardData: DashboardMetrics | null;
  filteredRawLeads: any[];
}

export const DashboardCharts = ({ dashboardData, filteredRawLeads }: DashboardChartsProps) => {
  return (
    <>
      {/* Grid de gráficos - Reorganizado para dar mais espaço ao gráfico de leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de leads ocupando 2 colunas para mais espaço */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Leads por Período"
            description="Evolução dos leads recebidos no período selecionado"
            type="line"
            data={dashboardData?.leadsParaGrafico || []}
            showFilter={true}
            rawLeadsData={filteredRawLeads}
          />
        </div>
        
        {/* Performance de anúncios */}
        <div className="lg:col-span-1">
          <AdPerformanceCard
            data={dashboardData?.leadsPorAnuncio || []}
          />
        </div>
      </div>

      {/* Segunda linha de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Conversões por Categoria"
          description="Conversões por tipo de procedimento no período"
          type="bar"
          data={dashboardData?.conversoesPorCategoria || []}
        />
        
        {/* Novo gráfico de origens dos leads */}
        <LeadSourceChartCard
          rawLeadsData={filteredRawLeads}
        />
      </div>
    </>
  );
};
