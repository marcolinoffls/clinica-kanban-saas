
/**
 * Hook para gerenciar o estado e lógica da página de clientes
 */
import { useState, useMemo } from 'react';
import { useRouter } from 'react-router-dom';
import { useSupabaseLeads } from './useSupabaseLeads';
import { useTagsData } from './useTagsData';
import { useEtapasData } from './useEtapasData';
import { useToast } from './use-toast';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAdminCheck } from './useAdminCheck';
import { supabase } from '@/integrations/supabase/client';

// Interfaces para os filtros
interface Filters {
  tagId: string | null;
  origemLead: string | null;
  servicoInteresse: string | null;
  etapaId: string | null;
}

// Tipos para ordenação
type SortField = 'nome' | 'created_at' | 'email';
type SortOrder = 'asc' | 'desc';

export const useClientsPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { clinicaId } = useClinica();
  const { isAdmin } = useAdminCheck();

  // Estados para filtros e ordenação
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Estados para modais
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<any>(null);
  
  // Filtros
  const [filters, setFilters] = useState<Filters>({
    tagId: null,
    origemLead: null,
    servicoInteresse: null,
    etapaId: null
  });

  // Buscar dados - com filtro explícito por clinica_id
  const { 
    data: leads = [], 
    isLoading: leadsLoading 
  } = useSupabaseLeads({
    clinicaId: isAdmin ? undefined : clinicaId, // Para admin, buscar de todas as clínicas
    enabled: !!clinicaId || isAdmin
  });

  const { data: tags = [], isLoading: tagsLoading } = useTagsData();
  const { data: etapas = [], isLoading: etapasLoading } = useEtapasData();

  const loading = leadsLoading || tagsLoading || etapasLoading;

  // Valores únicos para filtros
  const uniqueOrigens = useMemo(() => {
    return [...new Set(leads.map(lead => lead.origem_lead).filter(Boolean))];
  }, [leads]);

  const uniqueServicos = useMemo(() => {
    return [...new Set(leads.map(lead => lead.servico_interesse).filter(Boolean))];
  }, [leads]);

  // Aplicar filtros e ordenação
  const sortedLeads = useMemo(() => {
    let filteredLeads = leads;

    // Aplicar busca
    if (searchQuery) {
      filteredLeads = filteredLeads.filter(lead => 
        lead.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.telefone?.includes(searchQuery) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar filtros
    if (filters.tagId) {
      filteredLeads = filteredLeads.filter(lead => lead.tag_id === filters.tagId);
    }

    if (filters.origemLead) {
      filteredLeads = filteredLeads.filter(lead => lead.origem_lead === filters.origemLead);
    }

    if (filters.servicoInteresse) {
      filteredLeads = filteredLeads.filter(lead => lead.servico_interesse === filters.servicoInteresse);
    }

    if (filters.etapaId) {
      filteredLeads = filteredLeads.filter(lead => lead.etapa_kanban_id === filters.etapaId);
    }

    // Aplicar ordenação
    return filteredLeads.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [leads, searchQuery, filters, sortField, sortOrder]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery ||
      filters.tagId ||
      filters.origemLead ||
      filters.servicoInteresse ||
      filters.etapaId
    );
  }, [searchQuery, filters]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddLead = () => {
    setSelectedLeadForEdit(null);
    setIsLeadModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({
      tagId: null,
      origemLead: null,
      servicoInteresse: null,
      etapaId: null
    });
  };

  const handleEditLead = (lead: any) => {
    setSelectedLeadForEdit(lead);
    setIsLeadModalOpen(true);
  };

  const handleOpenChat = (lead: any) => {
    router.push(`/chat?leadId=${lead.id}`);
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

      // Atualizar lista (o hook já fará isso automaticamente)
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
    } catch (error: any) {
      console.error('Erro ao salvar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar lead. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return {
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
  };
};
