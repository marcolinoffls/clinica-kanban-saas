import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, MessageSquare, Target } from 'lucide-react';

interface ClinicStatsCardsProps {
  clinica: any;
  leadsStats: any;
  loadingStats: boolean;
}

/**
 * 📊 Cards de Estatísticas da Clínica
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Proteção contra dados undefined
 * - Valores padrão para evitar crashes
 * - Loading states adequados
 */
export const ClinicStatsCards = ({ clinica, leadsStats, loadingStats }: ClinicStatsCardsProps) => {
  // ✅ PROTEÇÃO: Valores padrão para evitar erros
  const stats = {
    totalLeads: leadsStats?.totalLeads || 0,
    leadsConvertidos: leadsStats?.leadsConvertidos || 0,
    taxaConversao: leadsStats?.taxaConversao || 0,
    leadsAnuncios: leadsStats?.leadsAnuncios || 0,
  };

  const cards = [
    {
      title: 'Total de Leads',
      value: loadingStats ? '...' : stats.totalLeads.toLocaleString(),
      icon: Users,
      description: 'Leads totais no sistema',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Leads Convertidos',
      value: loadingStats ? '...' : stats.leadsConvertidos.toLocaleString(),
      icon: Target,
      description: 'Leads que se tornaram clientes',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Taxa de Conversão',
      value: loadingStats ? '...' : `${stats.taxaConversao}%`,
      icon: TrendingUp,
      description: 'Percentual de conversão',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Leads de Anúncios',
      value: loadingStats ? '...' : stats.leadsAnuncios.toLocaleString(),
      icon: MessageSquare,
      description: 'Leads originados de anúncios',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-md ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};