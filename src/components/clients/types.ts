
/**
 * Tipos para o sistema de clientes/contatos
 * 
 * Define as interfaces e tipos utilizados em toda a funcionalidade
 * de gerenciamento de clientes, incluindo filtros, ordenação e estados.
 */

// Campos disponíveis para ordenação na tabela de contatos
export type SortField = 'nome' | 'email' | 'created_at' | 'data_ultimo_contato';

// Direção da ordenação
export type SortOrder = 'asc' | 'desc';

// Interface para os filtros aplicados na lista de contatos
export interface ContactsFilters {
  tagId?: string | null;           // ID da tag selecionada
  origemLead?: string | null;      // Origem do lead (ex: "WhatsApp", "Instagram")
  servicoInteresse?: string | null; // Serviço de interesse
  etapaId?: string | null;         // ID da etapa no kanban
  hasActiveFilters: boolean;       // Indica se há filtros ativos
}

// Interface para os filtros da barra de ações (versão simplificada)
export interface ContactsFiltersBarProps {
  tag: string;                     // Tag selecionada
  origem: string;                  // Origem selecionada
  servico: string;                 // Serviço selecionado
  hasActiveFilters: boolean;       // Indica se há filtros ativos
}

// Estado de loading para diferentes operações
export interface LoadingStates {
  deleting: boolean;               // Indica se está deletando um lead
  loading: boolean;                // Loading geral da página
}

// Interface para filtros internos do componente
export interface Filters {
  tag: string;
  origem: string;
  servico: string;
}
