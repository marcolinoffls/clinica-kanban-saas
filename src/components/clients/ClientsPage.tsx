import React, { useState } from 'react';
import { Lead } from '@/hooks/useLeadsData';
import { useLeads } from '@/hooks/useLeadsData';
import { useUpdateLead, useDeleteLead } from '@/hooks/useLeadsData';
import { LeadModal } from '@/components/kanban/LeadModal';
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ClientsPageProps {
  // Define any props here
}

const ClientsPage = () => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: leads, isLoading, isError } = useLeads();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

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

  const handleLeadUpdate = async (updatedLead: Lead) => {
    try {
      // Corrigir a chamada para o hook useUpdateLead - precisa do formato { id, data }
      await updateLead({
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

  const filteredLeads = leads?.filter(lead =>
    lead.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.telefone?.includes(searchQuery)
  );

  if (isLoading) {
    return <div>Carregando leads...</div>;
  }

  if (isError) {
    return <div>Erro ao carregar leads.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Leads
        </h2>
        <div className="flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Pesquisar leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleOpenLeadModal}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Lead
          </Button>
        </div>
      </div>
      <div className="py-4">
        <Table>
          <TableCaption>Lista de todos os leads da clínica.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads?.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.nome}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.telefone}</TableCell>
                <TableCell>{lead.origem_lead}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenEditLeadModal(lead)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleLeadDelete(lead.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={handleCloseLeadModal}
        lead={selectedLead}
        onSave={handleLeadUpdate}
      />
    </div>
  );
};

export default ClientsPage;
