
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Componente para exibir filtros ativos
 * 
 * Mostra os filtros aplicados e permite limpá-los.
 * Exibe também o número de resultados filtrados.
 */

interface FilterState {
  status: string;
  tag: string;
  origem: string;
  servico: string;
  hasActiveFilters: boolean;
}

interface ActiveFiltersDisplayProps {
  filters: FilterState;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  filters,
  onClearFilters,
  filteredCount,
  totalCount,
}) => {
  if (!filters.hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearFilters}
        className="text-xs"
      >
        Limpar Filtros
      </Button>
      <Badge variant="secondary" className="text-xs">
        {filteredCount} de {totalCount} contatos
      </Badge>
    </div>
  );
};
