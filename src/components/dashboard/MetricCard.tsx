
import { LucideIcon } from 'lucide-react';

/**
 * Componente para exibir uma métrica individual no dashboard
 * 
 * Exibe:
 * - Ícone representativo da métrica ao lado do título
 * - Valor atual
 * 
 * Props:
 * - title: título da métrica
 * - value: valor atual
 * - icon: ícone do Lucide React
 */

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

export const MetricCard = ({ title, value, icon: Icon }: MetricCardProps) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Header com ícone e título lado a lado */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>

      {/* Valor principal */}
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};
