
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Edit2, Eye, MessageSquare, MoreHorizontal, Trash2, ArrowUpDown } from 'lucide-react';
import { formatarData } from './utils';

/**
 * Componente de Tabela de Contatos com seleção múltipla
 * 
 * Exibe a lista de contatos/leads em formato de tabela com:
 * - Seleção múltipla com checkboxes
 * - Ações rápidas (editar, ver detalhes, chat)
 * - Menu de ações (excluir)
 * - Exibição de tags com cores
 * - Ordenação clicável nas colunas
 * - Paginação
 * - Painel lateral para detalhes do lead
 */

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tag_id?: string;
  origem_lead?: string;
  servico_interesse?: string;
  data_ultimo_contato?: string;
  created_at: string;
  anotacoes?: string;
}

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  cor?: string;
}

interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

interface ContactsTableProps {
  leads: Lead[];
  selectedLeadIds: string[];
  onSelectLead: (leadId: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
  onSort: (field: string) => void;
  sortConfig: SortConfig;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditLead: (lead: Lead) => void;
  etapas: Etapa[];
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  leads,
  selectedLeadIds,
  onSelectLead,
  onSelectAll,
  allSelected,
  someSelected,
  onSort,
  sortConfig,
  currentPage,
  totalPages,
  onPageChange,
  onEditLead,
  etapas,
}) => {
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);

  // Função para obter informações da etapa pelo ID
  const getEtapaInfo = (etapaId: string | null) => {
    if (!etapaId) return null;
    return etapas.find(etapa => etapa.id === etapaId);
  };

  // Função para exibir detalhes do lead
  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailSheetOpen(true);
  };

  // Função para abrir chat (placeholder)
  const handleOpenChat = (lead: Lead) => {
    console.log('Abrir chat com lead:', lead.id);
  };

  // Componente para cabeçalho de coluna ordenável
  const SortableHeader: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-semibold hover:bg-transparent"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead>
                <SortableHeader field="nome">Nome</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="email">Email</SortableHeader>
              </TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>
                <SortableHeader field="data_ultimo_contato">Último Contato</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="created_at">Criado em</SortableHeader>
              </TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedLeadIds.includes(lead.id)}
                    onCheckedChange={() => onSelectLead(lead.id)}
                    aria-label={`Selecionar ${lead.nome}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{lead.nome}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.telefone}</TableCell>
                <TableCell>{lead.origem_lead || '-'}</TableCell>
                <TableCell>{lead.servico_interesse || '-'}</TableCell>
                <TableCell>{formatarData(lead.data_ultimo_contato)}</TableCell>
                <TableCell>{formatarData(lead.created_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {/* Ações rápidas */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onEditLead(lead)}
                      title="Editar lead"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewDetails(lead)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenChat(lead)}
                      title="Abrir chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>

                    {/* Menu de ações */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Painel lateral para detalhes do lead */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Detalhes do Contato</SheetTitle>
          </SheetHeader>
          
          {selectedLead && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{selectedLead.nome}</h3>
                <p className="text-muted-foreground">{selectedLead.email}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Telefone:</span>
                  <p>{selectedLead.telefone || 'Não informado'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">Origem:</span>
                  <p>{selectedLead.origem_lead || 'Não informada'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">Serviço de interesse:</span>
                  <p>{selectedLead.servico_interesse || 'Não informado'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">Último contato:</span>
                  <p>{formatarData(selectedLead.data_ultimo_contato)}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">Criado em:</span>
                  <p>{formatarData(selectedLead.created_at)}</p>
                </div>

                {selectedLead.anotacoes && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Anotações:</span>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{selectedLead.anotacoes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => onEditLead(selectedLead)} className="flex-1">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" onClick={() => handleOpenChat(selectedLead)} className="flex-1">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
