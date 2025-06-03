
import React, { useState, useMemo } from 'react';
import { Lead } from '@/hooks/useLeadsData';
import { useLeads, useUpdateLead, useDeleteLead } from '@/hooks/useLeadsData';
import { useEtapas } from '@/hooks/useEtapasData';
import { useTags } from '@/hooks/useTagsData';
import { LeadModal } from '@/components/kanban/LeadModal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus } from 'lucide-react';
import { LeadInfoSidebar } from '@/components/chat/LeadInfoSidebar';
import { useNavigate } from 'react-router-dom';

// Componentes refatorados
import { ContactsFilters } from './ContactsFilters';
import { ContactsTable } from './ContactsTable';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';

// Tipos e utilitários
import { SortField, SortOrder, FilterState } from './types';
import { formatarData, getUniqueOrigens, getUniqueServicos } from './utils';

/**
 * Página principal de Clientes/Leads refatorada
 * 
 * Coordena os componentes filhos e gerencia o estado principal da aplicação.
 * Responsabilidades:
 * - Gerenciar estado dos filtros, ordenação e modais
 * - Coordenar comunicação entre componentes
 * - Processar dados (filtros e ordenação)
 * - Gerenciar navegação e ações CRUD
 */

const ClientsPage = () => {
  // Estados principais
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Estados de ordenação
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Estados de filtros
  const [filters, setFilters] = useState<FilterState>({
    tag: '',
    origem: '',
    servico: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Hooks de dados
  const { data: leads, isLoading, isError } = useLeads();
  const { data: etapas = [] } = useEtapas();
  const { data: tags = [] } = useTags();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const navigate = useNavigate();

  // Função para obter tag do lead
  const getLeadTag = (lead: Lead) => {
    if (!lead.tag_id) return null;
    return tags.find(tag => tag.id === lead.tag_id);
  };

  // Função para ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Leads filtrados e ordenados usando lógica do componente original
  const processedLeads = useMemo(() => {
    if (!leads) return [];

    let filtered = leads.filter(lead => {
      // Filtro de busca
      const matchesSearch = 
        lead.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.telefone?.includes(searchQuery);

      if (!matchesSearch) return false;

      // Filtro por tag
      if (filters.tag && lead.tag_id !== filters.tag) return false;

      // Filtro por origem
      if (filters.origem && lead.origem_lead !== filters.origem) return false;

      // Filtro por serviço
      if (filters.servico && lead.servico_interesse !== filters.servico) return false;

      // Filtro por período
      if (filters.dataInicio || filters.dataFim) {
        const leadDate = new Date(lead.created_at);
        if (filters.dataInicio && leadDate < filters.dataInicio) return false;
        if (filters.dataFim && leadDate > filters.dataFim) return false;
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'data_ultimo_contato':
          aValue = a.data_ultimo_contato ? new Date(a.data_ultimo_contato) : new Date(0);
          bValue = b.data_ultimo_contato ? new Date(b.data_ultimo_contato) : new Date(0);
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [leads, searchQuery, filters, sortField, sortOrder]);

  // Obter listas únicas para filtros
  const uniqueOrigens = useMemo(() => getUniqueOrigens(leads), [leads]);
  const uniqueServicos = useMemo(() => getUniqueServicos(leads), [leads]);

  // Handlers
  const handleOpenLeadModal = () => {
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };

  const handleOpenEditLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleCloseLeadModal = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
  };

  const handleOpenDetails = (lead: Lead) => {
    setDetailsLead(lead);
    setIsDetailsOpen(true);
  };

  const handleOpenChat = (lead: Lead) => {
    navigate(`/chat?leadId=${lead.id}`);
  };

  const handleLeadUpdate = async (updatedLead: Lead) => {
    try {
      await updateLead.mutateAsync({
        id: updatedLead.id,
        data: {
          nome: updatedLead.nome,
          telefone: updatedLead.telefone,
          email: updatedLead.email,
          origem_lead: updatedLead.origem_lead,
          servico_interesse: updatedLead.servico_interesse,
          anotacoes: updatedLead.anotacoes,
          etapa_kanban_id: updatedLead.etapa_kanban_id,
          tag_id: updatedLead.tag_id,
          data_ultimo_contato: updatedLead.data_ultimo_contato,
        }
      });
      
      setSelectedLead(null);
      setIsLeadModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
    }
  };

  const handleLeadDelete = async (leadId: string) => {
    try {
      await deleteLead.mutateAsync(leadId);
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      tag: '',
      origem: '',
      servico: '',
    });
    setSearchQuery('');
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = filters.tag || filters.origem || filters.servico;

  // Renderização condicional para loading
  if (isLoading) {
    return <ContactsLoadingState />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Erro ao carregar leads</h3>
          <p className="text-sm text-gray-500">Ocorreu um erro ao buscar os dados dos leads.</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca e ações */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Contatos ({processedLeads.length})
        </h2>
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Pesquisar contatos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          
          {/* Componente de Filtros */}
          <ContactsFilters
            filters={filters}
            setFilters={setFilters}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            tags={tags}
            uniqueOrigens={uniqueOrigens}
            uniqueServicos={uniqueServicos}
            onClearFilters={clearFilters}
          />

          <Button onClick={handleOpenLeadModal}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Lead
          </Button>
        </div>
      </div>

      {/* Tabela de Contatos ou Estado Vazio */}
      {processedLeads.length === 0 ? (
        <div className="rounded-md border p-8">
          <ContactsEmptyState
            hasFilters={hasActiveFilters}
            searchQuery={searchQuery}
            onClearFilters={clearFilters}
            onAddLead={handleOpenLeadModal}
          />
        </div>
      ) : (
        <ContactsTable
          leads={processedLeads}
          tags={tags}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEditLead={handleOpenEditLeadModal}
          onViewDetails={handleOpenDetails}
          onOpenChat={handleOpenChat}
          onDeleteLead={handleLeadDelete}
        />
      )}

      {/* Modal de Lead */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={handleCloseLeadModal}
        lead={selectedLead}
        etapas={etapas}
        onSave={handleLeadUpdate}
      />

      {/* Sheet de Detalhes */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes do Contato</SheetTitle>
            <SheetDescription>
              Informações completas sobre {detailsLead?.nome}
            </SheetDescription>
          </SheetHeader>
          {detailsLead && (
            <div className="mt-6">
              <LeadInfoSidebar
                lead={detailsLead}
                tags={detailsLead.tag_id ? [getLeadTag(detailsLead)].filter(Boolean) : []}
                onEditLead={() => {
                  handleOpenEditLeadModal(detailsLead);
                  setIsDetailsOpen(false);
                }}
                onCallLead={() => {
                  if (detailsLead.telefone) {
                    window.open(`tel:${detailsLead.telefone}`, '_self');
                  }
                }}
                onScheduleAppointment={() => {
                  navigate('/agenda');
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClientsPage;
