import { Lead } from '@/components/kanban/KanbanBoard';
import { useUpdateLead, useCreateLead, useMoveLeadToStage } from './useLeadsData';
import { useConsultasData } from './useConsultasData';
import { toast } from 'sonner';

/**
 * Hook para gerenciar ações relacionadas aos leads no Kanban
 */
export const useKanbanLeadActions = (
  onNavigateToChat?: (leadId: string) => void
) => {
  const updateLeadMutation = useUpdateLead();
  const createLeadMutation = useCreateLead();
  const moveLeadMutation = useMoveLeadToStage();
  const { consultasData } = useConsultasData();

  const handleSaveLead = async (leadData: any, selectedLead: Lead | null) => {
    try {
      if (selectedLead) {
        console.log('🔄 [useKanbanLeadActions] Atualizando lead existente:', selectedLead.id);
        await updateLeadMutation.mutateAsync({
          id: selectedLead.id,
          data: leadData,
        });
        toast.success('Lead atualizado com sucesso!');
      } else {
        console.log('➕ [useKanbanLeadActions] Criando novo lead');
        await createLeadMutation.mutateAsync(leadData);
        toast.success('Lead criado com sucesso!');
      }
    } catch (error) {
      console.error('❌ [useKanbanLeadActions] Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
      throw error;
    }
  };

  /**
   * Handler principal para quando um LeadCard é solto em uma coluna.
   * Gerencia a movimentação de leads entre etapas no Kanban.
   */
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    console.log('🚀 [useKanbanLeadActions] handleDropLeadInColumn chamado:', {
      leadId,
      fromColumnId,
      toColumnId
    });

    try {
      await moveLeadMutation.mutateAsync({
        leadId,
        etapaId: toColumnId
      });
      console.log('✅ [useKanbanLeadActions] Lead movido com sucesso');
    } catch (error) {
      console.error('❌ [useKanbanLeadActions] Erro ao mover lead:', error);
      toast.error('Erro ao mover lead');
    }
  };

  const handleOpenHistory = async (lead: Lead) => {
    try {
      console.log('📖 [useKanbanLeadActions] Abrindo histórico do lead:', lead.id);
      // Lógica para buscar consultas do lead
      const consultas = consultasData?.filter(consulta => consulta.lead_id === lead.id) || [];
      return consultas;
    } catch (error) {
      console.error('❌ [useKanbanLeadActions] Erro ao buscar histórico:', error);
      toast.error('Erro ao carregar histórico');
      return [];
    }
  };

  const handleOpenChat = (lead: Lead) => {
    console.log('💬 [useKanbanLeadActions] Abrindo chat do lead:', lead.id);
    if (onNavigateToChat) {
      onNavigateToChat(lead.id);
    }
  };

  return {
    handleSaveLead,
    handleDropLeadInColumn,
    handleOpenHistory,
    handleOpenChat,
    isCreatingLead: createLeadMutation.isPending,
    isUpdatingLead: updateLeadMutation.isPending,
    isMovingLead: moveLeadMutation.isPending,
  };
};