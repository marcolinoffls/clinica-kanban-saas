
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LeadPipeline } from '@/components/pipeline/types';

/**
 * Hook para gerenciar ações dos leads no Pipeline
 * 
 * Centraliza as operações de:
 * - Salvar lead (criar/editar)
 * - Mover lead entre etapas (drag and drop)
 * - Abrir histórico de consultas
 * - Abrir chat
 */

export const usePipelineLeadActions = (onNavigateToChat?: (leadId: string) => void) => {
  const queryClient = useQueryClient();

  // Mutation para salvar lead
  const saveLeadMutation = useMutation({
    mutationFn: async ({ leadData, isEditing }: { leadData: any; isEditing: boolean }) => {
      console.log('💾 Salvando lead no Pipeline:', leadData);

      if (isEditing && leadData.id) {
        // Atualizar lead existente
        const { data, error } = await supabase
          .from('leads')
          .update({
            nome: leadData.nome,
            telefone: leadData.telefone,
            email: leadData.email,
            origem_lead: leadData.origem_lead,
            servico_interesse: leadData.servico_interesse,
            anotacoes: leadData.anotacoes,
            etapa_kanban_id: leadData.etapa_kanban_id,
            tag_id: leadData.tag_id,
            data_ultimo_contato: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadData.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo lead
        const { data, error } = await supabase
          .from('leads')
          .insert([{
            nome: leadData.nome,
            telefone: leadData.telefone,
            email: leadData.email,
            origem_lead: leadData.origem_lead,
            servico_interesse: leadData.servico_interesse,
            anotacoes: leadData.anotacoes,
            etapa_kanban_id: leadData.etapa_kanban_id,
            tag_id: leadData.tag_id,
            data_ultimo_contato: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead salvo com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead: ' + error.message);
    },
  });

  // Mutation para mover lead entre etapas
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, toEtapaId }: { leadId: string; toEtapaId: string }) => {
      console.log('🔄 Movendo lead entre etapas:', { leadId, toEtapaId });

      const { data, error } = await supabase
        .from('leads')
        .update({
          etapa_kanban_id: toEtapaId,
          data_ultimo_contato: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead movido com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao mover lead:', error);
      toast.error('Erro ao mover lead: ' + error.message);
    },
  });

  // Função para salvar lead
  const handleSaveLead = async (leadData: any, selectedLead: LeadPipeline | null) => {
    const isEditing = !!selectedLead;
    const dataToSave = isEditing ? { ...leadData, id: selectedLead.id } : leadData;
    
    await saveLeadMutation.mutateAsync({ leadData: dataToSave, isEditing });
  };

  // Função para mover lead via drag and drop
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    if (fromColumnId === toColumnId) return;
    
    await moveLeadMutation.mutateAsync({ leadId, toEtapaId: toColumnId });
  };

  // Função para abrir histórico (placeholder - implementar conforme necessário)
  const handleOpenHistory = async (lead: LeadPipeline) => {
    console.log('📋 Abrindo histórico do lead:', lead.id);
    // Aqui você pode buscar consultas/histórico do lead se necessário
    return []; // Retorna consultas vazias por enquanto
  };

  // Função para abrir chat
  const handleOpenChat = (lead: LeadPipeline) => {
    if (onNavigateToChat) {
      onNavigateToChat(lead.id);
    }
  };

  return {
    handleSaveLead,
    handleDropLeadInColumn,
    handleOpenHistory,
    handleOpenChat,
    isSavingLead: saveLeadMutation.isPending,
    isMovingLead: moveLeadMutation.isPending,
  };
};
