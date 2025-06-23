
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';
import { useAdminCheck } from './useAdminCheck';
import { useTagsData } from './useTagsData';
import { useEtapasKanban } from './useEtapasKanban';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from './useSupabaseLeads';
import { toast } from 'sonner';

/**
 * Hook para gerenciar a página de contatos/leads
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Filtro explícito por clinica_id para usuários comuns
 * - Para administradores, busca apenas dados da clínica selecionada
 * - Não depende mais apenas de RLS para filtrar os dados
 * 
 * O que faz:
 * - Gerencia todos os estados da página de contatos
 * - Controla filtros, ordenação e modais
 * - Aplica filtros explícitos por clínica
 * 
 * Como se conecta:
 * - useClinicaData para obter clinica_id do usuário
 * - useAdminCheck para verificar se é admin
 * - useLeads com filtro explícito por clínica
 */

interface Contact {
  id: string;
  created_at: string;
  nome: string;
  telefone: string;
  email: string;
  origem_lead: string;
  servico_interesse: string;
  anotacoes: string;
  tag_id: string | null;
  clinica_id: string;
  etapa_kanban_id: string;
  updated_at: string;
}

interface Filters {
  tagId: string | null;
  origemLead: string | null;
  servicoInteresse: string | null;
  etapaId: string | null;
}

export const useClientsPage = () => {
  // Estados básicos
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<'nome' | 'created_at' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Estados dos modais
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Contact | null>(null);
  
  // Estados dos filtros
  const [filters, setFilters] = useState<Filters>({
    tagId: null,
    origemLead: null,
    servicoInteresse: null,
    etapaId: null,
  });

  // Hooks de dados - com correção do problema crítico
  const { clinicaId, loading: clinicaLoading } = useClinicaData();
  const { isAdmin } = useAdminCheck();
  
  // CORREÇÃO: Buscar leads apenas da clínica específica
  // Para usuários comuns: usar clinica_id do perfil
  // Para admins: permitir seleção de clínica (implementado em outros componentes)
  const targetClinicaId = clinicaId;
  
  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeads({
    enabled: !!targetClinicaId, // Só busca se tiver clinica_id definido
    // Aplicar filtro explícito via query params se necessário
  });

  const { data: tags } = useTagsData();
  const { data: etapas } = useEtapasKanban();
  
  // Mutations
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();

  // CORREÇÃO: Filtrar leads explicitamente por clinica_id
  const filteredLeadsByClinica = useMemo(() => {
    if (!leads || !targetClinicaId) return [];
    
    // Filtro explícito por clínica - não depende apenas de RLS
    return leads.filter(lead => lead.clinica_id === targetClinicaId);
  }, [leads, targetClinicaId]);

  // Aplicar filtros de busca e outros filtros
  const filteredLeads = useMemo(() => {
    let result = filteredLeadsByClinica;

    // Filtro por termo de busca
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      result = result.filter(lead =>
        (lead.nome || '').toLowerCase().includes(searchTerm) ||
        (lead.telefone || '').includes(searchTerm) ||
        (lead.email || '').toLowerCase().includes(searchTerm) ||
        (lead.origem_lead || '').toLowerCase().includes(searchTerm) ||
        (lead.servico_interesse || '').toLowerCase().includes(searchTerm)
      );
    }

    // Aplicar outros filtros
    if (filters.tagId) {
      result = result.filter(lead => lead.tag_id === filters.tagId);
    }
    
    if (filters.origemLead) {
      result = result.filter(lead => lead.origem_lead === filters.origemLead);
    }
    
    if (filters.servicoInteresse) {
      result = result.filter(lead => lead.servico_interesse === filters.servicoInteresse);
    }
    
    if (filters.etapaId) {
      result = result.filter(lead => lead.etapa_kanban_id === filters.etapaId);
    }

    return result;
  }, [filteredLeadsByClinica, searchQuery, filters]);

  // Ordenar leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nome':
          aValue = (a.nome || '').toLowerCase();
          bValue = (b.nome || '').toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredLeads, sortField, sortOrder]);

  // Valores únicos para filtros
  const uniqueOrigens = useMemo(() => {
    const origens = filteredLeadsByClinica
      .map(lead => lead.origem_lead)
      .filter(Boolean);
    return [...new Set(origens)];
  }, [filteredLeadsByClinica]);

  const uniqueServicos = useMemo(() => {
    const servicos = filteredLeadsByClinica
      .map(lead => lead.servico_interesse)
      .filter(Boolean);
    return [...new Set(servicos)];
  }, [filteredLeadsByClinica]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== null) || searchQuery.trim() !== '';
  }, [filters, searchQuery]);

  // Handlers
  const handleSort = (field: 'nome' | 'created_at' | 'updated_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleAddLead = () => {
    setSelectedLeadForEdit(null);
    setIsLeadModalOpen(true);
  };

  const handleEditLead = (lead: Contact) => {
    setSelectedLeadForEdit(lead);
    setIsLeadModalOpen(true);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    setIsDeleting(leadId);
    try {
      await deleteLeadMutation.mutateAsync(leadId);
      toast.success('Lead excluído com sucesso');
      refetchLeads();
    } catch (error) {
      toast.error('Erro ao excluir lead');
      console.error('Erro ao excluir lead:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveLead = async (leadData: Partial<Contact>) => {
    try {
      if (selectedLeadForEdit) {
        // Atualizar lead existente
        await updateLeadMutation.mutateAsync({
          leadId: selectedLeadForEdit.id,
          ...leadData
        });
        toast.success('Lead atualizado com sucesso');
      } else {
        // Criar novo lead
        await createLeadMutation.mutateAsync({
          ...leadData,
          clinica_id: targetClinicaId // Garantir que o lead seja criado na clínica correta
        });
        toast.success('Lead criado com sucesso');
      }
      
      setIsLeadModalOpen(false);
      setSelectedLeadForEdit(null);
      refetchLeads();
    } catch (error) {
      toast.error('Erro ao salvar lead');
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleOpenChat = (lead: Contact) => {
    // Navegar para o chat com o lead selecionado
    window.location.href = `/chat?lead=${lead.id}`;
  };

  const handleClearFilters = () => {
    setFilters({
      tagId: null,
      origemLead: null,
      servicoInteresse: null,
      etapaId: null,
    });
    setSearchQuery('');
  };

  // Estado de carregamento combinado
  const loading = clinicaLoading || leadsLoading;

  return {
    // Dados
    leads: sortedLeads,
    tags: tags || [],
    etapas: etapas || [],
    loading,
    
    // Estados de busca e filtro
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    isFilterOpen,
    setIsFilterOpen,
    
    // Estados de ordenação
    sortField,
    sortOrder,
    handleSort,
    
    // Estados de modal
    isLeadModalOpen,
    setIsLeadModalOpen,
    selectedLeadForEdit,
    setSelectedLeadForEdit,
    
    // Estados de operações
    isDeleting,
    
    // Dados processados
    uniqueOrigens,
    uniqueServicos,
    sortedLeads,
    hasActiveFilters,
    
    // Handlers
    handleAddLead,
    handleEditLead,
    handleDeleteLead,
    handleSaveLead,
    handleOpenChat,
    handleClearFilters,
    
    // Informações de contexto
    targetClinicaId,
    isAdmin
  };
};
