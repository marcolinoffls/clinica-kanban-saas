
/**
 * Componente para exibir gráficos no dashboard
 * 
 * O que faz:
 * - Renderiza diferentes tipos de gráficos (linha, barra)
 * - Fornece controles para filtrar dados
 * - Adapta automaticamente o tamanho baseado no tipo
 * 
 * Onde é usado:
 * - Dashboard principal para visualização de métricas
 * 
 * Como se conecta:
 * - Recebe dados processados do dashboardService
 * - Usa a biblioteca Recharts para renderização
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Filter } from 'lucide-react';

interface ChartData {
  label?: string;
  leads?: number;
  category?: string;
  conversions?: number;
  [key: string]: any;
}

interface ChartCardProps {
  title: string;
  description: string;
  data: ChartData[];
  type: 'line' | 'bar';
  showFilter?: boolean; // Novo prop para controlar se mostra filtros
}

export const ChartCard = ({ title, description, data, type, showFilter = false }: ChartCardProps) => {
  const [filterType, setFilterType] = useState<'all' | 'ads'>('all');

  // Filtrar dados baseado no tipo selecionado (apenas para gráfico de linha)
  const filteredData = showFilter && type === 'line' 
    ? data.filter(item => {
        if (filterType === 'ads') {
          // Lógica para filtrar apenas dados de anúncios
          // Assumindo que dados de anúncios têm uma propriedade específica
          return item.isFromAd === true;
        }
        return true; // Mostrar todos
      })
    : data;

  const renderChart = () => {
    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="leads" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="conversions" 
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Header com título e controles */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {title}
          </h3>
          
          {/* Filtros para gráfico de leads (apenas se showFilter for true) */}
          {showFilter && type === 'line' && (
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="text-xs"
              >
                Todos os Leads
              </Button>
              <Button
                variant={filterType === 'ads' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('ads')}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Apenas Anúncios
              </Button>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Gráfico */}
      <div className="w-full">
        {data && data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum dado disponível para o período selecionado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
