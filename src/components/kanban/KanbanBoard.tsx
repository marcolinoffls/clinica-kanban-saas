
import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';
import { useKanbanModals } from '@/hooks/useKanbanModals';
import { useKanbanLeadActions } from '@/hooks/useKanbanLeadActions';
import { useKanbanEtapaActions } from '@/hooks/useKanbanEtapaActions';
import { useKanbanColumnDrag } from '@/hooks/useKanbanColumnDrag';
import { useEtapas } from '@/hooks/useEtapasData';
import { useLeads } from '@/hooks/useLeadsData';
import { useTags } from '@/hooks/useTagsData';
import { Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente principal do quadro Kanban
 * 
 * Funcionalidades:
 * - Drag and drop de leads entre etapas
 * - Gerenciamento de etapas e leads
 * - Modais para criação/edição
 * - Reordenação de colunas
 */

export const KanbanBoard = () => {
  // Estados dos modais
  const {
    isLeadModalOpen,
    isEtapaModalOpen,
    isMoveLeadsModalOpen,
    selectedLead,
    selectedEtapa,
    selectedEtapaForMove,
    openLeadModal,
    closeLeadModal,
    openEtapaModal,
    closeEtapaModal,
    openMoveLeadsModal,
    closeMoveLeadsModal
  } = useKanbanModals();

  // Hooks para dados
  const { data: etapas = [], isLoading: etapasLoading } = useEtapas();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: tags = [] } = useTags();

  // Hooks para ações
  const { 
    handleSaveLead, 
    handleDeleteLead, 
    isSaving 
  } = useKanbanLeadActions();
  
  const {
    handleSaveEtapa,
    handleDeleteEtapa,
    isSavingEtapa
  } = useKanbanEtapaActions();

  const { handleColumnDragEnd } = useKanbanColumnDrag();

  // Estado para controlar se está processando drag
  const [isDragging, setIsDragging] = useState(false);

  // Função para lidar com o fim do drag and drop
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    // Se não há destino, cancelar
    if (!destination) {
      setIsDragging(false);
      return;
    }

    // Se a posição não mudou, cancelar
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      setIsDragging(false);
      return;
    }

    try {
      setIsDragging(true);

      if (type === 'COLUMN') {
        // Reordenar colunas
        await handleColumnDragEnd(result);
      } else {
        // Mover lead entre etapas
        const leadId = result.draggableId;
        const sourceEtapaId = source.droppableId;
        const destinationEtapaId = destination.droppableId;
        
        if (sourceEtapaId !== destinationEtapaId) {
          const lead = leads.find(l => l.id === leadId);
          const targetEtapa = etapas.find(e => e.id === destinationEtapaId);
          
          if (lead && targetEtapa) {
            await handleSaveLead({
              ...lead,
              etapa_kanban_id: destinationEtapaId
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro no drag and drop:', error);
    } finally {
      setIsDragging(false);
    }
  };

  // Verificar se está carregando
  if (etapasLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header com botão de nova etapa */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Pipeline de Vendas</h2>
          <Button
            onClick={() => openEtapaModal()}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Etapa
          </Button>
        </div>
      </div>

      {/* Área do Kanban com scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 p-4 min-w-max h-full">
            {etapas.map((etapa) => (
              <KanbanColumn
                key={etapa.id}
                etapa={etapa}
                leads={leads.filter(lead => lead.etapa_kanban_id === etapa.id)}
                onEditEtapa={() => openEtapaModal(etapa)}
                onEditLead={(lead) => openLeadModal(lead)}
                onAddLead={() => openLeadModal(null, etapa.id)}
                onMoveLeads={() => openMoveLeadsModal(etapa)}
                isDragging={isDragging}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modais */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={closeLeadModal}
        lead={selectedLead}
        etapas={etapas}
        tags={tags}
        onSave={handleSaveLead}
        onDelete={selectedLead ? () => handleDeleteLead(selectedLead.id) : undefined}
        isLoading={isSaving}
      />

      <EtapaModal
        isOpen={isEtapaModalOpen}
        onClose={closeEtapaModal}
        etapa={selectedEtapa}
        onSave={handleSaveEtapa}
        onDelete={selectedEtapa ? () => handleDeleteEtapa(selectedEtapa.id) : undefined}
        isLoading={isSavingEtapa}
      />

      {selectedEtapaForMove && (
        <MoveLeadsModal
          isOpen={isMoveLeadsModalOpen}
          onClose={closeMoveLeadsModal}
          sourceEtapa={selectedEtapaForMove}
          targetEtapas={etapas.filter(e => e.id !== selectedEtapaForMove.id)}
          leads={leads.filter(lead => lead.etapa_kanban_id === selectedEtapaForMove.id)}
          onSave={handleSaveLead}
        />
      )}
    </div>
  );
};
