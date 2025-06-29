
import React, { useState } from 'react';
import { useClientsPage } from '@/hooks/useClientsPage';
import { ContactsLoadingState } from './ContactsLoadingState';
import { ContactsEmptyState } from './ContactsEmptyState';
import { ClientsPageHeader } from './ClientsPageHeader';
import { ClientsActionsBar } from './ClientsActionsBar';
import { LeadModal } from '../kanban/LeadModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { MoreHorizontal, Edit, MessageSquare, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    handleSaveLead
  } = useClientsPage();

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="flex-1 flex flex-col p-6">
          <ContactsLoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Cabeçalho da página */}
      <div className="p-6 bg-white border-b">
        <ClientsPageHeader onAddLead={handleAddLead} />
      </div>

      {/* Container principal com filtros e tabela */}
      <div className="flex-1 flex flex-col p-6">
        {/* Barra de ações de busca e filtros */}
        <div className="mb-6">
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
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Área principal da tabela */}
        <div className="flex-1 bg-white rounded-lg shadow-sm">
          {sortedLeads.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <ContactsEmptyState
                hasFilters={hasActiveFilters}
                searchQuery={searchQuery}
                onClearFilters={handleClearFilters}
                onAddLead={handleAddLead}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('nome')}
                      >
                        Nome
                        {sortField === 'nome' && (
                          <span className="ml-2">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('email')}
                      >
                        Email
                        {sortField === 'email' && (
                          <span className="ml-2">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('created_at')}
                      >
                        Criado
                        {sortField === 'created_at' && (
                          <span className="ml-2">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLeads.map((lead) => {
                      const etapa = etapas.find(e => e.id === lead.etapa_kanban_id);
                      const tag = tags.find(t => t.id === lead.tag_id);
                      
                      return (
                        <TableRow key={lead.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell className="font-medium">
                            {lead.nome || 'Sem nome'}
                          </TableCell>
                          <TableCell>
                            {lead.telefone || '-'}
                          </TableCell>
                          <TableCell>
                            {lead.email || '-'}
                          </TableCell>
                          <TableCell>
                            {etapa && (
                              <Badge 
                                variant="outline"
                                style={{ 
                                  backgroundColor: etapa.cor,
                                  borderColor: etapa.cor,
                                  color: 'white'
                                }}
                              >
                                {etapa.nome}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {tag && (
                              <Badge variant="secondary">
                                {tag.nome}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {lead.origem_lead || 'Não informado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {lead.created_at && formatDistanceToNow(
                              new Date(lead.created_at), 
                              { addSuffix: true, locale: ptBR }
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenChat(lead)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Chat
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteLead(lead.id)}
                                  disabled={isDeleting === lead.id}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {isDeleting === lead.id ? 'Deletando...' : 'Deletar'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Lead */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setIsLeadModalOpen(false);
          setSelectedLeadForEdit(null);
        }}
        lead={selectedLeadForEdit}
        onSave={handleSaveLead}
        tags={tags}
        etapas={etapas}
      />
    </div>
  );
};
