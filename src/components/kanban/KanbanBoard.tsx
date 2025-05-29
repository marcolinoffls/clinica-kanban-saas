import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanColumn } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useEtapaReorder } from '@/hooks/useEtapaReorder';

interface Lead {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  anotacoes?: string;
  origem_lead?: string;
  servico_interesse?: string;
  created_at: string;
  updated_at: string;
}

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
}

interface Tag {
  id: string;
  nome: string;
  cor: string;
}

export const KanbanBoard = () => {
  const { leads, etapas, tags, loading } = useSupabaseData();
  const { createLead, updateLead, deleteLead } = useSupabaseLeads();
  const { reorderEtapas } = useEtapaReorder();
  
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingEtapa, setEditingEtapa] = useState<Etapa | null>(null);
  const [selectedEtapaForNewLead, setSelectedEtapaForNewLead] = useState<string | null>(null);
  
  // Estados para modal de movimentação de leads
  const [moveLeadsModalOpen, setMoveLeadsModalOpen] = useState(false);
  const [etapaToDelete, setEtapaToDelete] = useState<Etapa | null>(null);
  const [leadsToMove, setLeadsToMove] = useState<Lead[]>([]);

  // Ordenar etapas por ordem
  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);

  // Função para lidar com fim do arrastar
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;

    // Se arrastar etapas (colunas)
    if (type === 'etapa') {
      if (destination.index === source.index) return;

      const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);
      const [draggedEtapa] = etapasOrdenadas.splice(source.index, 1);
      etapasOrdenadas.splice(destination.index, 0, draggedEtapa);

      // Atualizar ordens no banco
      await reorderEtapas(etapasOrdenadas);
      return;
    }

    // Se arrastar leads entre etapas
    if (source.droppableId === destination.droppableId) return;

    const leadId = result.draggableId;
    const novaEtapaId = destination.droppableId;

    try {
      await updateLead(leadId, { etapa_kanban_id: novaEtapaId });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
    }
  };

  // Função para criar novo lead
  const handleCreateLead = async (leadData: Partial<Lead>) => {
    try {
      await createLead(leadData);
      setIsLeadModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    }
  };

  // Função para atualizar lead
  const handleUpdateLead = async (leadId: string, leadData: Partial<Lead>) => {
    try {
      await updateLead(leadId, leadData);
      setIsLeadModalOpen(false);
      setEditingLead(null);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
    }
  };

  // Função para deletar lead
  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        await deleteLead(leadId);
      } catch (error) {
        console.error('Erro ao deletar lead:', error);
      }
    }
  };

  // Função para editar etapa
  const handleEditEtapa = (etapa: Etapa) => {
    setEditingEtapa(etapa);
    setIsEtapaModalOpen(true);
  };

  // Função para lidar com exclusão de etapa
  const handleDeleteEtapa = (etapa: Etapa) => {
    const leadsNaEtapa = leads.filter(lead => lead.etapa_kanban_id === etapa.id);
    
    if (leadsNaEtapa.length > 0) {
      // Se há leads na etapa, abrir modal para movê-los
      setEtapaToDelete(etapa);
      setLeadsToMove(leadsNaEtapa);
      setMoveLeadsModalOpen(true);
    } else {
      // Se não há leads, confirmar exclusão diretamente
      if (window.confirm(`Tem certeza que deseja excluir a etapa "${etapa.nome}"?`)) {
        // Lógica de exclusão da etapa aqui
        console.log('Excluir etapa:', etapa.id);
      }
    }
  };

  // Função para confirmar movimentação e exclusão
  const handleConfirmMoveAndDelete = async (targetEtapaId: string) => {
    if (!etapaToDelete || leadsToMove.length === 0) return;

    try {
      // Mover todos os leads para a nova etapa
      for (const lead of leadsToMove) {
        await updateLead(lead.id, { etapa_kanban_id: targetEtapaId });
      }

      // Aqui seria a lógica para excluir a etapa do banco
      console.log('Excluir etapa após mover leads:', etapaToDelete.id);
      
      // Fechar modal
      setMoveLeadsModalOpen(false);
      setEtapaToDelete(null);
      setLeadsToMove([]);
    } catch (error) {
      console.error('Erro ao mover leads e excluir etapa:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header com botões de ação */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Kanban de Leads</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEtapaModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Etapa
          </Button>
          <Button
            onClick={() => setIsLeadModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Board Kanban com scroll horizontal */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="etapas" direction="horizontal" type="etapa">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 p-1"
                style={{ minWidth: 'max-content' }}
              >
                {etapasOrdenadas.map((etapa, index) => {
                  const leadsNaEtapa = leads.filter(lead => lead.etapa_kanban_id === etapa.id);
                  
                  return (
                    <Draggable key={etapa.id} draggableId={etapa.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`w-80 ${snapshot.isDragging ? 'rotate-2 shadow-xl' : ''}`}
                        >
                          <KanbanColumn
                            etapa={etapa}
                            leads={leadsNaEtapa}
                            tags={tags}
                            onEditLead={(lead) => {
                              setEditingLead(lead);
                              setIsLeadModalOpen(true);
                            }}
                            onDeleteLead={handleDeleteLead}
                            onEditEtapa={handleEditEtapa}
                            onDeleteEtapa={handleDeleteEtapa}
                            onAddLead={(etapaId) => {
                              setSelectedEtapaForNewLead(etapaId);
                              setIsLeadModalOpen(true);
                            }}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Modais */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setIsLeadModalOpen(false);
          setEditingLead(null);
          setSelectedEtapaForNewLead(null);
        }}
        lead={editingLead}
        etapas={etapas}
        selectedEtapaId={selectedEtapaForNewLead}
        onSave={editingLead ? handleUpdateLead : handleCreateLead}
      />

      <EtapaModal
        isOpen={isEtapaModalOpen}
        onClose={() => {
          setIsEtapaModalOpen(false);
          setEditingEtapa(null);
        }}
        etapa={editingEtapa}
        onSave={(etapaData) => {
          console.log('Salvar etapa:', etapaData);
          setIsEtapaModalOpen(false);
          setEditingEtapa(null);
        }}
      />

      <MoveLeadsModal
        isOpen={moveLeadsModalOpen}
        onClose={() => {
          setMoveLeadsModalOpen(false);
          setEtapaToDelete(null);
          setLeadsToMove([]);
        }}
        etapaToDelete={etapaToDelete}
        leadsToMove={leadsToMove}
        availableEtapas={etapas.filter(e => e.id !== etapaToDelete?.id)}
        onConfirm={handleConfirmMoveAndDelete}
      />
    </div>
  );
};
