
import { useState } from 'react';
import { useReorderEtapas } from '@/hooks/useEtapaReorder';
import { Etapa } from '@/hooks/useEtapasData';

/**
 * Hook para gerenciar o drag and drop de colunas/etapas no Kanban
 * 
 * Controla a reordenação das colunas através de arrastar e soltar,
 * incluindo feedback visual e persistência da nova ordem no backend.
 */
export const useKanbanColumnDrag = () => {
  // Estados para drag and drop de colunas
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [columnDragOverTargetId, setColumnDragOverTargetId] = useState<string | null>(null);

  // Hook para reordenar etapas
  const reorderEtapasMutation = useReorderEtapas();

  // Iniciar drag de coluna
  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.dataTransfer.setData('draggedColumnId', columnId);
    e.dataTransfer.setData('itemType', 'kanbanColumn');
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumnId(columnId);
    console.log(`[KanbanColumnDrag] Iniciando drag da COLUNA ${columnId}`);
  };

  // Finalizar drag de coluna
  const handleColumnDragEnd = () => {
    console.log(`[KanbanColumnDrag] Finalizando drag da COLUNA ${draggedColumnId}`);
    setDraggedColumnId(null);
    setColumnDragOverTargetId(null);
  };

  // Drag over de coluna
  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    const itemType = e.dataTransfer.getData('itemType');
    const sourceColumnId = e.dataTransfer.getData('draggedColumnId');

    if (itemType === 'kanbanColumn' && sourceColumnId && sourceColumnId !== targetColumnId) {
      e.dataTransfer.dropEffect = 'move';
      if (columnDragOverTargetId !== targetColumnId) {
        setColumnDragOverTargetId(targetColumnId);
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
      if (columnDragOverTargetId && sourceColumnId === targetColumnId) {
         setColumnDragOverTargetId(null);
      }
    }
  };
  
  // Drag leave de coluna
  const handleColumnDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setColumnDragOverTargetId(null);
    }
  };

  // Drop de coluna - reordenar etapas
  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string, etapas: Etapa[]) => {
    e.preventDefault();
    
    const sourceColumnId = e.dataTransfer.getData('draggedColumnId');
    const itemType = e.dataTransfer.getData('itemType');

    console.log('[KanbanColumnDrag] 🟢 Drop de COLUNA detectado. Dados do evento:', { 
      sourceColumnId, 
      targetColumnId,
      itemType,
      allTypesInDataTransfer: Array.from(e.dataTransfer.types)
    });

    setDraggedColumnId(null);
    setColumnDragOverTargetId(null);

    if (itemType === 'kanbanColumn' && sourceColumnId && targetColumnId && sourceColumnId !== targetColumnId) {
      console.log(`[KanbanColumnDrag] Processando drop da coluna ID: ${sourceColumnId} para a posição da coluna ID: ${targetColumnId}`);

      const currentEtapasOrdenadas = Array.isArray(etapas) 
        ? [...etapas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)) 
        : [];

      if (currentEtapasOrdenadas.length === 0) {
        console.warn("[KanbanColumnDrag] ⚠️ Não há etapas para reordenar.");
        return;
      }

      const sourceIndex = currentEtapasOrdenadas.findIndex(etapa => etapa.id === sourceColumnId);
      const targetIndex = currentEtapasOrdenadas.findIndex(etapa => etapa.id === targetColumnId);

      console.log('[KanbanColumnDrag] Índices para reordenação:', { sourceIndex, targetIndex });

      if (sourceIndex === -1 || targetIndex === -1) {
        console.error(`[KanbanColumnDrag] ❌ ERRO: Coluna não encontrada no array de etapas ordenadas.`);
        return;
      }

      const [draggedItem] = currentEtapasOrdenadas.splice(sourceIndex, 1);
      currentEtapasOrdenadas.splice(targetIndex, 0, draggedItem);

      const etapasToUpdate = currentEtapasOrdenadas.map((etapa, index) => ({
        id: etapa.id,
        ordem: index,
      }));

      console.log('[KanbanColumnDrag] 🔄 Enviando para reorderEtapasMutation:', etapasToUpdate);
      reorderEtapasMutation.mutate({ etapas: etapasToUpdate });
    }
  };

  return {
    // Estados
    draggedColumnId,
    columnDragOverTargetId,
    
    // Funções de drag
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
    
    // Estado de loading
    isReorderingColumns: reorderEtapasMutation.isPending,
  };
};
