
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * Componente para exibir gráficos no dashboard
 * 
 * Suporta dois tipos de gráficos:
 * - line: gráfico de linha para tendências
 * - bar: gráfico de barras para comparações
 * 
 * Utiliza a biblioteca Recharts para renderização.
 * Os dados são mockados para demonstração.
 * 
 * Props:
 * - title: título do gráfico
 * - description: descrição do que o gráfico mostra
 * - type: 'line' ou 'bar'
 */

interface ChartCardProps {
  title: string;
  description: string;
  type: 'line' | 'bar';
}

export const ChartCard = ({ title, description, type }: ChartCardProps) => {
  // Dados mockados para o gráfico de linha (leads por mês)
  const lineData = [
    { month: 'Jan', leads: 30 },
    { month: 'Fev', leads: 45 },
    { month: 'Mar', leads: 38 },
    { month: 'Abr', leads: 52 },
    { month: 'Mai', leads: 61 },
    { month: 'Jun', leads: 55 }
  ];

  // Dados mockados para o gráfico de barras (conversões por categoria)
  const barData = [
    { category: 'Implante', conversions: 85 },
    { category: 'Consulta', conversions: 45 },
    { category: 'Limpeza', conversions: 78 },
    { category: 'Emergência', conversions: 32 },
    { category: 'Ortodontia', conversions: 67 }
  ];

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Header do gráfico */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      {/* Renderização do gráfico baseado no tipo */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          ) : (
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="conversions" fill="#10B981" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
