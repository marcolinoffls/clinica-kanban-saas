
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads, Lead, useDeleteLead, useUpdateLead, useCreateLead } from '@/hooks/useLeadsData';
import { useTags } from '@/hooks/useTagsData';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { FilterState, SortField, SortOrder } from '@/components/clients/types';
import { getUniqueOrigens, getUniqueServicos } from '@/components/clients/utils';

/**
 * Hook para gerenciar a lógica da página de Clientes/Leads.
 * 
 * Este hook encapsula todos os estados, filtros, ordenação e 
 * manipuladores de eventos da página de contatos, simplificando o
 * componente principal.
 * 
 * Retorna:
 * - Estados de carregamento, dados, filtros, ordenação e modais.
 * - Listas de leads filtradas e ordenadas.
 * - Funções para manipular ações do usuário (adicionar, editar, etc.).
 */
export const useClientsPage = () => {
  const navigate = useNavigate();
  
  // Hooks para dados e mutações
  const { data: leads = [], isLoading: loading } = useLeads();
  const { data: tags = [] } = useTags();
  const { etapas = [] } = useSupabaseData();
  const deleteLeadMutation = useDeleteLead();
  const updateLeadMutation = useUpdateLead();
  const createLeadMutation = useCreateLead();

  // Estados locais
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);

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
      const matchesSearch = !searchQuery || 
        lead.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !filters.tag || lead.tag_id === filters.tag;
      const matchesOrigem = !filters.origem || lead.origem_lead === filters.origem;
      const matchesServico = !filters.servico || lead.servico_interesse === filters.servico;
      let matchesDate = true;
      if (filters.dataInicio || filters.dataFim) {
        const leadDate = lead.created_at ? new Date(lead.created_at) : null;
        if (leadDate) {
          if (filters.dataInicio) matchesDate = matchesDate && leadDate >= new Date(filters.dataInicio);
          if (filters.dataFim) matchesDate = matchesDate && leadDate <= new Date(filters.dataFim);
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
      let aValue: any, bValue: any;
      switch (sortField) {
        case 'nome': aValue = a.nome || ''; bValue = b.nome || ''; break;
        case 'email': aValue = a.email || ''; bValue = b.email || ''; break;
        case 'data_ultimo_contato':
          aValue = a.data_ultimo_contato ? new Date(a.data_ultimo_contato).getTime() : 0;
          bValue = b.data_ultimo_contato ? new Date(b.data_ultimo_contato).getTime() : 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        default: return 0;
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortOrder]);

  // Handlers
  const handleSort = (field: SortField) => {
    setSortField(field);
    setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // CORRIGIDO: Função para abrir modal de novo lead ao invés de redirecionar
  const handleAddLead = () => {
    console.log('🆕 Abrindo modal para criar novo lead na página de contatos');
    setSelectedLeadForEdit(null);
    setIsLeadModalOpen(true);
  };

  const handleClearFilters = () => {
    setFilters({ tag: '', origem: '', servico: '', dataInicio: undefined, dataFim: undefined });
    setSearchQuery('');
    setIsFilterOpen(false);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setIsLeadModalOpen(true);
  };

  const handleOpenChat = (lead: Lead) => navigate(`/chat?leadId=${lead.id}`);

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      setIsDeleting(true);
      await deleteLeadMutation.mutateAsync(leadId);
      setIsDeleting(false);
    }
  };

  // CORRIGIDO: Função para salvar lead - tanto criar quanto editar
  const handleSaveLead = async (leadData: any) => {
    try {
      if (selectedLeadForEdit) {
        // Editando lead existente
        await updateLeadMutation.mutateAsync({ 
          id: selectedLeadForEdit.id, 
          ...leadData 
        });
      } else {
        // Criando novo lead
        await createLeadMutation.mutateAsync(leadData);
      }
      setIsLeadModalOpen(false);
      setSelectedLeadForEdit(null);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      throw error; // Permite que o modal trate o erro
    }
  };

  const hasActiveFilters = Boolean(filters.tag || filters.origem || filters.servico || filters.dataInicio || filters.dataFim || searchQuery);

  return {
    loading, tags, etapas, searchQuery, setSearchQuery, isFilterOpen, setIsFilterOpen,
    sortField, sortOrder, isDeleting, isLeadModalOpen, setIsLeadModalOpen,
    selectedLeadForEdit, setSelectedLeadForEdit, filters, setFilters, uniqueOrigens,
    uniqueServicos, sortedLeads, hasActiveFilters, handleSort, handleAddLead,
    handleClearFilters, handleEditLead, handleOpenChat, handleDeleteLead, handleSaveLead,
  };
};
