
import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardCharts } from './DashboardCharts';
import { DashboardInsights } from './DashboardInsights';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useLeads } from '@/hooks/useSupabaseLeads';
import { ResponseTimeCard } from './ResponseTimeCard';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

/**
 * Componente principal do Dashboard
 * 
 * Exibe métricas e indicadores dinâmicos da clínica:
 * - Filtro de período configurável
 * - Cartões com métricas baseadas em dados reais do Supabase
 * - Gráficos de performance e conversão com melhor visualização
 * - Performance de anúncios específicos por ad_name com rolagem
 * - Insights automáticos baseados nos dados
 * 
 * Os dados são buscados do Supabase através do hook useDashboardData
 * e filtrados pelo período selecionado pelo usuário.
 */

export const Dashboard = () => {
  const [startDate, setStartDate] = useState<Date | null>(() => startOfDay(startOfMonth(new Date())));
  const [endDate, setEndDate] = useState<Date | null>(() => endOfDay(endOfMonth(new Date())));
  const [currentFilter, setCurrentFilter] = useState('Este Mês');

  const { data: dashboardData, isLoading, error } = useDashboardData(startDate, endDate);
  const { data: rawLeads = [] } = useLeads();

  const handleFilterChange = (newStartDate: Date | null, newEndDate: Date | null, filterName: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setCurrentFilter(filterName);
  };

  // Filtrar leads brutos pelo período selecionado
  const filteredRawLeads = rawLeads.filter(lead => {
    if (!lead.created_at) return false;
    const leadDate = new Date(lead.created_at);
    
    let withinRange = true;
    if (startDate) withinRange = withinRange && leadDate >= startDate;
    if (endDate) withinRange = withinRange && leadDate <= endDate;
    
    return withinRange;
  });

  // Mostrar loading se ainda estiver carregando
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Carregando métricas da sua clínica...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mostrar erro se houver falha no carregamento
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-red-600 mt-1">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da página com o filtro de período */}
      <DashboardHeader 
        onFilterChange={handleFilterChange}
        currentFilter={currentFilter}
      />

      {/* Grid de cartões de métricas com ResponseTime */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Métricas principais */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <DashboardMetrics dashboardData={dashboardData} />
        </div>
        
        {/* Card de Tempo de Resposta */}
        {dashboardData?.tempoMedioResposta && (
          <div className="col-span-1">
            <ResponseTimeCard 
              tempoMedioResposta={dashboardData.tempoMedioResposta}
            />
          </div>
        )}
      </div>
      {/* Seção de gráficos */}
      <DashboardCharts 
        dashboardData={dashboardData}
        filteredRawLeads={filteredRawLeads}
      />

      {/* Seção de insights e alertas */}
      <DashboardInsights dashboardData={dashboardData} />
    </div>
  );
};
