
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
      console.log('💾 Salvando lead:', leadData);
      
      if (selectedLead && selectedLead.id) {
        await updateLeadMutation.mutateAsync({
          id: selectedLead.id,
          ...leadData
        });
        console.log('✅ Lead atualizado com sucesso');
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
        console.log('✅ Lead criado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar lead:', error);
      throw error;
    }
  };

  /**
   * Manipulador melhorado para quando um LeadCard é SOLTO em uma coluna.
   * Inclui logs detalhados para debugging e melhor tratamento de erros.
   */
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    console.log(`[KanbanLeadActions] 🚀 ENTRADA na handleDropLeadInColumn:`, {
      leadId,
      fromColumnId,
      toColumnId,
      timestamp: new Date().toISOString()
    });

    // Validações mais detalhadas
    if (!leadId) {
      console.error('[KanbanLeadActions] ❌ ERRO: leadId está vazio ou undefined', { leadId });
      toast.error('Erro: ID do lead não identificado');
      return;
    }

    if (!fromColumnId) {
      console.error('[KanbanLeadActions] ❌ ERRO: fromColumnId está vazio ou undefined', { fromColumnId });
      toast.error('Erro: Coluna de origem não identificada');
      return;
    }

    if (!toColumnId) {
      console.error('[KanbanLeadActions] ❌ ERRO: toColumnId está vazio ou undefined', { toColumnId });
      toast.error('Erro: Coluna de destino não identificada');
      return;
    }

    if (fromColumnId === toColumnId) {
      console.log(`[KanbanLeadActions] ⚪️ Lead "${leadId}" movido para a mesma etapa. Nenhuma atualização necessária.`);
      return;
    }
    
    try {
      console.log(`[KanbanLeadActions] 📡 INICIANDO mutação useMoveLeadToStage...`);
      console.log(`[KanbanLeadActions] 📊 Parâmetros da mutação:`, { 
        leadId, 
        etapaId: toColumnId,
        isPending: moveLeadMutation.isPending
      });
      
      const result = await moveLeadMutation.mutateAsync({ 
        leadId, 
        etapaId: toColumnId 
      });
      
      console.log('[KanbanLeadActions] ✅ Mutação useMoveLeadToStage CONCLUÍDA com sucesso!');
      console.log('[KanbanLeadActions] 📋 Resultado da mutação:', result);
      console.log('[KanbanLeadActions] 🎯 Lead movido com sucesso de', fromColumnId, 'para', toColumnId);

    } catch (error: any) {
      console.error('[KanbanLeadActions] ❌ ERRO na mutação useMoveLeadToStage:', {
        errorMessage: error?.message || 'Erro desconhecido',
        errorDetails: error,
        leadId,
        fromColumnId,
        toColumnId,
        stackTrace: error?.stack
      });
      
      // Toast com erro mais específico
      const errorMessage = error?.message || 'Erro desconhecido ao mover lead';
      toast.error(`Erro ao mover lead: ${errorMessage}`);
    }
  };

  const handleOpenHistory = async (lead: Lead) => {
    try {
      const consultas: any[] = [];
      return consultas;
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
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
    
    isCreatingLead: createLeadMutation.isPending,
    isUpdatingLead: updateLeadMutation.isPending,
    isMovingLead: moveLeadMutation.isPending,
  };
};
