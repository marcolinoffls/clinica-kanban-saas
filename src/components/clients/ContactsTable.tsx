
import React from 'react';
import { Lead } from '@/hooks/useLeadsData';
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit2,
  Eye,
  MessageSquare,
  Trash2,
  MoreVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { SortField, SortOrder } from './types';
import { formatarData } from './utils';

/**
 * Componente da Tabela de Contatos
 * 
 * Exibe a lista de contatos em formato de tabela com:
 * - Ordenação por colunas
 * - Ações rápidas (editar, ver detalhes, chat)
 * - Exibição de tags coloridas
 * - Menu de ações adicionais
 */

interface ContactsTableProps {
  leads: Lead[];
  tags: any[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onEditLead: (lead: Lead) => void;
  onViewDetails: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  leads,
  tags,
  sortField,
  sortOrder,
  onSort,
  onEditLead,
  onViewDetails,
  onOpenChat,
  onDeleteLead,
}) => {
  // Função para obter tag do lead
  const getLeadTag = (lead: Lead) => {
    if (!lead.tag_id) return null;
    return tags.find(tag => tag.id === lead.tag_id);
  };

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline ml-1" /> : 
      <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>
          {leads.length === 0 ? 
            "Nenhum contato encontrado" : 
            `Lista de ${leads.length} contato(s)`
          }
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('nome')}
            >
              Nome {renderSortIcon('nome')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('email')}
            >
              Email {renderSortIcon('email')}
            </TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('data_ultimo_contato')}
            >
              Último Contato {renderSortIcon('data_ultimo_contato')}
            </TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
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
                      onClick={() => onEditLead(lead)}
                      className="h-8 w-8 p-0"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(lead)}
                      className="h-8 w-8 p-0"
                      title="Ver Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenChat(lead)}
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
                          onClick={() => onDeleteLead(lead.id)}
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
          })}
        </TableBody>
      </Table>
    </div>
  );
};
