
import { Lead } from '@/hooks/useLeadsData';

interface IKanbanColumn {
  id: string;
  nome: string;
  title?: string;
  cor?: string;
  ordem?: number;
}import { useUpdateEtapa, useDeleteEtapa, CreateEtapaData, Etapa } from '@/hooks/useEtapasData';
import { useClinicaOperations } from '@/hooks/useClinicaOperations';
import { useMoveLeadToStage } from '@/hooks/useLeadsData';
import { toast } from 'sonner';

/**
 * Hook para gerenciar ações relacionadas às etapas no Kanban
 * 
 * Centraliza as operações de:
 * - Criação de novas etapas
 * - Atualização de etapas existentes
 * - Exclusão de etapas (com movimentação de leads)
 */
export const useKanbanEtapaActions = () => {
  // Hooks de mutação do React Query
  const { createEtapa } = useClinicaOperations();
  const updateEtapaMutation = useUpdateEtapa();
  const deleteEtapaMutation = useDeleteEtapa();
  const moveLeadMutation = useMoveLeadToStage();

  // Função para salvar etapa (criar ou atualizar)
  const handleSaveEtapa = async (nome: string, editingEtapa: IKanbanColumn | null, etapas: Etapa[]) => {
    try {
      if (editingEtapa && editingEtapa.id) {
        // Atualizar etapa existente
        await updateEtapaMutation.mutateAsync({ id: editingEtapa.id, nome });
      } else {
        // Criar nova etapa
        const currentEtapas = Array.isArray(etapas) ? etapas : [];
        const nextOrder = Math.max(...currentEtapas.map(e => e.ordem || 0), -1) + 1;
        await createEtapa({ nome, ordem: nextOrder } as Omit<CreateEtapaData, 'clinica_id'>);
      }
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      throw error; // Re-lança para que o modal possa tratar se necessário
    }
  };

  // Função para excluir etapa
  const handleDeleteEtapa = async (etapaParaDeletar: IKanbanColumn, leads: Lead[]) => {
    const currentLeads = Array.isArray(leads) ? leads : [];
    const leadsNaEtapa = currentLeads.filter(l => l.etapa_kanban_id === etapaParaDeletar.id);
    
    if (leadsNaEtapa.length > 0) {
      // Retorna info para abrir modal de movimentação
      return {
        needsMoveLeads: true,
        etapaToDelete: { ...etapaParaDeletar, leadsCount: leadsNaEtapa.length }
      };
    } else {
      // Pode deletar diretamente
      const confirmacao = confirm(
        `Tem certeza que deseja excluir a etapa "${etapaParaDeletar.title || etapaParaDeletar.nome}"?\n\nEsta ação não pode ser desfeita.`
      );
      
      if (!confirmacao) return { needsMoveLeads: false };
      
      try {
        await deleteEtapaMutation.mutateAsync(etapaParaDeletar.id);
        return { needsMoveLeads: false };
      } catch (error: any) {
        console.error('Erro ao excluir etapa:', error);
        toast.error(error.message || 'Erro ao excluir etapa. Tente novamente.');
        throw error;
      }
    }
  };

  // Função para mover leads e excluir etapa
  const handleMoveLeadsAndDeleteEtapa = async (
    targetEtapaId: string, 
    etapaToDelete: IKanbanColumn, 
    leads: Lead[]
  ) => {
    if (!etapaToDelete || !etapaToDelete.id) return;
    
    try {
      const currentLeads = Array.isArray(leads) ? leads : [];
      const leadsToMove = currentLeads.filter(lead => lead.etapa_kanban_id === etapaToDelete.id);
      
      // Mover todos os leads para a nova etapa
      const movePromises = leadsToMove.map(lead =>
        moveLeadMutation.mutateAsync({ leadId: lead.id, etapaId: targetEtapaId })
      );
      await Promise.all(movePromises);
      
      // Agora pode deletar a etapa
      await deleteEtapaMutation.mutateAsync(etapaToDelete.id);
      
    } catch (error) {
      console.error('Erro ao mover leads e deletar etapa:', error);
      toast.error('Ocorreu um erro ao mover os leads e deletar a etapa.');
      throw error;
    }
  };

  return {
    handleSaveEtapa,
    handleDeleteEtapa,
    handleMoveLeadsAndDeleteEtapa,
    
    // Estados de loading das mutações
    isUpdatingEtapa: updateEtapaMutation.isPending,
    isDeletingEtapa: deleteEtapaMutation.isPending,
  };
};
