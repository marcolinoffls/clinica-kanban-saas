import { TimeRangeFilter } from '@/components/admin/TimeRangeFilter';

/**
 * Componente do cabeçalho do Dashboard
 * 
 * O que faz:
 * - Exibe APENAS o filtro de período (removido título duplicado)
 * - Mantém apenas funcionalidades de controle
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
      {/* REMOVIDO: Seção do título duplicado */}
      {/* 
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Visão geral das métricas da sua clínica
        </p>
      </div>
      */}
      
      {/* Mantém apenas o filtro de período */}
      <TimeRangeFilter 
        onFilterChange={onFilterChange} 
        currentFilter={currentFilter} 
      />
    </div>
  );
};