
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUpdateLead, useDeleteLead } from './useSupabaseLeads';
import { toast } from 'sonner';

/**
 * Hook para gerenciar ações de leads no Kanban
 * 
 * Este hook centraliza as operações que podem ser realizadas nos leads
 * dentro do contexto do board Kanban, como editar e excluir leads.
 */

export const useKanbanLeadActions = () => {
  const queryClient = useQueryClient();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();

  const handleEditLead = async (leadData: any) => {
    try {
      // CORREÇÃO: Remover 'data' wrapper e passar as propriedades diretamente
      await updateLeadMutation.mutateAsync({
        id: leadData.id,
        ...leadData // Spread das propriedades diretamente
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLeadMutation.mutateAsync(leadId);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      toast.error('Erro ao deletar lead');
    }
  };

  return {
    handleEditLead,
    handleDeleteLead,
    isUpdating: updateLeadMutation.isPending,
    isDeleting: deleteLeadMutation.isPending,
  };
};
