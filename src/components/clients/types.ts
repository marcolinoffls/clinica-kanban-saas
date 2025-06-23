
export interface ContactData {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  origem_lead?: string;
  servico_interesse?: string;
  created_at: string;
  data_ultimo_contato?: string;
  anotacoes?: string;
  convertido?: boolean;
  etapa_kanban_id?: string;
  tag_id?: string;
}

export type SortField = 'nome' | 'telefone' | 'email' | 'created_at' | 'data_ultimo_contato';
export type SortOrder = 'asc' | 'desc';

export interface Filters {
  searchTerm: string;
  origem: string;
  convertido: string;
  etapa: string;
  tag: string;
  dataInicio: string;
  dataFim: string;
}

export interface FilterState {
  filters: Filters;
  sortField: SortField;
  sortOrder: SortOrder;
}

export interface ContactsFilters {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  etapas: Array<{ id: string; nome: string }>;
  tags: Array<{ id: string; nome: string; cor: string }>;
}

export interface ContactsTableProps {
  contacts: ContactData[];
  loading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onContactSelect: (contact: ContactData) => void;
}
