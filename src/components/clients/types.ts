
/**
 * Tipos e interfaces usados nos componentes de clientes/contatos
 */

// Interface para os filtros de contatos
export interface FilterState {
  tag: string;
  origem: string;
  servico: string;
}

// Tipo para campos de ordenação
export type SortField = 'nome' | 'created_at' | 'email';

// Tipo para direção da ordenação
export type SortOrder = 'asc' | 'desc';

// Interface para props de componentes de filtro
export interface ContactsFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  tags: any[];
  uniqueOrigens: string[];
  uniqueServicos: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}
