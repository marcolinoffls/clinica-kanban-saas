
import { useState, useMemo } from 'react';
import { ClientsPageHeader } from './ClientsPageHeader';
import { ContactsFilters } from './ContactsFilters';
import { ContactsTable } from './ContactsTable';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';
import { ClientsActionsBar } from './ClientsActionsBar';
import { useClientsPage } from '@/hooks/useClientsPage';

/**
 * Página principal de Contatos/Clientes
 * 
 * Gerencia a visualização e filtros dos leads/contatos.
 * Usa o hook useClientsPage para buscar dados e operações.
 */

// Tipos para os filtros
interface Filters {
  tag: string;
  origem: string;
  servico: string;
}

interface FilterState extends Filters {
  hasActiveFilters: boolean;
}

export const ClientsPage = () => {
  // Estado para busca e seleção
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Estado para filtros
  const [filters, setFilters] = useState<FilterState>({
    tag: '',
    origem: '',
    servico: '',
    hasActiveFilters: false
  });

  // Hook para dados e operações
  const {
    leads,
    tags,
    isLoading,
    error,
    refetch,
    updateLead,
    deleteLead,
    moveToEtapa,
    etapas
  } = useClientsPage();

  // Aplicar filtros e busca
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Aplicar busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.nome?.toLowerCase().includes(term) ||
        lead.telefone?.includes(term) ||
        lead.email?.toLowerCase().includes(term)
      );
    }

    // Aplicar filtros
    if (filters.tag) {
      filtered = filtered.filter(lead => lead.tags?.includes(filters.tag));
    }

    if (filters.origem) {
      filtered = filtered.filter(lead => lead.origem_lead === filters.origem);
    }

    if (filters.servico) {
      filtered = filtered.filter(lead => lead.servico_interesse === filters.servico);
    }

    return filtered;
  }, [leads, searchTerm, filters]);

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Filters) => {
    const hasActiveFilters = Boolean(newFilters.tag || newFilters.origem || newFilters.servico);
    setFilters({ ...newFilters, hasActiveFilters });
    setCurrentPage(1);
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === paginatedLeads.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(paginatedLeads.map(lead => lead.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
  };

  // Estados de loading e erro
  if (isLoading) {
    return <ContactsLoadingState />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar contatos: {error}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <ClientsPageHeader 
        totalContacts={leads.length}
        filteredCount={filteredLeads.length}
      />

      {/* Filtros */}
      <ContactsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        tags={tags}
      />

      {/* Barra de ações (quando há seleções) */}
      {selectedContacts.length > 0 && (
        <ClientsActionsBar
          selectedCount={selectedContacts.length}
          onClearSelection={handleClearSelection}
          selectedContactIds={selectedContacts}
          etapas={etapas}
          onMoveToEtapa={moveToEtapa}
          onDeleteSelected={deleteLead}
        />
      )}

      {/* Tabela ou estado vazio */}
      {filteredLeads.length === 0 ? (
        <ContactsEmptyState 
          hasFilters={filters.hasActiveFilters}
          searchTerm={searchTerm}
        />
      ) : (
        <ContactsTable
          leads={paginatedLeads}
          selectedContacts={selectedContacts}
          onSelectContact={handleSelectContact}
          onSelectAll={handleSelectAll}
          onUpdateLead={updateLead}
          onDeleteLead={deleteLead}
          onMoveToEtapa={moveToEtapa}
          etapas={etapas}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredLeads.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};
