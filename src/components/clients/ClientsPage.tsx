import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Lead, useLeads } from '@/hooks/useLeadsData';
import { ContactsTable } from './ContactsTable';
import { ContactsFilters } from './ContactsFilters';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';
import { FilterState, SortField, SortOrder } from './types';
import { useTags } from '@/hooks/useTagsData';
import { LeadModal } from '@/components/kanban/LeadModal';
import { getUniqueOrigens, getUniqueServicos } from './utils';

/**
 * Página Principal de Clientes/Leads
 * 
 * Funcionalidades principais:
 * - Lista todos os contatos da clínica
 * - Busca e filtros avançados
 * - Ordenação de colunas
 * - Ações rápidas (editar, chat, excluir)
 * - Painel de detalhes lateral
 * - Estados de carregamento e vazio
 * 
 * Conecta com:
 * - useSupabaseData para dados dos leads
 * - useTagsData para informações das tags
 * - Sistema de navegação para chat e edição
 */

const ClientsPage = () => {
  const navigate = useNavigate();
  
  // Hooks para dados
  const { data: leads = [], isLoading: loading } = useLeads();
  const { data: tags = [] } = useTags();
  
  // Estados locais
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);

  const { etapas = [] } = useSupabaseData();

  // Estado dos filtros
  const [filters, setFilters] = useState<FilterState>({
    tag: '',
    origem: '',
    servico: '',
    dataInicio: undefined,
    dataFim: undefined,
  });

  // Dados únicos para filtros
  const uniqueOrigens = useMemo(() => getUniqueOrigens(leads), [leads]);
  const uniqueServicos = useMemo(() => getUniqueServicos(leads), [leads]);

  // Função para aplicar filtros e busca
  const filteredLeads = useMemo(() => {
    if (!leads) return [];

    return leads.filter((lead: Lead) => {
      // Filtro de busca por nome ou email
      const matchesSearch = !searchQuery || 
        lead.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filtro por tag
      const matchesTag = !filters.tag || lead.tag_id === filters.tag;

      // Filtro por origem
      const matchesOrigem = !filters.origem || lead.origem_lead === filters.origem;

      // Filtro por serviço
      const matchesServico = !filters.servico || lead.servico_interesse === filters.servico;

      // Filtro por data - CORREÇÃO: garantir que matchesDate seja sempre boolean
      let matchesDate = true;
      if (filters.dataInicio || filters.dataFim) {
        const leadDate = lead.created_at ? new Date(lead.created_at) : null;
        if (leadDate) {
          if (filters.dataInicio) {
            const startDate = new Date(filters.dataInicio);
            matchesDate = matchesDate && leadDate >= startDate;
          }
          if (filters.dataFim) {
            const endDate = new Date(filters.dataFim);
            matchesDate = matchesDate && leadDate <= endDate;
          }
        } else {
          matchesDate = false;
        }
      }

      return matchesSearch && matchesTag && matchesOrigem && matchesServico && matchesDate;
    });
  }, [leads, searchQuery, filters]);

  // Função para aplicar ordenação
  const sortedLeads = useMemo(() => {
    if (!filteredLeads.length) return [];

    return [...filteredLeads].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = a.nome || '';
          bValue = b.nome || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'data_ultimo_contato':
          aValue = a.data_ultimo_contato ? new Date(a.data_ultimo_contato).getTime() : 0;
          bValue = b.data_ultimo_contato ? new Date(b.data_ultimo_contato).getTime() : 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortOrder]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  /**
   * Handler para o botão "Adicionar Lead".
   * Redireciona o usuário para a página do Funil (/pipeline),
   * que agora é a página principal para gerenciar e criar leads.
   */
  const handleAddLead = () => {
    navigate('/pipeline');
  };

  const handleEditLead = (lead: Lead) => {
    console.log('🔧 Editando lead:', lead);
    setSelectedLeadForEdit(lead);
    setIsLeadModalOpen(true);
  };

  const handleOpenChat = (lead: Lead) => {
    console.log('💬 Abrindo chat com lead:', lead);
    navigate(`/chat?leadId=${lead.id}`);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      setIsDeleting(true);
      try {
        console.log('Deletar lead:', leadId);
        // TODO: Implementar exclusão de lead
      } catch (error) {
        console.error('Erro ao deletar lead:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSaveLead = async (leadData: any) => {
    try {
      console.log('💾 Salvando alterações do lead:', leadData);
      // TODO: Implementar salvamento via hook
      setIsLeadModalOpen(false);
      setSelectedLeadForEdit(null);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = Boolean(filters.tag || filters.origem || filters.servico || 
                          filters.dataInicio || filters.dataFim);

  // Renderização condicional baseada no estado
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Contatos</h1>
        </div>
        <ContactsLoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contatos</h1>
        <Button onClick={handleAddLead}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Lead
        </Button>
      </div>

      {/* Barra de busca e filtros */}
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
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Tabela ou estados especiais */}
      {sortedLeads.length > 0 ? (
        <ContactsTable
          leads={sortedLeads}
          tags={tags || []}
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
    </div>
  );
};

export default ClientsPage;
