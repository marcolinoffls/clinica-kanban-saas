
import { TimeRangeFilter } from '@/components/admin/TimeRangeFilter';

/**
 * Componente do cabeçalho do Dashboard
 * 
 * O que faz:
 * - Exibe o título e descrição da página
 * - Renderiza o filtro de período
 * 
 * Onde é usado:
 * - Componente Dashboard principal
 * 
 * Como se conecta:
 * - Recebe props para controlar o filtro de período
 */

interface DashboardHeaderProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null, filterName: string) => void;
  currentFilter: string;
}

export const DashboardHeader = ({ onFilterChange, currentFilter }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Visão geral das métricas da sua clínica
        </p>
      </div>
      <TimeRangeFilter 
        onFilterChange={onFilterChange} 
        currentFilter={currentFilter} 
      />
    </div>
  );
};
