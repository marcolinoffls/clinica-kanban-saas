
import { LucideIcon } from 'lucide-react';

/**
 * Componente para exibir uma métrica individual no dashboard
 * 
 * Exibe:
 * - Ícone representativo da métrica ao lado do título
 * - Valor atual
 * - Indicador de mudança (opcional, para compatibilidade com admin)
 * 
 * Props:
 * - title: título da métrica
 * - value: valor atual
 * - icon: ícone do Lucide React
 * - change: mudança percentual (opcional)
 * - changeType: tipo de mudança - 'positive' ou 'negative' (opcional)
 */

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string; // Propriedade opcional para compatibilidade com admin
  changeType?: 'positive' | 'negative'; // Tipo de mudança opcional
}

export const MetricCard = ({ title, value, icon: Icon, change, changeType }: MetricCardProps) => {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Header com ícone e título lado a lado */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Valor principal */}
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        
        {/* Indicador de mudança (se fornecido) */}
        {change && (
          <div className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
};
