
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

/**
 * Componente para exibir gráficos no dashboard
 * 
 * Suporta dois tipos de gráficos:
 * - line: gráfico de linha para tendências
 * - bar: gráfico de barras para comparações
 * 
 * Utiliza a biblioteca Recharts para renderização.
 * Os dados são agora recebidos via props do hook useDashboardData.
 * 
 * Props:
 * - title: título do gráfico
 * - description: descrição do que o gráfico mostra
 * - type: 'line' ou 'bar'
 * - data: dados para exibir no gráfico
 */

interface ChartCardProps {
  title: string;
  description: string;
  type: 'line' | 'bar';
  data: any[];
}

export const ChartCard = ({ title, description, type, data }: ChartCardProps) => {
  // Se não houver dados, exibir mensagem informativa
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📊</span>
            </div>
            <p className="text-gray-500 text-sm">Nenhum dado encontrado para o período selecionado</p>
          </div>
        </div>
      </div>
    );
  }

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
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickMargin={5}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickMargin={5}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#3B82F6' }}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                tickMargin={5}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickMargin={5}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="conversions" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
