
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para reordenar etapas do kanban
 * 
 * Gerencia o drag and drop das colunas (etapas) e atualiza
 * a ordem no banco de dados mantendo a sequência correta.
 */

export const useReorderEtapas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ etapas }: { etapas: { id: string; ordem: number }[] }) => {
      console.log('🔄 Reordenando etapas:', etapas);

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
};
