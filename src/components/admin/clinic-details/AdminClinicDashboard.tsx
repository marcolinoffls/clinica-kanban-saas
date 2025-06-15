
import { useState, useEffect } from 'react';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { Users, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { TimeRangeFilter } from '../TimeRangeFilter';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { fetchDashboardData } from '@/services/dashboardService';
import { DashboardMetrics } from '@/hooks/dashboard/types';

/**
 * Componente de Dashboard Administrativo para Clínicas
 * 
 * O que faz:
 * Exibe uma réplica completa do dashboard da clínica específica,
 * incluindo métricas, gráficos e filtros de tempo.
 * 
 * Onde é usado:
 * Dentro do modal de visualização rápida no painel administrativo.
 * 
 * Como se conecta:
 * - Recebe o ID da clínica como prop
 * - Usa o mesmo serviço de dados do dashboard principal
 * - Aplica filtros de tempo independentemente
 */

interface AdminClinicDashboardProps {
  clinicaId: string;
}

export const AdminClinicDashboard = ({ clinicaId }: AdminClinicDashboardProps) => {
  const [currentFilter, setCurrentFilter] = useState('Últimos 30 Dias');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar filtro de tempo padrão
  useEffect(() => {
    const today = new Date();
    const start = startOfDay(subDays(today, 29));
    const end = endOfDay(today);
    setStartDate(start);
    setEndDate(end);
  }, []);

  // Carregar dados do dashboard quando as datas mudarem
  useEffect(() => {
    if (clinicaId && startDate && endDate) {
      const loadDashboardData = async () => {
        setLoading(true);
        try {
          const data = await fetchDashboardData(clinicaId, startDate, endDate);
          setDashboardData(data);
        } catch (error) {
          console.error('Erro ao carregar dados do dashboard:', error);
          setDashboardData(null);
        } finally {
          setLoading(false);
        }
      };
      
      loadDashboardData();
    }
  }, [clinicaId, startDate, endDate]);

  const handleFilterChange = (start: Date | null, end: Date | null, filterName: string) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentFilter(filterName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Não foi possível carregar os dados do dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Tempo */}
      <TimeRangeFilter 
        onFilterChange={handleFilterChange} 
        currentFilter={currentFilter} 
      />

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Contatos"
          value={dashboardData.totalContatos.toString()}
          change={`${dashboardData.variacaoContatos > 0 ? '+' : ''}${dashboardData.variacaoContatos}%`}
          changeType={dashboardData.variacaoContatos >= 0 ? 'positive' : 'negative'}
          icon={Users}
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${dashboardData.taxaConversao}%`}
          change={`${dashboardData.variacaoConversao > 0 ? '+' : ''}${dashboardData.variacaoConversao}%`}
          changeType={dashboardData.variacaoConversao >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
        />
        <MetricCard
          title="Consultas Agendadas"
          value={dashboardData.consultasAgendadas.toString()}
          change={`${dashboardData.variacaoConsultas > 0 ? '+' : ''}${dashboardData.variacaoConsultas}%`}
          changeType={dashboardData.variacaoConsultas >= 0 ? 'positive' : 'negative'}
          icon={Calendar}
        />
        <MetricCard
          title="Faturamento Realizado"
          value={`R$ ${(dashboardData.faturamentoRealizado || 0).toLocaleString('pt-BR')}`}
          change={`${dashboardData.variacaoFaturamento > 0 ? '+' : ''}${dashboardData.variacaoFaturamento}%`}
          changeType={dashboardData.variacaoFaturamento >= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Leads por Período"
          description="Evolução dos leads ao longo do tempo"
          data={dashboardData.leadsParaGrafico}
          type="line"
        />
        <ChartCard
          title="Conversões por Categoria"
          description="Distribuição das conversões por tipo de serviço"
          data={dashboardData.conversoesPorCategoria}
          type="bar"
        />
      </div>
    </div>
  );
};
