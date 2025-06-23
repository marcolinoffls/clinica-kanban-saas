
import React from 'react';
import { Input } from "@/components/ui/input";
import { ContactsFilters } from './ContactsFilters';
import { FilterState } from './types';

/**
 * Barra de ações da página de Contatos.
 * Contém a busca por texto e o componente de filtros avançados.
 *
 * Props:
 * - searchQuery, setSearchQuery: Estado e setter para o campo de busca.
 * - filters, setFilters: Estado e setter para os filtros avançados.
 * - isFilterOpen, setIsFilterOpen: Estado e setter para a visibilidade do popover de filtros.
 * - tags, uniqueOrigens, uniqueServicos: Dados para popular os seletores dos filtros.
 * - onClearFilters: Função para limpar todos os filtros.
 * - hasActiveFilters: Indica se existem filtros ativos.
 * 
 * Onde é usado:
 * - ClientsPage.tsx
 */
interface ClientsActionsBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
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

export const ClientsActionsBar: React.FC<ClientsActionsBarProps> = ({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  isFilterOpen,
  setIsFilterOpen,
  tags,
  uniqueOrigens,
  uniqueServicos,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <ContactsFilters
        filters={filters}
        setFilters={setFilters}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        tags={tags || []}
        uniqueOrigens={uniqueOrigens}
        uniqueServicos={uniqueServicos}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
};
