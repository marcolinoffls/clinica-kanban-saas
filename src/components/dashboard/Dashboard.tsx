
import { MetricCard } from './MetricCard';
import { ChartCard } from './ChartCard';
import { Users, Calendar, TrendingUp, DollarSign } from 'lucide-react';

/**
 * Componente principal do Dashboard
 * 
 * Exibe métricas e indicadores importantes da clínica:
 * - Cartões com métricas resumidas (total de contatos, consultas, etc.)
 * - Gráficos de performance e conversão
 * - Taxa de conversão de leads
 * - Faturamento estimado
 * 
 * Os dados são mockados para demonstração, mas em produção
 * viriam do Supabase através de queries e agregações.
 */

export const Dashboard = () => {
  // Dados mockados para demonstração (em produção viriam do Supabase)
  const metrics = [
    {
      title: 'Total de Contatos',
      value: '247',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Consultas Agendadas',
      value: '18',
      change: '+8%',
      changeType: 'positive' as const,
      icon: Calendar
    },
    {
      title: 'Taxa de Conversão',
      value: '32%',
      change: '+5%',
      changeType: 'positive' as const,
      icon: TrendingUp
    },
    {
      title: 'Faturamento Estimado',
      value: 'R$ 15.800',
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSign
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Visão geral das métricas da sua clínica
        </p>
      </div>

      {/* Grid de cartões de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Leads por Mês"
          description="Evolução dos leads recebidos nos últimos 6 meses"
          type="line"
        />
        <ChartCard
          title="Conversões por Categoria"
          description="Taxa de conversão por tipo de procedimento"
          type="bar"
        />
      </div>

      {/* Seção de insights e alertas */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Insights e Alertas
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Excelente performance este mês!
              </p>
              <p className="text-sm text-green-700">
                Sua taxa de conversão aumentou 5% em relação ao mês passado.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Oportunidade identificada
              </p>
              <p className="text-sm text-blue-700">
                Você tem 5 leads em "Aguardando Atendimento" há mais de 2 dias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
