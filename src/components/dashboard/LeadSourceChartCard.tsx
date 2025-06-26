
/**
 * Componente de gráfico de barras para exibir leads por origem
 * 
 * O que faz:
 * - Renderiza gráfico de barras verticais mostrando quantidade de leads por origem
 * - Fornece filtros para tipo de lead (todos/anúncios) e origem específica
 * - Processa e agrupa dados de leads por origem automaticamente
 * 
 * Onde é usado:
 * - Dashboard principal para visualização de origens dos leads
 * 
 * Como se conecta:
 * - Recebe dados brutos de leads via props
 * - Usa a biblioteca Recharts para renderização do gráfico
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, Filter, Globe, MessageSquare, Search, Phone } from 'lucide-react';

interface LeadSourceData {
  name: string;
  leads: number;
  color: string;
}

interface LeadSourceChartCardProps {
  rawLeadsData: any[];
}

export const LeadSourceChartCard = ({ rawLeadsData }: LeadSourceChartCardProps) => {
  const [leadTypeFilter, setLeadTypeFilter] = useState<'all' | 'ads'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'google' | 'direct' | 'whatsapp'>('all');

  // Cores para diferentes origens
  const sourceColors: Record<string, string> = {
    'Google': '#4285f4',
    'Google Ads': '#34a853',
    'Direct': '#9333ea',
    'Direct (Instagram)': '#e4405f',
    'WhatsApp': '#25d366',
    'Facebook': '#1877f2',
    'Instagram': '#e4405f',
    'Outros': '#6b7280'
  };

  // Ícones para diferentes origens
  const getSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('google')) return <Search className="w-4 h-4" />;
    if (lowerSource.includes('whatsapp')) return <MessageSquare className="w-4 h-4" />;
    if (lowerSource.includes('direct') || lowerSource.includes('instagram')) return <Globe className="w-4 h-4" />;
    return <Phone className="w-4 h-4" />;
  };

  // Processar dados com base nos filtros
  const processedData = useMemo(() => {
    let filteredLeads = rawLeadsData || [];

    // Filtro 1: Tipo de Lead
    if (leadTypeFilter === 'ads') {
      filteredLeads = filteredLeads.filter(lead => 
        lead.ad_name && lead.ad_name.trim() !== ''
      );
    }

    // Filtro 2: Origem específica
    if (sourceFilter !== 'all') {
      filteredLeads = filteredLeads.filter(lead => {
        const origem = lead.origem_lead?.toLowerCase() || '';
        switch (sourceFilter) {
          case 'google':
            return origem.includes('google');
          case 'direct':
            return origem.includes('direct') || origem.includes('instagram');
          case 'whatsapp':
            return origem.includes('whatsapp');
          default:
            return true;
        }
      });
    }

    // Agrupar por origem e contar
    const sourceCount: Record<string, number> = {};
    
    filteredLeads.forEach(lead => {
      const origem = lead.origem_lead || 'Não informado';
      sourceCount[origem] = (sourceCount[origem] || 0) + 1;
    });

    // Converter para formato do gráfico e ordenar por quantidade
    const chartData: LeadSourceData[] = Object.entries(sourceCount)
      .map(([name, leads]) => ({
        name,
        leads,
        color: sourceColors[name] || sourceColors['Outros']
      }))
      .sort((a, b) => b.leads - a.leads);

    return chartData;
  }, [rawLeadsData, leadTypeFilter, sourceFilter]);

  // Calcular total de leads
  const totalLeads = processedData.reduce((sum, item) => sum + item.leads, 0);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Header com título e controles */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Leads por Origem
          </h3>
          
          {/* Total de leads */}
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
            <p className="text-sm text-gray-500">Total de leads</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Distribuição dos leads por fonte de origem no período selecionado
        </p>

        {/* Filtros */}
        <div className="space-y-3">
          {/* Filtro 1: Tipo de Lead */}
          <div className="flex gap-2">
            <Button
              variant={leadTypeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLeadTypeFilter('all')}
              className="text-xs"
            >
              Todos os Leads
            </Button>
            <Button
              variant={leadTypeFilter === 'ads' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLeadTypeFilter('ads')}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Apenas Anúncios
            </Button>
          </div>

          {/* Filtro 2: Origem */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={sourceFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter('all')}
              className="text-xs"
            >
              Todas as Origens
            </Button>
            <Button
              variant={sourceFilter === 'google' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter('google')}
              className="text-xs"
            >
              <Search className="h-3 w-3 mr-1" />
              Google
            </Button>
            <Button
              variant={sourceFilter === 'direct' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter('direct')}
              className="text-xs"
            >
              <Globe className="h-3 w-3 mr-1" />
              Direct
            </Button>
            <Button
              variant={sourceFilter === 'whatsapp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter('whatsapp')}
              className="text-xs"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="w-full">
        {processedData && processedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#666"
                angle={-45}
                textAnchor="end"
                height={80}
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
                formatter={(value: number, name: string) => [
                  `${value} lead${value !== 1 ? 's' : ''}`,
                  'Quantidade'
                ]}
                labelFormatter={(label: string) => `Origem: ${label}`}
              />
              <Bar 
                dataKey="leads" 
                radius={[4, 4, 0, 0]}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-80 text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium mb-2">Nenhum lead encontrado</p>
              <p className="text-sm">
                {sourceFilter !== 'all' || leadTypeFilter === 'ads'
                  ? 'Nenhum lead encontrado com os filtros selecionados'
                  : 'Nenhum dado disponível para o período selecionado'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legenda com detalhes */}
      {processedData.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {processedData.slice(0, 8).map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex items-center gap-1 min-w-0">
                {getSourceIcon(item.name)}
                <span className="truncate">{item.name}</span>
                <span className="font-medium text-gray-900">({item.leads})</span>
              </div>
            </div>
          ))}
          {processedData.length > 8 && (
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <span>+{processedData.length - 8} outras origens</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
