
import React, { useState, useMemo } from 'react';
import { useClientsPage } from '@/hooks/useClientsPage';
import { ContactsTable } from './ContactsTable';
import { ContactsFilters } from './ContactsFilters';
import { ContactsEmptyState } from './ContactsEmptyState';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ClientsPageHeader } from './ClientsPageHeader';
import { ClientsActionsBar } from './ClientsActionsBar';
import { toast } from 'sonner';

/**
 * Página principal de Contatos/Clientes
 * 
 * DESCRIÇÃO:
 * Centraliza toda a funcionalidade de gerenciamento de contatos.
 * Integra busca, filtros, ações em lote e visualização em tabela.
 * 
 * FUNCIONALIDADES:
 * - Listagem paginada de contatos
 * - Sistema de busca e filtros avançados
 * - Seleção múltipla para ações em lote
 * - Estados de carregamento e vazio
 * - Integração com dados do Supabase via RLS
 * 
 * INTEGRAÇÃO:
 * - Hook useClientsPage para lógica de negócio
 * - Componentes especializados para cada funcionalidade
 * - Sistema de filtros com estado local
 */

export const ClientsPage = () => {
  // Hook principal que gerencia todos os dados e operações
  const {
    contatos,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    originFilter,
    setOriginFilter,
    selectedContacts,
    setSelectedContacts,
    currentPage,
    setCurrentPage,
    totalPages,
    handleDeleteContacts,
    handleBulkStatusUpdate,
    handleExportContacts,
    refreshContacts
  } = useClientsPage();

  // Estados locais para controle da interface
  const [isExporting, setIsExporting] = useState(false);

  // Função para exportar contatos selecionados
  const handleExport = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Selecione pelo menos um contato para exportar');
      return;
    }

    try {
      setIsExporting(true);
      await handleExportContacts();
      toast.success(`${selectedContacts.length} contatos exportados com sucesso`);
    } catch (error) {
      console.error('Erro ao exportar contatos:', error);
      toast.error('Erro ao exportar contatos');
    } finally {
      setIsExporting(false);
    }
  };

  // Função para deletar contatos selecionados
  const handleDelete = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Selecione pelo menos um contato para deletar');
      return;
    }

    try {
      await handleDeleteContacts();
      setSelectedContacts([]);
      toast.success(`${selectedContacts.length} contatos deletados com sucesso`);
    } catch (error) {
      console.error('Erro ao deletar contatos:', error);
      toast.error('Erro ao deletar contatos');
    }
  };

  // Função para atualizar status em lote
  const handleStatusUpdate = async (newStatus: string) => {
    if (selectedContacts.length === 0) {
      toast.error('Selecione pelo menos um contato para atualizar');
      return;
    }

    try {
      await handleBulkStatusUpdate(newStatus);
      setSelectedContacts([]);
      toast.success(`Status de ${selectedContacts.length} contatos atualizado para ${newStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status dos contatos');
    }
  };

  // Função para selecionar/deselecionar todos os contatos visíveis
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allContactIds = contatos.map(contato => contato.id);
      setSelectedContacts(allContactIds);
    } else {
      setSelectedContacts([]);
    }
  };

  // Função para alternar seleção de um contato específico
  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  // Verificar se todos os contatos visíveis estão selecionados
  const allSelected = useMemo(() => {
    if (contatos.length === 0) return false;
    return contatos.every(contato => selectedContacts.includes(contato.id));
  }, [contatos, selectedContacts]);

  // Verificar se alguns contatos estão selecionados (para estado indeterminado)
  const someSelected = useMemo(() => {
    return selectedContacts.length > 0 && !allSelected;
  }, [selectedContacts.length, allSelected]);

  // Exibir erro se houver
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar contatos: {error}</p>
          <button
            onClick={refreshContacts}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Cabeçalho da página */}
      <ClientsPageHeader
        totalContacts={contatos.length}
        selectedCount={selectedContacts.length}
        onRefresh={refreshContacts}
      />

      {/* Barra de ações para seleção múltipla */}
      <ClientsActionsBar
        selectedCount={selectedContacts.length}
        onExport={handleExport}
        onDelete={handleDelete}
        onStatusUpdate={handleStatusUpdate}
        isExporting={isExporting}
      />

      {/* Container principal com filtros e tabela */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        {/* Painel de filtros (sidebar) */}
        <div className="lg:w-64 flex-shrink-0">
          <ContactsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            originFilter={originFilter}
            onOriginFilterChange={setOriginFilter}
            totalContacts={contatos.length}
          />
        </div>

        {/* Área principal da tabela */}
        <div className="flex-1 bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <ContactsLoadingState />
          ) : contatos.length === 0 ? (
            <ContactsEmptyState
              hasFilters={searchTerm !== '' || statusFilter !== 'todos' || originFilter !== 'todos'}
              onClearFilters={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setOriginFilter('todos');
              }}
            />
          ) : (
            <ContactsTable
              contatos={contatos}
              selectedContacts={selectedContacts}
              onSelectContact={handleSelectContact}
              onSelectAll={handleSelectAll}
              allSelected={allSelected}
              someSelected={someSelected}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
};
