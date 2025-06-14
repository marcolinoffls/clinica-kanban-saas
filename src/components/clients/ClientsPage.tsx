import React, { useMemo } from 'react';
import { useClientsPage } from '@/hooks/useClientsPage';
import { ContactsTable } from './ContactsTable';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';
import { LeadModal } from '@/components/kanban/LeadModal';
import { ClientsPageHeader } from './ClientsPageHeader';
import { ClientsActionsBar } from './ClientsActionsBar';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LeadInfoSidebar } from "@/components/chat/LeadInfoSidebar";

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
    viewedLead,
    leadAgendamentos,
    leadHistory,
    handleViewLeadDetails,
    handleCloseLeadDetails,
  } = useClientsPage();

  // NOVO: Lógica para encontrar próxima e última consulta
  const { proximaConsulta, ultimaConsulta } = useMemo(() => {
    if (!leadAgendamentos || leadAgendamentos.length === 0) {
      return { proximaConsulta: null, ultimaConsulta: null };
    }
    const now = new Date();
    const proxima = leadAgendamentos
      .filter(a => (a.status === 'agendado' || a.status === 'confirmado') && new Date(a.data_inicio) > now)
      .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())[0];
    
    const ultima = leadAgendamentos
      .filter(a => (a.status === 'realizado' || a.status === 'pago') && new Date(a.data_inicio) < now)
      .sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime())[0];

    return { proximaConsulta: proxima, ultimaConsulta: ultima };
  }, [leadAgendamentos]);

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
          onViewDetails={handleViewLeadDetails}
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
      
      {/* NOVO: Barra lateral de detalhes do lead */}
      <Sheet open={!!viewedLead} onOpenChange={(isOpen) => !isOpen && handleCloseLeadDetails()}>
        <SheetContent className="p-0 w-[380px] sm:max-w-md overflow-y-auto">
          {viewedLead && (
            <LeadInfoSidebar
              lead={viewedLead}
              tags={tags.filter(t => t.id === viewedLead.tag_id)}
              historico={leadHistory as any}
              onEdit={() => handleEditLead(viewedLead)}
              ultimaConsulta={ultimaConsulta}
              proximaConsulta={proximaConsulta}
              // Ações podem ser implementadas no futuro se necessário
              onCallLead={() => alert('Função de ligar não implementada.')}
              onScheduleAppointment={() => alert('Função de agendar não implementada.')}
              onViewHistory={() => alert('Histórico já visível na barra lateral.')}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClientsPage;
