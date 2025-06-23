export type SortField = 'nome' | 'telefone' | 'email' | 'created_at';

export interface FilterState {
  searchTerm: string;
  tags: string[];
  etapas: string[];
  origemLead: string[];
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface ContactsFilters {
  searchTerm: string;
  tags: string[];
  etapas: string[];
  origemLead: string[];
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  hasActiveFilters: boolean;
}
