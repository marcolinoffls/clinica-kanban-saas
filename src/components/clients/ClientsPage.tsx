
/**
 * =================================================================
 * ARQUIVO: ClientsPage.tsx
 * =================================================================
 *
 * DESCRIÇÃO:
 * Componente principal que renderiza a página de "Contatos".
 * Ele utiliza o hook `useClientsPage` para obter toda a lógica de
 * manipulação de dados, filtros e estados de modais. A responsabilidade
 * deste componente é apenas organizar a estrutura da UI.
 *
 * CORREÇÃO:
 * A função `handleAddLead` do hook `useClientsPage` foi conectada
 * corretamente ao prop `onAddLead` do componente `ClientsPageHeader`.
 * Isso garante que ao clicar no botão "Adicionar Lead", o modal
 * de criação seja aberto. Além disso, o modal `LeadModal` também foi
 * adicionado para o caso de criação de um novo lead (quando não há
 * um lead selecionado para edição).
 *
 */
import React from 'react';
import { useClientsPage } from '@/hooks/useClientsPage';
import { ContactsTable } from './ContactsTable';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';
import { LeadModal } from '@/components/kanban/LeadModal';
import { ClientsPageHeader } from './ClientsPageHeader';
import { ClientsActionsBar } from './ClientsActionsBar';

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
          tag: filters.tagId,
          origem: filters.origemLead,
          servico: filters.servicoInteresse,
          etapa: filters.etapaId
        }}
        setFilters={(newFilters) => setFilters({
          tagId: newFilters.tag,
          origemLead: newFilters.origem,
          servicoInteresse: newFilters.servico,
          etapaId: newFilters.etapa
        })}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        tags={tags}
        uniqueOrigens={uniqueOrigens}
        uniqueServicos={uniqueServicos}
        onClearFilters={handleClearFilters}
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
          isDeleting={typeof isDeleting === 'boolean' ? null : isDeleting}
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
