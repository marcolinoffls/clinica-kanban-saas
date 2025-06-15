
import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { ChartCard } from './ChartCard';
import { AdPerformanceCard } from './AdPerformanceCard';
import { TimeRangeFilter } from '@/components/admin/TimeRangeFilter';
import { useDashboardData } from '@/hooks/useDashboardData';
// Ícones atualizados: removido Target, mantidos os outros
import { Users, Calendar, TrendingUp, DollarSign, CheckCircle, Megaphone } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

/**
 * Componente principal do Dashboard
 * 
 * Exibe métricas e indicadores dinâmicos da clínica:
 * - Filtro de período configurável
 * - Cartões com métricas baseadas em dados reais do Supabase
 * - Gráficos de performance e conversão
 * - Performance de anúncios específicos por ad_name
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

  const handleFilterChange = (newStartDate: Date | null, newEndDate: Date | null, filterName: string) => {
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

  // Preparar dados das métricas com base nos dados carregados - REMOVIDO o card de "Leads de Anúncios Específicos"
  const metrics = dashboardData ? [
    {
      title: 'Total de Contatos',
      value: dashboardData.totalContatos.toString(),
      icon: Users
    },
    {
      title: 'Leads de Anúncios',
      value: dashboardData.leadsAnuncios.toString(),
      icon: Megaphone
    },
    {
      title: 'Consultas Agendadas',
      value: dashboardData.consultasAgendadas.toString(),
      icon: Calendar
    },
    {
      title: 'Consultas Realizadas',
      value: dashboardData.consultasRealizadas.toString(),
      icon: CheckCircle
    },
    {
      title: 'Taxa de Conversão',
      value: `${dashboardData.taxaConversao}%`,
      icon: TrendingUp
    },
    {
      title: 'Faturamento Realizado',
      value: `R$ ${dashboardData.faturamentoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header da página com o filtro de período */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Visão geral das métricas da sua clínica
          </p>
        </div>
        <TimeRangeFilter 
          onFilterChange={handleFilterChange} 
          currentFilter={currentFilter} 
        />
      </div>

      {/* Grid de cartões de métricas - Layout reorganizado para 6 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ChartCard
          title="Leads por Período"
          description="Evolução dos leads recebidos no período selecionado"
          type="line"
          data={dashboardData?.leadsParaGrafico || []}
        />
        <ChartCard
          title="Conversões por Categoria"
          description="Conversões por tipo de procedimento no período"
          type="bar"
          data={dashboardData?.conversoesPorCategoria || []}
        />
        <AdPerformanceCard
          data={dashboardData?.leadsPorAnuncio || []}
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
              
              {/* Insight sobre anúncios usando o campo leadsComAdName */}
              {dashboardData.leadsComAdName > 0 && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      Performance de anúncios
                    </p>
                    <p className="text-sm text-purple-700">
                      {dashboardData.leadsComAdName} leads vieram de anúncios específicos ({((dashboardData.leadsComAdName / dashboardData.totalContatos) * 100).toFixed(1)}% do total).
                    </p>
                  </div>
                </div>
              )}
              
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
