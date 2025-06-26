
import { ChartCard } from './ChartCard';
import { AdPerformanceCard } from './AdPerformanceCard';
import { TrendingUp } from 'lucide-react';
import { DashboardMetrics } from '@/hooks/dashboard/types';

/**
 * Componente da seção de gráficos do Dashboard
 * 
 * O que faz:
 * - Renderiza os gráficos de leads e conversões
 * - Exibe a performance de anúncios
 * - Inclui espaço reservado para futuras métricas
 * 
 * Onde é usado:
 * - Componente Dashboard principal
 * 
 * Como se conecta:
 * - Recebe dados processados do Supabase via props
 * - Passa dados brutos filtrados para o gráfico de leads
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
        
        {/* Espaço para futuro gráfico ou card adicional */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Espaço reservado para futuras métricas</p>
          </div>
        </div>
      </div>
    </>
  );
};
