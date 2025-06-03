
/**
 * Tipos e interfaces para a página de Clientes/Leads
 */

// Tipos para ordenação da tabela
export type SortField = 'nome' | 'email' | 'data_ultimo_contato' | 'created_at';
export type SortOrder = 'asc' | 'desc';

// Interface para estado dos filtros
export interface FilterState {
  tag: string;
  origem: string;
  servico: string;
  dataInicio?: Date;
  dataFim?: Date;
}
