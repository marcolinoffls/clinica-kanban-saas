
import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { useEtapasKanban } from '@/hooks/useEtapasKanban';
import { useKanbanColumnDrag } from '@/hooks/useKanbanColumnDrag';

/**
 * Componente principal do quadro Kanban
 * 
 * O que faz:
 * - Renderiza o quadro Kanban com colunas de etapas
 * - Gerencia drag and drop de cards entre colunas
 * - Conecta com hooks para buscar etapas e leads
 * 
 * Onde é usado:
 * - Na página principal do pipeline/kanban
 */
export const KanbanBoard = () => {
  const kanbanData = useEtapasKanban();
  const dragHook = useKanbanColumnDrag();

  // Extrair dados do hook useEtapasKanban
  const etapas = kanbanData?.etapas || kanbanData?.data || [];
  const leadsPorEtapa = kanbanData?.leadsPorEtapa || {};
  const isLoading = kanbanData?.isLoading || false;
  const updateLead = kanbanData?.updateLead;
  const deleteEtapa = kanbanData?.deleteEtapa;
  const updateEtapa = kanbanData?.updateEtapa;
  const refetchEtapas = kanbanData?.refetchEtapas || kanbanData?.refetch;

  // Extrair handleDragEnd do hook de drag
  const handleDragEnd = dragHook?.handleDragEnd;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando etapas e leads...</p>
        </div>
      </div>
    );
  }

  if (!etapas || etapas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Nenhuma etapa encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd || (() => {})}>
        <div className="flex gap-6 overflow-x-auto pb-6 h-full">
          {etapas.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              leads={leadsPorEtapa[etapa.id] || []}
              onUpdateLead={updateLead ? (lead) => updateLead(lead.id, lead) : () => {}}
              onDeleteEtapa={deleteEtapa ? () => deleteEtapa(etapa.id) : () => {}}
              onUpdateEtapa={updateEtapa ? () => updateEtapa(etapa.id, etapa) : () => {}}
              onRefresh={refetchEtapas || (() => {})}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
