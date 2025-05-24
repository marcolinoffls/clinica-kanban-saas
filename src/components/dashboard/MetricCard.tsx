
import { LucideIcon } from 'lucide-react';

/**
 * Componente para exibir uma métrica individual no dashboard
 * 
 * Exibe:
 * - Ícone representativo da métrica
 * - Título da métrica
 * - Valor atual
 * - Mudança percentual (positiva ou negativa)
 * 
 * Props:
 * - title: título da métrica
 * - value: valor atual
 * - change: variação percentual
 * - changeType: 'positive' ou 'negative' para cores
 * - icon: ícone do Lucide React
 */

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
}

export const MetricCard = ({ title, value, change, changeType, icon: Icon }: MetricCardProps) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Header com ícone e mudança */}
      <div className="flex items-center justify-between">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
        <span
          className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change}
        </span>
      </div>

      {/* Valor principal */}
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
      </div>
    </div>
  );
};
