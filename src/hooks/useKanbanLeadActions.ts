
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
  // Hooks de mutação do React Query
  const updateLeadMutation = useUpdateLead();
  const createLeadMutation = useCreateLead();
  const moveLeadMutation = useMoveLeadToStage();

  // Função para salvar lead (criar ou atualizar)
  const handleSaveLead = async (leadData: any, selectedLead: Lead | null) => {
    try {
      console.log('💾 Salvando lead:', leadData);
      
      if (selectedLead && selectedLead.id) {
        // Atualizar lead existente
        await updateLeadMutation.mutateAsync({
          id: selectedLead.id,
          ...leadData
        });
        console.log('✅ Lead atualizado com sucesso');
      } else {
        // Criar novo lead
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
      throw error; // Re-lança para que o modal possa tratar se necessário
    }
  };

  /**
   * Manipulador chamado quando um LeadCard é SOLTO em uma coluna.
   * Esta função é crucial para a persistência da mudança de etapa do lead.
   */
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    console.log(`[KanbanLeadActions] 📦 handleDropLeadInColumn: Tentando mover lead...`, {
      leadId,
      fromColumnId,
      toColumnId
    });

    // Validações essenciais dos parâmetros
    if (!leadId || !fromColumnId || !toColumnId) {
      console.error('[KanbanLeadActions] ❌ Erro: IDs inválidos ou ausentes.', { leadId, fromColumnId, toColumnId });
      return;
    }

    // Se o lead foi solto na mesma coluna de onde veio, não faz nada
    if (fromColumnId === toColumnId) {
      console.log(`[KanbanLeadActions] ⚪️ Lead "${leadId}" solto na mesma coluna de origem ("${fromColumnId}"). Nenhuma atualização de etapa necessária.`);
      return;
    }
    
    try {
      console.log(`[KanbanLeadActions] 🚀 Executando mutação para mover lead "${leadId}" para etapa "${toColumnId}".`);
      
      // Chama a mutação para atualizar a etapa do lead no backend
      const result = await moveLeadMutation.mutateAsync({ 
        leadId, 
        etapaId: toColumnId 
      });
      
      console.log('[KanbanLeadActions] ✅ Mutação executada com sucesso. Resultado:', result);

    } catch (error: any) {
      console.error('[KanbanLeadActions] ❌ Erro ao executar mutação:', {
        errorMessage: error.message,
        leadId,
        toColumnId,
        errorStack: error.stack
      });
    }
  };

  // Função para abrir histórico de consultas
  const handleOpenHistory = async (lead: Lead) => {
    try {
      const consultas: any[] = []; // Simulação - implementar busca real se necessário
      return consultas;
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      toast.error('Erro ao carregar histórico. Tente novamente.');
      return [];
    }
  };

  // Função para abrir chat com lead
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
    
    // Estados de loading das mutações
    isCreatingLead: createLeadMutation.isPending,
    isUpdatingLead: updateLeadMutation.isPending,
    isMovingLead: moveLeadMutation.isPending,
  };
};
