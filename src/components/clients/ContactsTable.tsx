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
import { Edit2, MessageSquare, MoreHorizontal, Trash2, ArrowUpDown } from 'lucide-react';
import { Lead } from '@/hooks/useLeadsData';
import { SortField, SortOrder } from './types';
import { formatarData } from './utils';

/**
 * Componente de Tabela de Contatos
 * 
 * Exibe a lista de contatos/leads em formato de tabela com:
 * - Ações rápidas (editar, chat)
 * - Nome do contato clicável para abrir painel de detalhes
 * - Menu de ações (excluir)
 * - Exibição de tags com cores
 * - Ordenação clicável nas colunas
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
  onViewDetails: (lead: Lead) => void; // NOVO: para abrir a barra lateral
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
  onViewDetails,
}) => {
  // Função para obter informações da tag pelo ID
  const getTagInfo = (tagId: string | null) => {
    if (!tagId) return null;
    return tags.find(tag => tag.id === tagId);
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
                <TableCell className="font-medium">
                  {/* O nome do contato agora é um botão que abre a barra lateral */}
                  <button
                    onClick={() => onViewDetails(lead)}
                    className="hover:underline text-left"
                    title="Ver detalhes do contato"
                  >
                    {lead.nome}
                  </button>
                </TableCell>
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
                    
                    {/* Botão de "Ver detalhes" (ícone de olho) foi removido */}
                    
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
    // O painel lateral de detalhes (Sheet) foi removido daqui e movido para ClientsPage.tsx
  );
};
