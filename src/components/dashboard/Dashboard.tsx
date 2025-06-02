
import { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { ChartCard } from './ChartCard';
import { DashboardTimeRangeFilter } from './DashboardTimeRangeFilter';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Users, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Componente principal do Dashboard
 * 
 * Exibe métricas e indicadores dinâmicos da clínica:
 * - Filtro de período configurável
 * - Cartões com métricas baseadas em dados reais do Supabase
 * - Gráficos de performance e conversão
 * - Insights automáticos baseados nos dados
 * 
 * Os dados são buscados do Supabase através do hook useDashboardData
 * e filtrados pelo período selecionado pelo usuário.
 */

export const Dashboard = () => {
  // Estado do filtro de período (padrão: este mês)
  const [startDate, setStartDate] = useState(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(() => endOfMonth(new Date()));
  const [currentFilter, setCurrentFilter] = useState('Este Mês');

  // Buscar dados do dashboard baseados no período selecionado
  const { data: dashboardData, isLoading, error } = useDashboardData(startDate, endDate);

  // Função para atualizar o período selecionado
  const handleFilterChange = (newStartDate: Date, newEndDate: Date, filterName: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setCurrentFilter(filterName);
  };

  // Mostrar loading se ainda estiver carregando
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Carregando métricas da sua clínica...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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

  // Preparar dados das métricas com base nos dados carregados
  const metrics = dashboardData ? [
    {
      title: 'Total de Contatos',
      value: dashboardData.totalContatos.toString(),
      change: `+${dashboardData.variacaoContatos}%`,
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Consultas Agendadas',
      value: dashboardData.consultasAgendadas.toString(),
      change: `+${dashboardData.variacaoConsultas}%`,
      changeType: 'positive' as const,
      icon: Calendar
    },
    {
      title: 'Taxa de Conversão',
      value: `${dashboardData.taxaConversao}%`,
      change: `+${dashboardData.variacaoConversao}%`,
      changeType: 'positive' as const,
      icon: TrendingUp
    },
    {
      title: 'Faturamento Realizado',
      value: `R$ ${dashboardData.faturamentoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: `+${dashboardData.variacaoFaturamento}%`,
      changeType: 'positive' as const,
      icon: DollarSign
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Visão geral das métricas da sua clínica
        </p>
      </div>

      {/* Filtro de período */}
      <DashboardTimeRangeFilter
        onFilterChange={handleFilterChange}
        currentFilter={currentFilter}
      />

      {/* Grid de cartões de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Leads por Período"
          description="Evolução dos leads recebidos no período selecionado"
          type="line"
          data={dashboardData?.leadsPorMes || []}
        />
        <ChartCard
          title="Conversões por Categoria"
          description="Conversões por tipo de procedimento no período"
          type="bar"
          data={dashboardData?.conversoesPorCategoria || []}
        />
      </div>

      {/* Seção de insights e alertas */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Insights e Alertas
        </h3>
        
        <div className="space-y-3">
          {dashboardData && dashboardData.totalContatos > 0 ? (
            <>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Atividade registrada no período!
                  </p>
                  <p className="text-sm text-green-700">
                    Você teve {dashboardData.totalContatos} novos contatos no período selecionado.
                  </p>
                </div>
              </div>
              
              {dashboardData.taxaConversao > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Taxa de conversão
                    </p>
                    <p className="text-sm text-blue-700">
                      Sua taxa de conversão no período foi de {dashboardData.taxaConversao}%.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Nenhuma atividade no período
                </p>
                <p className="text-sm text-gray-500">
                  Não foram encontrados dados para o período selecionado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
