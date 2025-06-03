import React, { useState, useMemo } from 'react';
import { Lead } from '@/hooks/useLeadsData';
import { useLeads } from '@/hooks/useLeadsData';
import { useUpdateLead, useDeleteLead } from '@/hooks/useLeadsData';
import { useEtapas } from '@/hooks/useEtapasData';
import { useTags } from '@/hooks/useTagsData';
import { LeadModal } from '@/components/kanban/LeadModal';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CalendarProps,
} from "@/components/ui/calendar";
import { 
  Plus, 
  Filter, 
  Edit2, 
  Eye, 
  MessageSquare, 
  Trash2, 
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Users,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadInfoSidebar } from '@/components/chat/LeadInfoSidebar';
import { useNavigate } from 'react-router-dom';

/**
 * Componente aprimorado da página de Clientes/Leads
 * 
 * Melhorias implementadas:
 * - Ações rápidas na linha (Editar, Ver Detalhes, Abrir Chat)
 * - Filtros avançados por tag, origem, serviço e período
 * - Painel lateral de detalhes usando Sheet
 * - Ordenação de colunas
 * - Estados de carregamento e vazio melhorados
 * - Exibição de tags na tabela
 * - Coluna de último contato
 */

// Tipos para ordenação
type SortField = 'nome' | 'email' | 'data_ultimo_contato' | 'created_at';
type SortOrder = 'asc' | 'desc';

// Tipos para filtros
interface FilterState {
  tag: string;
  origem: string;
  servico: string;
  dataInicio?: Date;
  dataFim?: Date;
}

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

  // Função para formatizar data
  const formatarData = (dataString: string | null | undefined) => {
    if (!dataString) return 'Nunca';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline ml-1" /> : 
      <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  // Leads filtrados e ordenados
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
  const uniqueOrigens = useMemo(() => {
    const origens = leads?.map(lead => lead.origem_lead).filter(Boolean) || [];
    return [...new Set(origens)];
  }, [leads]);

  const uniqueServicos = useMemo(() => {
    const servicos = leads?.map(lead => lead.servico_interesse).filter(Boolean) || [];
    return [...new Set(servicos)];
  }, [leads]);

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
  };

  // Renderização condicional para loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
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
          
          {/* Botão de Filtros */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {(filters.tag || filters.origem || filters.servico) && (
                  <Badge variant="secondary" className="ml-1">
                    {[filters.tag, filters.origem, filters.servico].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Filtrar contatos</h4>
                
                {/* Filtro por Tag */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tag</label>
                  <Select value={filters.tag} onValueChange={(value) => setFilters(prev => ({ ...prev, tag: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as tags</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.cor }}
                            />
                            {tag.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Origem */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origem</label>
                  <Select value={filters.origem} onValueChange={(value) => setFilters(prev => ({ ...prev, origem: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as origens</SelectItem>
                      {uniqueOrigens.map((origem) => (
                        <SelectItem key={origem} value={origem}>
                          {origem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Serviço */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serviço de Interesse</label>
                  <Select value={filters.servico} onValueChange={(value) => setFilters(prev => ({ ...prev, servico: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os serviços</SelectItem>
                      {uniqueServicos.map((servico) => (
                        <SelectItem key={servico} value={servico}>
                          {servico}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                  <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={handleOpenLeadModal}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Lead
          </Button>
        </div>
      </div>

      {/* Tabela de Contatos */}
      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {processedLeads.length === 0 ? 
              "Nenhum contato encontrado" : 
              `Lista de ${processedLeads.length} contato(s)`
            }
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('nome')}
              >
                Nome {renderSortIcon('nome')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('email')}
              >
                Email {renderSortIcon('email')}
              </TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('data_ultimo_contato')}
              >
                Último Contato {renderSortIcon('data_ultimo_contato')}
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    {searchQuery || filters.tag || filters.origem || filters.servico ? (
                      <>
                        <UserX className="h-12 w-12 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Nenhum contato encontrado</p>
                          <p className="text-sm text-muted-foreground">
                            Tente ajustar os filtros ou termo de busca
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSearchQuery('');
                          clearFilters();
                        }}>
                          Limpar filtros
                        </Button>
                      </>
                    ) : (
                      <>
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Nenhum contato cadastrado</p>
                          <p className="text-sm text-muted-foreground">
                            Comece adicionando seu primeiro lead
                          </p>
                        </div>
                        <Button onClick={handleOpenLeadModal}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Lead
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              processedLeads.map((lead) => {
                const leadTag = getLeadTag(lead);
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>{lead.telefone || '-'}</TableCell>
                    <TableCell>
                      {leadTag ? (
                        <Badge 
                          style={{ 
                            backgroundColor: leadTag.cor, 
                            color: '#fff' 
                          }}
                          className="text-xs"
                        >
                          {leadTag.nome}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{lead.origem_lead || '-'}</TableCell>
                    <TableCell>{formatarData(lead.data_ultimo_contato)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Ações rápidas */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditLeadModal(lead)}
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(lead)}
                          className="h-8 w-8 p-0"
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenChat(lead)}
                          className="h-8 w-8 p-0"
                          title="Abrir Chat"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>

                        {/* Menu de ações adicionais */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleLeadDelete(lead.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
                  // Implementar navegação para agenda
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
