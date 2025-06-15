
import { MetricCard } from './MetricCard';
import { Users, Calendar, TrendingUp, DollarSign, CheckCircle, Megaphone } from 'lucide-react';
import { DashboardMetrics as DashboardMetricsType } from '@/hooks/dashboard/types';

/**
 * Componente do grid de métricas do Dashboard
 * 
 * O que faz:
 * - Renderiza os 6 cartões de métricas principais
 * - Formata os dados para exibição
 * 
 * Onde é usado:
 * - Componente Dashboard principal
 * 
 * Como se conecta:
 * - Recebe dados processados do Supabase via props
 */

interface DashboardMetricsProps {
  dashboardData: DashboardMetricsType | null;
}

export const DashboardMetrics = ({ dashboardData }: DashboardMetricsProps) => {
  // Preparar dados das métricas com base nos dados carregados
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};
