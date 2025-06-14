
import React from 'react';
import { useClientsPage } from '@/hooks/useClientsPage';
import { ContactsTable } from './ContactsTable';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';
import { LeadModal } from '@/components/kanban/LeadModal';
import { ClientsPageHeader } from './ClientsPageHeader';
import { ClientsActionsBar } from './ClientsActionsBar';

/**
 * Página Principal de Clientes/Leads (Refatorada)
 * 
 * O que faz:
 * - Usa o hook `useClientsPage` para toda a lógica de estado e manipulação de dados.
 * - Compõe a UI a partir de componentes menores e focados.
 * - Orquestra a exibição de estados (carregamento, vazio, dados).
 * 
 * Onde é usado:
 * - É a página principal de contatos, chamada por `ContatosPage.tsx`.
 * 
 * Como se conecta:
 * - `useClientsPage`: Hook que centraliza a lógica.
 * - `ClientsPageHeader`, `ClientsActionsBar`: Componentes de UI para o layout da página.
 * - `ContactsTable`, `ContactsEmptyState`, `ContactsLoadingState`: Componentes para exibir os dados ou estados da lista.
 * - `LeadModal`: Modal para edição de um lead.
 */
const ClientsPage = () => {
  const {
    loading,
    tags,
    etapas,
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    setIsFilterOpen,
    sortField,
    sortOrder,
    isDeleting,
    isLeadModalOpen,
    setIsLeadModalOpen,
    selectedLeadForEdit,
    setSelectedLeadForEdit,
    filters,
    setFilters,
    uniqueOrigens,
    uniqueServicos,
    sortedLeads,
    hasActiveFilters,
    handleSort,
    handleAddLead,
    handleClearFilters,
    handleEditLead,
    handleOpenChat,
    handleDeleteLead,
    handleSaveLead,
  } = useClientsPage();

  // Renderização condicional baseada no estado de carregamento
  if (loading) {
    return (
      <div className="space-y-6">
        <ClientsPageHeader onAddLead={() => {}} />
        <ContactsLoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientsPageHeader onAddLead={handleAddLead} />
      
      <ClientsActionsBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filters={filters}
        setFilters={setFilters}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        tags={tags}
        uniqueOrigens={uniqueOrigens}
        uniqueServicos={uniqueServicos}
        onClearFilters={handleClearFilters}
      />

      {/* Tabela ou estados especiais */}
      {sortedLeads.length > 0 ? (
        <ContactsTable
          leads={sortedLeads}
          tags={tags}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEdit={handleEditLead}
          onChat={handleOpenChat}
          onDelete={handleDeleteLead}
          isDeleting={isDeleting}
        />
      ) : (
        <div className="flex items-center justify-center min-h-[400px] border rounded-lg bg-muted/10">
          <ContactsEmptyState
            hasFilters={hasActiveFilters}
            searchQuery={searchQuery}
            onClearFilters={handleClearFilters}
            onAddLead={handleAddLead}
          />
        </div>
      )}
      
      {/* Modal de Edição de Lead */}
      {selectedLeadForEdit && (
        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => {
            setIsLeadModalOpen(false);
            setSelectedLeadForEdit(null);
          }}
          lead={selectedLeadForEdit}
          etapas={etapas}
          onSave={handleSaveLead}
        />
      )}
    </div>
  );
};

export default ClientsPage;
