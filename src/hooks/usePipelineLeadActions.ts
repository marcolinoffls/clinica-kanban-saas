import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LeadPipeline } from '@/components/pipeline/types';
import { useAuthUser } from './useAuthUser'; // NOVO: Importar o hook para pegar dados do usuário

/**
 * Hook para gerenciar ações dos leads no Pipeline
 * * Centraliza as operações de:
 * - Salvar lead (criar/editar)
 * - Mover lead entre etapas (drag and drop)
 * - Abrir histórico de consultas
 * - Abrir chat
 */

export const usePipelineLeadActions = (onNavigateToChat?: (leadId: string) => void) => {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthUser(); // NOVO: Obter o perfil do usuário logado

  // Mutation para salvar lead
  const saveLeadMutation = useMutation({
    mutationFn: async ({ leadData, isEditing }: { leadData: any; isEditing: boolean }) => {
      console.log('💾 Salvando lead no Pipeline:', leadData);

      if (isEditing && leadData.id) {
        // ATUALIZAÇÃO DE LEAD EXISTENTE
        // A política RLS de UPDATE garante que o usuário só pode editar
        // um lead se o clinica_id do lead já existente corresponder ao seu.
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
            // A tipagem em useLeadsData.ts foi corrigida para usar tag_ids (plural)
            tag_ids: leadData.tag_ids, 
            data_ultimo_contato: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadData.id)
          .select()
          .single();

        if (error) throw error;
        return data;

      } else {
        // ========= INÍCIO DA CORREÇÃO DE SEGURANÇA =========
        // CRIAÇÃO DE NOVO LEAD
        // 1. Validação de Segurança: Garante que temos o clinica_id do usuário logado.
        if (!userProfile?.clinica_id) {
          throw new Error('Usuário não está associado a uma clínica para criar um lead.');
        }

        // 2. Desestruturamos o clinica_id que possa vir do formulário para ignorá-lo
        const { clinica_id, ...dadosDoFormulario } = leadData;

        // 3. Criamos um objeto seguro para inserção, forçando o uso do clinica_id do usuário.
        const dadosParaInserir = {
          ...dadosDoFormulario,
          clinica_id: userProfile.clinica_id, // Fonte segura da verdade
          data_ultimo_contato: new Date().toISOString(),
        };
        // ========= FIM DA CORREÇÃO DE SEGURANÇA =========

        const { data, error } = await supabase
          .from('leads')
          .insert([dadosParaInserir]) // Usamos o objeto seguro
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

  // (O restante do arquivo continua igual...)

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