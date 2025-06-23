
import React, { useState, useMemo } from 'react';
import { ContactsTable } from './ContactsTable';
import { ContactsFilters } from './ContactsFilters';
import { ClientsActionsBar } from './ClientsActionsBar';
import { ContactsEmptyState } from './ContactsEmptyState';
import { ContactsLoadingState } from './ContactsLoadingState';
import { useClientsPage } from '@/hooks/useClientsPage';
import { FilterState } from './types';

/**
 * 📋 Página Principal de Clientes/Contatos
 * 
 * O que faz:
 * - Lista todos os leads/contatos da clínica
 * - Sistema de filtros avançado (busca, tags, etapas, origem)
 * - Ordenação personalizável
 * - Estados de loading e vazio
 * - Ações rápidas (adicionar lead, visualizar detalhes)
 * 
 * Onde é usado:
 * - Rota /contatos no sistema principal
 * 
 * Como se conecta:
 * - useClientsPage: hook principal para dados e operações
 * - ContactsTable: tabela de exibição dos contatos
 * - ContactsFilters: sistema de filtros
 * - ClientsActionsBar: ações rápidas
 */
export const ClientsPage = () => {
  const {
    leads,
    etapas,
    tags,
    loading,
    handleAddLead,
    handleViewLead,
    handleDeleteLead,
    handleUpdateLead,
  } = useClientsPage();

  // Estado dos filtros
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    tags: [],
    etapas: [],
    origemLead: [],
    sortBy: 'created_at',
    sortOrder: 'desc',
    dateRange: {
      start: null,
      end: null,
    },
  });

  // Função para atualizar filtros
  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Função para limpar filtros
  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      tags: [],
      etapas: [],
      origemLead: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
      dateRange: {
        start: null,
        end: null,
      },
    });
  };

  // Filtros computados com indicador de filtros ativos
  const filtersWithActiveIndicator = useMemo(() => {
    const hasActiveFilters = Boolean(
      filters.searchTerm ||
      filters.tags.length > 0 ||
      filters.etapas.length > 0 ||
      filters.origemLead.length > 0 ||
      filters.dateRange.start ||
      filters.dateRange.end
    );

    return {
      ...filters,
      hasActiveFilters,
    };
  }, [filters]);

  // Aplicar filtros aos leads
  const filteredLeads = useMemo(() => {
    if (!leads) return [];

    return leads.filter(lead => {
      // Filtro de busca por texto
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          lead.nome?.toLowerCase().includes(searchTerm) ||
          lead.telefone?.toLowerCase().includes(searchTerm) ||
          lead.email?.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Filtro por tags
      if (filters.tags.length > 0) {
        if (!lead.tag_id || !filters.tags.includes(lead.tag_id)) return false;
      }

      // Filtro por etapas
      if (filters.etapas.length > 0) {
        if (!lead.etapa_kanban_id || !filters.etapas.includes(lead.etapa_kanban_id)) return false;
      }

      // Filtro por origem
      if (filters.origemLead.length > 0) {
        if (!lead.origem_lead || !filters.origemLead.includes(lead.origem_lead)) return false;
      }

      // Filtro por data
      if (filters.dateRange.start || filters.dateRange.end) {
        const leadDate = new Date(lead.created_at);
        if (filters.dateRange.start && leadDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && leadDate > filters.dateRange.end) return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Estados de loading e vazio
  if (loading) {
    return <ContactsLoadingState />;
  }

  if (!leads || leads.length === 0) {
    return <ContactsEmptyState onAddLead={handleAddLead} />;
  }

  return (
    <div className="space-y-6">
      {/* Barra de Ações */}
      <ClientsActionsBar
        onAddLead={handleAddLead}
        filters={filters}
        totalContacts={filteredLeads.length}
      />

      {/* Filtros */}
      <ContactsFilters
        filters={filtersWithActiveIndicator}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        totalResults={filteredLeads.length}
      />

      {/* Tabela de Contatos */}
      {filteredLeads.length > 0 ? (
        <ContactsTable
          leads={filteredLeads}
          etapas={etapas}
          tags={tags}
          onViewLead={handleViewLead}
          onDeleteLead={handleDeleteLead}
          onUpdateLead={handleUpdateLead}
        />
      ) : (
        <ContactsEmptyState onAddLead={handleAddLead} />
      )}
    </div>
  );
};
