
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar reordenação de etapas do kanban
 * 
 * Funcionalidades:
 * - Reordenar etapas via drag and drop
 * - Atualizar ordem no banco de dados
 * - Gerenciar estado de loading
 */

export const useEtapaReorder = () => {
  const [reordering, setReordering] = useState(false);

  // Função para reordenar etapas
  const reorderEtapas = async (sourceIndex: number, destinationIndex: number, etapas: any[]) => {
    try {
      setReordering(true);
      
      // Criar nova ordem das etapas
      const newEtapas = Array.from(etapas);
      const [movedEtapa] = newEtapas.splice(sourceIndex, 1);
      newEtapas.splice(destinationIndex, 0, movedEtapa);

      // Atualizar ordem de cada etapa
      const updates = newEtapas.map((etapa, index) => ({
        id: etapa.id,
        ordem: index
      }));

      // Executar updates no banco
      for (const update of updates) {
        const { error } = await supabase
          .from('etapas_kanban')
          .update({ ordem: update.ordem })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Ordem das etapas atualizada!');
      return newEtapas;
    } catch (error) {
      console.error('Erro ao reordenar etapas:', error);
      toast.error('Erro ao reordenar etapas');
      throw error;
    } finally {
      setReordering(false);
    }
  };

  return {
    reordering,
    reorderEtapas
  };
};
