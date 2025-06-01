
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EtapaPipeline } from '@/components/pipeline/types';

/**
 * Hook para gerenciar drag and drop de colunas (etapas) no Pipeline
 * 
 * Permite reordenar as etapas arrastando as colunas e
 * persiste a nova ordem no banco de dados.
 */

export const usePipelineColumnDrag = () => {
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [columnDragOverTargetId, setColumnDragOverTargetId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Mutation para reordenar etapas
  const reorderEtapasMutation = useMutation({
    mutationFn: async ({ etapas }: { etapas: { id: string; ordem: number }[] }) => {
      console.log('🔄 Reordenando etapas do Pipeline:', etapas);

      // Atualizar a ordem de todas as etapas afetadas
      const updates = etapas.map(({ id, ordem }) => 
        supabase
          .from('etapas_kanban')
          .update({ ordem })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      
      // Verificar se alguma atualização falhou
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('❌ Erro ao reordenar etapas:', errors);
        throw new Error('Erro ao reordenar etapas');
      }

      console.log('✅ Etapas reordenadas com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      toast.success('Etapas reordenadas com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao reordenar etapas:', error);
      toast.error('Erro ao reordenar etapas');
    },
  });

  // Função para iniciar o drag da coluna
  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    // Verificar se é realmente um drag de coluna (não um lead)
    const target = e.target as HTMLElement;
    const isColumnHeader = target.closest('[data-column-header]');
    
    if (!isColumnHeader) {
      e.preventDefault();
      return;
    }

    console.log('🎯 Iniciando drag da coluna:', columnId);
    setDraggedColumnId(columnId);
    
    // Armazenar dados da coluna com identificador de tipo
    const dragData = {
      type: 'COLUMN' as const,
      id: columnId
    };
    
    window.__DRAGGED_COLUMN__ = dragData;
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', `column-${columnId}`);
    
    // Feedback visual
    e.currentTarget.style.opacity = '0.7';
  };

  // Função para finalizar o drag da coluna
  const handleColumnDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🏁 Finalizando drag da coluna');
    setDraggedColumnId(null);
    setColumnDragOverTargetId(null);
    
    // Limpar dados globais
    window.__DRAGGED_COLUMN__ = null;
    
    // Restaurar opacidade
    e.currentTarget.style.opacity = '1';
  };

  // Função para gerenciar o drag over da coluna
  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    
    // Só processar se for um drag de coluna
    const draggedColumn = window.__DRAGGED_COLUMN__;
    
    if (draggedColumn && draggedColumn.type === 'COLUMN' && draggedColumn.id !== targetColumnId) {
      e.dataTransfer.dropEffect = 'move';
      setColumnDragOverTargetId(targetColumnId);
    }
  };

  // Função para gerenciar o drag leave da coluna
  const handleColumnDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setColumnDragOverTargetId(null);
    }
  };

  // Função para gerenciar o drop da coluna
  const handleColumnDrop = async (e: React.DragEvent<HTMLDivElement>, targetColumnId: string, etapas: EtapaPipeline[]) => {
    e.preventDefault();
    e.stopPropagation();
    setColumnDragOverTargetId(null);

    // Verificar se é um drop de coluna
    const draggedColumn = window.__DRAGGED_COLUMN__;
    
    if (!draggedColumn || draggedColumn.type !== 'COLUMN') {
      console.log('ℹ️ Drop ignorado - não é uma coluna');
      return;
    }
    
    const draggedColumnId = draggedColumn.id;

    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      return;
    }

    console.log('📦 Drop de coluna:', { from: draggedColumnId, to: targetColumnId });

    // Encontrar índices das etapas
    const draggedIndex = etapas.findIndex(e => e.id === draggedColumnId);
    const targetIndex = etapas.findIndex(e => e.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) {
      console.error('❌ Índices inválidos para reordenação');
      return;
    }

    // Criar nova ordem das etapas
    const newEtapas = [...etapas];
    const [draggedEtapa] = newEtapas.splice(draggedIndex, 1);
    newEtapas.splice(targetIndex, 0, draggedEtapa);

    // Recalcular ordens
    const etapasComNovaOrdem = newEtapas.map((etapa, index) => ({
      id: etapa.id,
      ordem: index
    }));

    // Salvar nova ordem no banco
    await reorderEtapasMutation.mutateAsync({ etapas: etapasComNovaOrdem });
  };

  return {
    draggedColumnId,
    columnDragOverTargetId,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
    isReordering: reorderEtapasMutation.isPending,
  };
};
