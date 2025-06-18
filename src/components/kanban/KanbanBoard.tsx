import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useEtapasKanban } from '@/hooks/useEtapasKanban';
import { useLeadsKanban } from '@/hooks/useLeadsKanban';
import { KanbanColumn } from './KanbanColumn';
import { Lead, Etapa } from '@/types/kanbanTypes';

/**
 * Componente KanbanBoard
 * 
 * Exibe as etapas e leads em um quadro Kanban
 * com suporte a drag and drop para movimentação
 * de leads entre etapas.
 * 
 * Funcionalidades:
 * - Busca etapas e leads via hooks customizados
 * - Permite editar leads e etapas
 * - Permite adicionar e mover leads
 * - Atualiza estado local e backend conforme interações
 */

export const KanbanBoard = () => {
  const { data: etapas, isLoading: isLoadingEtapas, error: errorEtapas, refetch: refetchEtapas } = useEtapasKanban();
  const { data: leads, isLoading: isLoadingLeads, error: errorLeads, refetch: refetchLeads } = useLeadsKanban();

  const [leadsPorEtapa, setLeadsPorEtapa] = useState<Record<string, Lead[]>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Organizar leads por etapa
  useEffect(() => {
    const grouped: Record<string, Lead[]> = {};
    etapas.forEach((etapa) => {
      grouped[etapa.id] = [];
    });
    leads.forEach((lead) => {
      if (grouped[lead.etapa_id]) {
        grouped[lead.etapa_id].push(lead);
      }
    });
    setLeadsPorEtapa(grouped);
  }, [etapas, leads]);

  // Função para atualizar backend e estado local após drag and drop
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceEtapaId = source.droppableId;
    const destEtapaId = destination.droppableId;

    // Atualizar estado local
    const sourceLeads = Array.from(leadsPorEtapa[sourceEtapaId] || []);
    const destLeads = Array.from(leadsPorEtapa[destEtapaId] || []);

    const [movedLead] = sourceLeads.splice(source.index, 1);
    movedLead.etapa_id = destEtapaId;
    destLeads.splice(destination.index, 0, movedLead);

    setLeadsPorEtapa({
      ...leadsPorEtapa,
      [sourceEtapaId]: sourceLeads,
      [destEtapaId]: destLeads,
    });

    // Atualizar backend (exemplo, implementar conforme API)
    try {
      // await api.updateLeadEtapa(draggableId, destEtapaId);
      // Simulação de delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      refetchLeads();
    } catch (error) {
      console.error('Erro ao atualizar etapa do lead:', error);
      // Reverter estado local em caso de erro
      setLeadsPorEtapa((prev) => {
        const revertedSource = Array.from(prev[destEtapaId] || []);
        const revertedDest = Array.from(prev[sourceEtapaId] || []);
        const index = revertedSource.findIndex((lead) => lead.id === draggableId);
        if (index !== -1) {
          const [revertedLead] = revertedSource.splice(index, 1);
          revertedLead.etapa_id = sourceEtapaId;
          revertedDest.splice(source.index, 0, revertedLead);
        }
        return {
          ...prev,
          [sourceEtapaId]: revertedDest,
          [destEtapaId]: revertedSource,
        };
      });
    }
  }, [leadsPorEtapa, refetchLeads]);

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) {
      setIsDragging(false);
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      setIsDragging(false);
      return;
    }

    // Corrigir chamada para handleDragEnd com apenas 1 argumento
    handleDragEnd(result);
    setIsDragging(false);
  };

  // Handlers para edição, exclusão, movimentação e adição
  const handleEditLead = (leadId: string, updatedData: Partial<Lead>) => {
    // Implementar edição de lead
  };

  const handleDropLeadInColumn = (etapaId: string, leadId: string) => {
    // Implementar drop de lead em coluna
  };

  const handleEditEtapa = (etapaId: string, updatedData: Partial<Etapa>) => {
    // Implementar edição de etapa
  };

  const handleDeleteEtapa = (etapaId: string) => {
    // Implementar exclusão de etapa
  };

  const handleMoveLeads = (leadIds: string[], destEtapaId: string) => {
    // Implementar movimentação em lote
  };

  const handleAddLead = (etapaId: string, newLead: Lead) => {
    // Implementar adição de lead
  };

  if (isLoadingEtapas || isLoadingLeads) {
    return <div>Carregando Kanban...</div>;
  }

  if (errorEtapas || errorLeads) {
    return <div>Erro ao carregar dados do Kanban.</div>;
  }

  return (
    <div className="kanban-board">
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${etapas.length}, 300px)` }}>
          {etapas.map((etapa) => {
            const etapaLeads = leadsPorEtapa[etapa.id] || [];

            return (
              <KanbanColumn
                key={etapa.id}
                column={etapa}
                leads={etapaLeads}
                onEditLead={handleEditLead}
                onDropLeadInColumn={handleDropLeadInColumn}
                onEditEtapa={handleEditEtapa}
                onDeleteEtapa={handleDeleteEtapa}
                onMoveLeads={handleMoveLeads}
                onAddLead={handleAddLead}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
