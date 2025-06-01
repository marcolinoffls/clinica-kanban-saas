
import { Lead } from '@/components/kanban/KanbanBoard';
import { useUpdateLead, useCreateLead, CreateLeadData, useMoveLeadToStage } from '@/hooks/useLeadsData';
import { toast } from 'sonner';

/**
 * Hook para gerenciar ações relacionadas aos leads no Kanban
 * 
 * Centraliza as operações de:
 * - Criação de novos leads
 * - Atualização de leads existentes
 * - Movimentação de leads entre etapas
 * - Abertura de histórico e chat
 */
export const useKanbanLeadActions = (
  onNavigateToChat?: (leadId: string) => void
) => {
  const updateLeadMutation = useUpdateLead();
  const createLeadMutation = useCreateLead();
  const moveLeadMutation = useMoveLeadToStage();

  const handleSaveLead = async (leadData: any, selectedLead: Lead | null) => {
    try {
      console.log('[KanbanLeadActions] 💾 Salvando lead:', leadData.nome);
      
      if (selectedLead && selectedLead.id) {
        await updateLeadMutation.mutateAsync({
          id: selectedLead.id,
          ...leadData
        });
      } else {
        const createData: CreateLeadData = {
          nome: leadData.nome,
          telefone: leadData.telefone,
          email: leadData.email,
          clinica_id: leadData.clinica_id,
          etapa_kanban_id: leadData.etapa_kanban_id,
          tag_id: leadData.tag_id,
          anotacoes: leadData.anotacoes,
          origem_lead: leadData.origem_lead,
          servico_interesse: leadData.servico_interesse,
        };
        
        await createLeadMutation.mutateAsync(createData);
      }
    } catch (error) {
      console.error('[KanbanLeadActions] ❌ Erro ao salvar lead:', error);
      throw error;
    }
  };

  /**
   * Handler principal para quando um LeadCard é solto em uma coluna.
   * Gerencia a movimentação de leads entre etapas no Kanban.
   */
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    console.log('[KanbanLeadActions] 🚀 Processando drop de lead:', {
      leadId,
      fromColumnId,
      toColumnId
    });

    // Validações básicas
    if (!leadId || !fromColumnId || !toColumnId) {
      console.error('[KanbanLeadActions] ❌ Parâmetros inválidos:', { leadId, fromColumnId, toColumnId });
      toast.error('Erro: Dados do lead ou coluna inválidos');
      return;
    }

    if (fromColumnId === toColumnId) {
      console.log('[KanbanLeadActions] ⚪️ Lead solto na mesma etapa, nenhuma ação necessária');
      return;
    }
    
    try {
      console.log('[KanbanLeadActions] 📡 Iniciando mutação para mover lead...');
      
      await moveLeadMutation.mutateAsync({ 
        leadId, 
        etapaId: toColumnId 
      });
      
      console.log('[KanbanLeadActions] ✅ Lead movido com sucesso!');

    } catch (error: any) {
      console.error('[KanbanLeadActions] ❌ Erro ao mover lead:', error);
      toast.error(`Erro ao mover lead: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleOpenHistory = async (lead: Lead) => {
    try {
      // Placeholder para buscar consultas do histórico
      const consultas: any[] = [];
      return consultas;
    } catch (error) {
      console.error('[KanbanLeadActions] ❌ Erro ao buscar consultas:', error);
      toast.error('Erro ao carregar histórico. Tente novamente.');
      return [];
    }
  };

  const handleOpenChat = (lead: Lead) => {
    if (onNavigateToChat) {
      onNavigateToChat(lead.id);
    }
  };

  return {
    handleSaveLead,
    handleDropLeadInColumn,
    handleOpenHistory,
    handleOpenChat,
    
    // Estados de loading
    isCreatingLead: createLeadMutation.isPending,
    isUpdatingLead: updateLeadMutation.isPending,
    isMovingLead: moveLeadMutation.isPending,
  };
};
