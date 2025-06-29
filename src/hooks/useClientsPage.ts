
/**
 * Hook para gerenciar o estado e lógica da página de clientes
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads } from './useSupabaseLeads';
import { useTagsData } from './useTagsData';
import { useEtapas } from './useEtapasData';
import { useToast } from './use-toast';
import { useClinica } from '@/contexts/ClinicaContext';
import { supabase } from '@/integrations/supabase/client';

// Interfaces para os filtros - alinhada com o que o componente espera
interface FilterState {
  status: string;
  tag: string;
  origem: string;
  servico: string;
  hasActiveFilters: boolean;
}

// Interfaces internas para compatibilidade
interface InternalFilters {
  tagId: string | null;
  origemLead: string | null;
  servicoInteresse: string | null;
  etapaId: string | null;
}

// Tipos para ordenação
type SortField = 'nome' | 'created_at' | 'email';
type SortOrder = 'asc' | 'desc';

// Interface para configuração de ordenação
interface SortConfig {
  field: SortField;
  order: SortOrder;
}

const LEADS_PER_PAGE = 10;

export const useClientsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clinicaId } = useClinica();

  // Estados para filtros e ordenação
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Estados para modais
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<any>(null);
  
  // Filtros internos
  const [internalFilters, setInternalFilters] = useState<InternalFilters>({
    tagId: null,
    origemLead: null,
    servicoInteresse: null,
    etapaId: null
  });

  // Buscar dados
  const { 
    data: leads = [], 
    isLoading: leadsLoading,
    refetch: refetchLeads
  } = useLeads();

  const { data: tags = [], isLoading: tagsLoading } = useTagsData();
  const { data: etapas = [], isLoading: etapasLoading } = useEtapas();

  const loading = leadsLoading || tagsLoading || etapasLoading;

  // Valores únicos para filtros
  const uniqueOrigens = useMemo(() => {
    return [...new Set(leads.map(lead => lead.origem_lead).filter(Boolean))] as string[];
  }, [leads]);

  const uniqueServicos = useMemo(() => {
    return [...new Set(leads.map(lead => lead.servico_interesse).filter(Boolean))] as string[];
  }, [leads]);

  // Aplicar filtros e ordenação
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Aplicar busca
    if (searchQuery) {
      result = result.filter(lead => 
        lead.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.telefone?.includes(searchQuery) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar filtros
    if (internalFilters.tagId) {
      result = result.filter(lead => lead.tag_id === internalFilters.tagId);
    }

    if (internalFilters.origemLead) {
      result = result.filter(lead => lead.origem_lead === internalFilters.origemLead);
    }

    if (internalFilters.servicoInteresse) {
      result = result.filter(lead => lead.servico_interesse === internalFilters.servicoInteresse);
    }

    if (internalFilters.etapaId) {
      result = result.filter(lead => lead.etapa_kanban_id === internalFilters.etapaId);
    }

    // Aplicar ordenação
    return result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [leads, searchQuery, internalFilters, sortField, sortOrder]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery ||
      internalFilters.tagId ||
      internalFilters.origemLead ||
      internalFilters.servicoInteresse ||
      internalFilters.etapaId
    );
  }, [searchQuery, internalFilters]);

  // Paginação
  const totalLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalLeads / LEADS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(startIndex, startIndex + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  // Configuração de ordenação para compatibilidade
  const sortConfig: SortConfig = {
    field: sortField,
    order: sortOrder
  };

  // Filtros no formato esperado pelo componente
  const filters: FilterState = {
    status: internalFilters.etapaId || '',
    tag: internalFilters.tagId || '',
    origem: internalFilters.origemLead || '',
    servico: internalFilters.servicoInteresse || '',
    hasActiveFilters
  };

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const filterMap: Record<string, keyof InternalFilters> = {
      status: 'etapaId',
      tag: 'tagId',
      origem: 'origemLead',
      servico: 'servicoInteresse'
    };

    const internalKey = filterMap[key];
    if (internalKey) {
      setInternalFilters(prev => ({
        ...prev,
        [internalKey]: value || null
      }));
    }

    // Reset da página ao alterar filtros
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setInternalFilters({
      tagId: null,
      origemLead: null,
      servicoInteresse: null,
      etapaId: null
    });
    setCurrentPage(1);
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === paginatedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(paginatedLeads.map(lead => lead.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Tem certeza que deseja deletar ${selectedLeadIds.length} leads selecionados?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeadIds);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedLeadIds.length} leads deletados com sucesso!`,
      });

      setSelectedLeadIds([]);
      refetchLeads();
    } catch (error: any) {
      console.error('Erro ao deletar leads:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar leads. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async (etapaId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ etapa_kanban_id: etapaId })
        .in('id', selectedLeadIds);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedLeadIds.length} leads atualizados com sucesso!`,
      });

      setSelectedLeadIds([]);
      refetchLeads();
    } catch (error: any) {
      console.error('Erro ao atualizar leads:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar leads. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleExportContacts = async () => {
    setIsExporting(true);
    try {
      // Lógica de exportação aqui
      const leadsToExport = selectedLeadIds.length > 0 
        ? leads.filter(lead => selectedLeadIds.includes(lead.id))
        : filteredLeads;

      // Criar CSV simples
      const csvContent = [
        ['Nome', 'Email', 'Telefone', 'Origem', 'Serviço'].join(','),
        ...leadsToExport.map(lead => [
          lead.nome || '',
          lead.email || '',
          lead.telefone || '',
          lead.origem_lead || '',
          lead.servico_interesse || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contatos.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Contatos exportados com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar contatos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddLead = () => {
    setSelectedLeadForEdit(null);
    setIsLeadModalOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setSelectedLeadForEdit(lead);
    setIsLeadModalOpen(true);
  };

  const handleOpenChat = (lead: any) => {
    navigate(`/chat?leadId=${lead.id}`);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja deletar este lead?')) {
      return;
    }

    try {
      setIsDeleting(leadId);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lead deletado com sucesso!",
      });

      refetchLeads();
    } catch (error: any) {
      console.error('Erro ao deletar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar lead. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveLead = async (leadData: any) => {
    try {
      if (selectedLeadForEdit) {
        // Atualizar lead existente
        const updateData = {
          nome: leadData.nome,
          telefone: leadData.telefone,
          email: leadData.email,
          etapa_kanban_id: leadData.etapa_kanban_id,
          tag_id: leadData.tag_id,
          anotacoes: leadData.anotacoes,
          origem_lead: leadData.origem_lead,
          servico_interesse: leadData.servico_interesse,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', selectedLeadForEdit.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lead atualizado com sucesso!",
        });
      } else {
        // Criar novo lead
        const newLeadData = {
          ...leadData,
          clinica_id: clinicaId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('leads')
          .insert([newLeadData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lead criado com sucesso!",
        });
      }

      setIsLeadModalOpen(false);
      setSelectedLeadForEdit(null);
      refetchLeads();
    } catch (error: any) {
      console.error('Erro ao salvar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar lead. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    refetchLeads();
  };

  return {
    loading,
    tags,
    etapas,
    leads,
    filteredLeads,
    selectedLeadIds,
    setSelectedLeadIds,
    selectedLead: selectedLeadForEdit,
    setSelectedLead: setSelectedLeadForEdit,
    isLeadModalOpen,
    setIsLeadModalOpen,
    searchQuery,
    setSearchQuery,
    isFilterOpen,
    setIsFilterOpen,
    filters,
    setFilters: () => {}, // placeholder para compatibilidade
    sortConfig,
    setSortConfig: () => {}, // placeholder para compatibilidade
    currentPage,
    setCurrentPage,
    leadsPerPage: LEADS_PER_PAGE,
    totalLeads,
    totalPages,
    paginatedLeads,
    isExporting,
    isDeleting,
    uniqueOrigens,
    uniqueServicos,
    hasActiveFilters,
    handleSort,
    handleFilterChange,
    clearFilters,
    handleSelectLead,
    handleSelectAll,
    handleDeleteSelected,
    handleBulkStatusUpdate,
    handleExportContacts,
    handleAddLead,
    handleEditLead,
    handleOpenChat,
    handleDeleteLead,
    handleSaveLead,
    refreshData,
  };
};
