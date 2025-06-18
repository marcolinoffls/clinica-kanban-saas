import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { useEtapasKanban } from '@/hooks/useEtapasKanban';
import { useKanbanColumnDrag } from '@/hooks/useKanbanColumnDrag';
import { Lead } from '@/types/global';

export const KanbanBoard = () => {
  const { 
    etapas, 
    leadsPorEtapa, 
    isLoading,
    updateLead,
    deleteEtapa,
    updateEtapa,
    refetchEtapas 
  } = useEtapasKanban();

  const { handleDragEnd } = useKanbanColumnDrag();

  // if (isLoading) {
  //   return <div>Carregando etapas e leads...</div>;
  // }

  // if (!etapas || etapas.length === 0) {
  //   return <div>Nenhuma etapa encontrada.</div>;
  // }

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 h-full">
          {etapas.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              leads={leadsPorEtapa[etapa.id] || []}
              onUpdateLead={(lead: Lead) => updateLead(lead.id, lead)}
              onDeleteEtapa={() => deleteEtapa(etapa.id)}
              onUpdateEtapa={() => updateEtapa(etapa.id, etapa)}
              onRefresh={refetchEtapas}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
