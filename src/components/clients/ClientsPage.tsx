
import React from 'react';
import { useClientsPage } from '@/hooks/useClientsPage';
import { ContactsTable } from './ContactsTable';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';
import { LeadModal } from '@/components/kanban/LeadModal';
import { ClientsPageHeader } from './ClientsPageHeader';
import { ClientsActionsBar } from './ClientsActionsBar';

/**
 * Componente principal da página de Contatos
 * 
 * O que faz:
 * - Renderiza lista de leads/contatos em formato de tabela
 * - Permite buscar, filtrar e ordenar contatos
 * - Integra modal para criar/editar leads
 * - Conecta com funcionalidades de chat e exclusão
 * 
 * Onde é usado:
 * - Menu principal do sistema (/contatos)
 * - Dashboard de gestão de leads
 * 
 * Como se conecta:
 * - Hook useClientsPage centraliza toda lógica
 * - Componentes de UI para tabela e filtros
 * - Modal LeadModal do sistema Kanban
 */

const ClientsPage = () => {
  // O hook 'useClientsPage' centraliza toda a lógica e estado da página.
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

  // Renderização condicional enquanto os dados estão carregando.
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
      {/* Cabeçalho da página.
        A função handleAddLead do hook é passada aqui para ser chamada pelo botão.
      */}
      <ClientsPageHeader onAddLead={handleAddLead} />
      
      {/* Barra com campo de busca e botão de filtros. */}
      <ClientsActionsBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filters={{
          tag: filters.tagId || '',
          origem: filters.origemLead || '',
          servico: filters.servicoInteresse || '',
          hasActiveFilters
        }}
        setFilters={(newFilters) => {
          // Tratamento correto dos tipos para compatibilidade
          if (typeof newFilters === 'function') {
            // Se for uma função, chama ela com o estado atual
            const currentFilters = {
              tag: filters.tagId || '',
              origem: filters.origemLead || '',
              servico: filters.servicoInteresse || '',
              hasActiveFilters
            };
            const updatedFilters = newFilters(currentFilters);
            setFilters({
              tagId: updatedFilters.tag || null,
              origemLead: updatedFilters.origem || null,
              servicoInteresse: updatedFilters.servico || null,
              etapaId: null,
              hasActiveFilters: Boolean(updatedFilters.tag || updatedFilters.origem || updatedFilters.servico)
            });
          } else if (typeof newFilters === 'object' && newFilters !== null && 'tag' in newFilters) {
            setFilters({
              tagId: newFilters.tag || null,
              origemLead: newFilters.origem || null,
              servicoInteresse: newFilters.servico || null,
              etapaId: null,
              hasActiveFilters: Boolean(newFilters.tag || newFilters.origem || newFilters.servico)
            });
          }
        }}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        tags={tags}
        uniqueOrigens={uniqueOrigens}
        uniqueServicos={uniqueServicos}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Exibe a tabela de contatos ou um estado de vazio se não houver dados. */}
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
      
      {/* Modal para Criar ou Editar um Lead.
        É o mesmo modal usado no Kanban.
        A sua visibilidade é controlada pela variável `isLeadModalOpen`.
      */}
      {isLeadModalOpen && (
        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => {
            setIsLeadModalOpen(false);
            setSelectedLeadForEdit(null); // Limpa o lead selecionado ao fechar.
          }}
          // Se `selectedLeadForEdit` existir, o modal abre em modo de edição.
          // Se for nulo, abre em modo de criação.
          lead={selectedLeadForEdit}
          etapas={etapas}
          onSave={handleSaveLead}
        />
      )}
    </div>
  );
};

export default ClientsPage;
