
import React, { useState } from 'react';
import { useClientsPage } from '@/hooks/useClientsPage';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';
import { ContactsFilters } from './ContactsFilters';
import { ContactsTable } from './ContactsTable';
import { ClientsPageHeader } from './ClientsPageHeader';
import { ClientsActionsBar } from './ClientsActionsBar';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { LeadModal } from '@/components/kanban/LeadModal';

/**
 * Página principal de clientes/contatos da clínica - REFATORADA
 * 
 * FUNCIONALIDADES:
 * - Lista todos os contatos/leads da clínica
 * - Permite busca e filtros avançados
 * - Ações em massa (deletar, atualizar status, exportar)
 * - Modal para edição de leads
 * - Paginação de resultados
 * - Estados de carregamento e vazio
 * 
 * ONDE É USADO:
 * - Rota /contatos através do ContatosPage
 * - Sistema de navegação principal
 * 
 * INTEGRAÇÃO:
 * - Hook useClientsPage para gerenciar estado e filtros
 * - Componentes refatorados para melhor organização
 * - Modal reutilizado do sistema Kanban
 */

export const ClientsPage = () => {
  // Hook principal para gerenciar a página
  const {
    loading,
    tags,
    etapas,
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    setIsFilterOpen,
    filteredLeads,
    selectedLeadIds,
    setSelectedLeadIds,
    filters,
    sortConfig,
    currentPage,
    setCurrentPage,
    totalLeads,
    totalPages,
    paginatedLeads,
    isExporting,
    handleSort,
    handleFilterChange,
    clearFilters,
    handleSelectLead,
    handleSelectAll,
    handleDeleteSelected,
    handleBulkStatusUpdate,
    handleExportContacts,
    handleSaveLead,
    refreshData,
  } = useClientsPage();

  // Estados locais para modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState(null);

  // Função para abrir modal de adicionar lead
  const handleOpenAddModal = () => {
    setSelectedLeadForEdit(null);
    setIsModalOpen(true);
  };

  // Função para abrir modal de editar lead
  const handleOpenEditModal = (lead: any) => {
    setSelectedLeadForEdit(lead);
    setIsModalOpen(true);
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeadForEdit(null);
  };

  // Função para salvar lead (criar ou atualizar)
  const handleSaveLeadData = async (leadData: any) => {
    await handleSaveLead(leadData);
    handleCloseModal();
  };

  // Verificar se há seleções
  const hasSelection = selectedLeadIds.length > 0;
  const allSelected = selectedLeadIds.length === paginatedLeads.length && paginatedLeads.length > 0;
  const someSelected = selectedLeadIds.length > 0 && selectedLeadIds.length < paginatedLeads.length;

  // Estado de carregamento
  if (loading) {
    return <ContactsLoadingState />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho da página */}
      <ClientsPageHeader 
        onAddLead={handleOpenAddModal}
      />

      {/* Barra de ações quando há contatos selecionados */}
      {hasSelection && (
        <ClientsActionsBar
          selectedCount={selectedLeadIds.length}
          onExport={handleExportContacts}
          onDelete={handleDeleteSelected}
          onStatusUpdate={handleBulkStatusUpdate}
          isExporting={isExporting}
        />
      )}

      {/* Filtros e busca */}
      <div className="space-y-4">
        <ContactsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFilterChange={handleFilterChange}
          tags={tags}
          etapas={etapas}
          totalContacts={totalLeads}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
        />
        
        {/* Exibir filtros ativos */}
        <ActiveFiltersDisplay
          filters={filters}
          onClearFilters={clearFilters}
          filteredCount={filteredLeads.length}
          totalCount={totalLeads}
        />
      </div>

      {/* Estado vazio ou tabela de contatos */}
      {filteredLeads.length === 0 ? (
        <ContactsEmptyState 
          searchQuery={searchQuery}
          onAddLead={handleOpenAddModal}
          hasFilters={filters.hasActiveFilters}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          {/* Tabela de contatos */}
          <ContactsTable
            leads={paginatedLeads}
            selectedLeadIds={selectedLeadIds}
            onSelectLead={handleSelectLead}
            onSelectAll={handleSelectAll}
            allSelected={allSelected}
            someSelected={someSelected}
            onSort={handleSort}
            sortConfig={sortConfig}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onEditLead={handleOpenEditModal}
            etapas={etapas.map(etapa => ({
              id: etapa.id,
              nome: etapa.nome,
              ordem: etapa.ordem,
              cor: etapa.cor || '#3B82F6' // Cor padrão se não existir
            }))}
          />

          {/* Botão de atualizar */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </>
      )}

      {/* Modal para adicionar/editar lead */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        lead={selectedLeadForEdit}
        onSave={handleSaveLeadData}
        etapas={etapas}
      />
    </div>
  );
};
