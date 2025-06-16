
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar todas as ações relacionadas aos leads no Kanban
 * 
 * Funcionalidades:
 * - Editar/salvar leads
 * - Deletar leads
 * - Mover leads entre colunas (drag & drop)
 * - Abrir chat com lead
 * - Visualizar histórico do lead
 * - Estados de loading para operações assíncronas
 */

// Tipo Lead simplificado para evitar importação circular
interface LeadData {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  etapa_kanban_id?: string;
  origem_lead?: string;
  servico_interesse?: string;
  anotacoes?: string;
  tag_id?: string;
}

export const useKanbanLeadActions = () => {
  const queryClient = useQueryClient();

  // Mutation para atualizar/editar lead
  const updateLeadMutation = useMutation({
    mutationFn: async (leadData: Partial<LeadData> & { id: string }) => {
      console.log('🔄 Atualizando lead:', leadData.id);
      
      const { data, error } = await supabase
        .from('leads')
        .update({
          nome: leadData.nome,
          email: leadData.email,
          telefone: leadData.telefone,
          etapa_kanban_id: leadData.etapa_kanban_id,
          origem_lead: leadData.origem_lead,
          servico_interesse: leadData.servico_interesse,
          anotacoes: leadData.anotacoes,
          tag_id: leadData.tag_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadData.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar lead:', error);
        throw new Error(`Erro ao atualizar lead: ${error.message}`);
      }

      console.log('✅ Lead atualizado com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
      toast.success(`Lead ${data.nome} atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('❌ Erro na mutation de atualização:', error);
      toast.error('Erro ao atualizar lead: ' + error.message);
    }
  });

  // Mutation para criar novo lead
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: Omit<LeadData, 'id'>) => {
      console.log('➕ Criando novo lead:', leadData);
      
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          nome: leadData.nome,
          email: leadData.email,
          telefone: leadData.telefone,
          etapa_kanban_id: leadData.etapa_kanban_id,
          origem_lead: leadData.origem_lead,
          servico_interesse: leadData.servico_interesse,
          anotacoes: leadData.anotacoes,
          tag_id: leadData.tag_id
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar lead:', error);
        throw new Error(`Erro ao criar lead: ${error.message}`);
      }

      console.log('✅ Lead criado com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
      toast.success(`Lead ${data.nome} criado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('❌ Erro na mutation de criação:', error);
      toast.error('Erro ao criar lead: ' + error.message);
    }
  });

  // Mutation para deletar lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      console.log('🗑️ Deletando lead:', leadId);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('❌ Erro ao deletar lead:', error);
        throw new Error(`Erro ao deletar lead: ${error.message}`);
      }

      console.log('✅ Lead deletado com sucesso');
      return leadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
      toast.success('Lead excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na mutation de exclusão:', error);
      toast.error('Erro ao excluir lead: ' + error.message);
    }
  });

  // Mutation para mover lead entre etapas
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, toEtapaId }: { leadId: string; toEtapaId: string }) => {
      console.log('🔄 Movendo lead:', leadId, 'para etapa:', toEtapaId);
      
      const { data, error } = await supabase
        .from('leads')
        .update({
          etapa_kanban_id: toEtapaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao mover lead:', error);
        throw new Error(`Erro ao mover lead: ${error.message}`);
      }

      console.log('✅ Lead movido com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
      toast.success('Lead movido para nova etapa!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro na mutation de movimentação:', error);
      toast.error('Erro ao mover lead: ' + error.message);
    }
  });

  // Função para editar lead existente
  const handleEditLead = async (leadData: Partial<LeadData> & { id: string }) => {
    try {
      console.log('💾 Iniciando edição do lead:', leadData.id);
      await updateLeadMutation.mutateAsync(leadData);
    } catch (error) {
      console.error('❌ Erro ao editar lead:', error);
      throw error;
    }
  };

  // Função para salvar lead (criar ou editar)
  const handleSaveLead = async (leadData: any, existingLead?: any | null) => {
    try {
      if (existingLead?.id || leadData.id) {
        // Modo edição
        const leadToUpdate = {
          id: existingLead?.id || leadData.id,
          ...leadData
        };
        console.log('💾 Salvando lead existente:', leadToUpdate.id);
        await updateLeadMutation.mutateAsync(leadToUpdate);
      } else {
        // Modo criação
        console.log('➕ Criando novo lead');
        await createLeadMutation.mutateAsync(leadData);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar lead:', error);
      throw error;
    }
  };

  // Função para deletar lead
  const handleDeleteLead = async (leadId: string) => {
    try {
      console.log('🗑️ Iniciando exclusão do lead:', leadId);
      
      const confirmar = window.confirm('Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.');
      if (!confirmar) {
        console.log('❌ Exclusão cancelada pelo usuário');
        return;
      }

      await deleteLeadMutation.mutateAsync(leadId);
    } catch (error) {
      console.error('❌ Erro ao deletar lead:', error);
      throw error;
    }
  };

  // Função para mover lead entre colunas (drag & drop)
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    try {
      console.log('🔄 Movendo lead:', leadId, 'de', fromColumnId, 'para', toColumnId);
      
      if (fromColumnId === toColumnId) {
        console.log('📌 Lead já está na coluna de destino');
        return;
      }

      await moveLeadMutation.mutateAsync({
        leadId,
        toEtapaId: toColumnId
      });
    } catch (error) {
      console.error('❌ Erro ao mover lead:', error);
      throw error;
    }
  };

  // Função para abrir chat com lead
  const handleOpenChat = (lead: any) => {
    console.log('💬 Abrindo chat com lead:', lead.nome);
    
    if (typeof window !== 'undefined') {
      const chatUrl = `/chat?leadId=${lead.id}`;
      window.location.href = chatUrl;
    }
  };

  // Função para visualizar histórico do lead
  const handleOpenHistory = async (lead: any) => {
    console.log('📋 Abrindo histórico do lead:', lead.nome);
    
    try {
      const { data: historico, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        toast.error('Erro ao carregar histórico do lead');
        return [];
      }

      console.log('✅ Histórico carregado:', historico);
      return historico || [];
    } catch (error) {
      console.error('❌ Erro ao abrir histórico:', error);
      toast.error('Erro ao abrir histórico do lead');
      return [];
    }
  };

  // Retornar todas as funções e estados necessários para o KanbanBoard
  return {
    // Funções principais que o KanbanBoard espera
    handleEditLead,
    handleSaveLead,
    handleDeleteLead,
    handleDropLeadInColumn,
    handleOpenChat,
    handleOpenHistory,
    
    // Estados de loading
    isUpdating: updateLeadMutation.isPending,
    isCreating: createLeadMutation.isPending,
    isDeleting: deleteLeadMutation.isPending,
    isMoving: moveLeadMutation.isPending,
    
    // Estados de erro
    updateError: updateLeadMutation.error,
    createError: createLeadMutation.error,
    deleteError: deleteLeadMutation.error,
    moveError: moveLeadMutation.error,
  };
};
