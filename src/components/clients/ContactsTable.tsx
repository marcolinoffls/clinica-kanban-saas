
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Lead } from '@/hooks/useLeadsData';
import { SortField, SortOrder } from './types';
import { formatarData } from './utils';

/**
 * Componente de Tabela de Contatos
 * 
 * Exibe a lista de contatos/leads em formato de tabela com:
 * - Ações rápidas (editar, ver detalhes, chat)
 * - Menu de ações (excluir)
 * - Exibição de tags com cores
 * - Ordenação clicável nas colunas
 * - Painel lateral para detalhes do lead
 */

interface ContactsTableProps {
  leads: Lead[];
  tags: any[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onEdit: (lead: Lead) => void;
  onChat: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  isDeleting: boolean;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  leads,
  tags,
  sortField,
  sortOrder,
  onSort,
  onEdit,
  onChat,
  onDelete,
  isDeleting,
}) => {
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);

  // Função para obter informações da tag pelo ID
  const getTagInfo = (tagId: string | null) => {
    if (!tagId) return null;
    return tags.find(tag => tag.id === tagId);
  };

  // Função para exibir detalhes do lead
  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailSheetOpen(true);
  };

  // Componente para cabeçalho de coluna ordenável
  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
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
              <TableHead>
                <SortableHeader field="nome">Nome</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="email">Email</SortableHeader>
              </TableHead>
              <TableHead>Tag</TableHead>
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
            {leads.map((lead) => {
              const tagInfo = getTagInfo(lead.tag_id);
              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>
                    {tagInfo && (
                      <Badge 
                        variant="outline" 
                        className="border-0"
                        style={{ 
                          backgroundColor: `${tagInfo.cor}20`,
                          color: tagInfo.cor,
                          borderLeft: `3px solid ${tagInfo.cor}`
                        }}
                      >
                        {tagInfo.nome}
                      </Badge>
                    )}
                  </TableCell>
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
                        onClick={() => onEdit(lead)}
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
                        onClick={() => onChat(lead)}
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
                            onClick={() => onDelete(lead.id)}
                            disabled={isDeleting}
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
              );
            })}
          </TableBody>
        </Table>
      </div>

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
                  <span className="text-sm font-medium text-muted-foreground">Tag:</span>
                  {getTagInfo(selectedLead.tag_id) ? (
                    <Badge 
                      variant="outline" 
                      className="border-0 mt-1"
                      style={{ 
                        backgroundColor: `${getTagInfo(selectedLead.tag_id)?.cor}20`,
                        color: getTagInfo(selectedLead.tag_id)?.cor,
                        borderLeft: `3px solid ${getTagInfo(selectedLead.tag_id)?.cor}`
                      }}
                    >
                      {getTagInfo(selectedLead.tag_id)?.nome}
                    </Badge>
                  ) : (
                    <p>Nenhuma tag atribuída</p>
                  )}
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
                <Button onClick={() => onEdit(selectedLead)} className="flex-1">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" onClick={() => onChat(selectedLead)} className="flex-1">
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
