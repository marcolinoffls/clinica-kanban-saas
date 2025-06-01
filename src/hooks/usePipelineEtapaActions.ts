
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EtapaPipeline, LeadPipeline } from '@/components/pipeline/types';
import { useAuthUser } from './useAuthUser';

/**
 * Hook para gerenciar ações das etapas no Pipeline
 * 
 * Centraliza as operações de:
 * - Criar etapa (com clinica_id automático e protegido por RLS)
 * - Editar etapa (totalmente protegido por RLS)
 * - Deletar etapa (totalmente protegido por RLS)
 * - Mover leads ao deletar etapa
 * 
 * As políticas RLS garantem isolamento TOTAL por clínica:
 * - Usuários só podem criar/editar/deletar etapas da própria clínica
 * - Tentativas de acesso a etapas de outras clínicas são automaticamente bloqueadas
 */

export const usePipelineEtapaActions = () => {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthUser();

  // Mutation para criar/editar etapa
  const saveEtapaMutation = useMutation({
    mutationFn: async ({ nome, editingEtapa, etapas }: { nome: string; editingEtapa: EtapaPipeline | null; etapas: any[] }) => {
      console.log('💾 Salvando etapa no Pipeline:', { nome, editingEtapa });

      if (editingEtapa) {
        // Editar etapa existente (RLS garante que só pode editar etapas da própria clínica)
        const { data, error } = await supabase
          .from('etapas_kanban')
          .update({ nome })
          .eq('id', editingEtapa.id)
          .select()
          .single();

        if (error) {
          // Tratamento específico para erros de RLS
          if (error.code === '42501' || error.message.includes('policy')) {
            throw new Error('Você não tem permissão para editar esta etapa.');
          }
          throw error;
        }
        return data;
      } else {
        // Criar nova etapa
        if (!userProfile?.clinica_id) {
          throw new Error('Usuário não está associado a uma clínica válida');
        }

        // Calcular próxima ordem
        const proximaOrdem = etapas.length > 0 
          ? Math.max(...etapas.map(e => e.ordem || 0)) + 1 
          : 0;

        // Incluir clinica_id explicitamente para garantir que a RLS funcione
        const { data, error } = await supabase
          .from('etapas_kanban')
          .insert([{
            nome,
            ordem: proximaOrdem,
            clinica_id: userProfile.clinica_id,
          }])
          .select()
          .single();

        if (error) {
          // Tratamento específico para erros de RLS
          if (error.code === '42501' || error.message.includes('policy')) {
            throw new Error('Você não tem permissão para criar etapas.');
          }
          throw error;
        }
        return data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      const action = variables.editingEtapa ? 'atualizada' : 'criada';
      toast.success(`Etapa ${action} com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao salvar etapa:', error);
      toast.error(error.message || 'Erro ao salvar etapa');
    },
  });

  // Mutation para deletar etapa
  const deleteEtapaMutation = useMutation({
    mutationFn: async (etapaId: string) => {
      console.log('🗑️ Deletando etapa:', etapaId);

      // RLS garante que só pode deletar etapas da própria clínica
      const { error } = await supabase
        .from('etapas_kanban')
        .delete()
        .eq('id', etapaId);

      if (error) {
        // Tratamento específico para erros de RLS
        if (error.code === '42501' || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para deletar esta etapa.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapas'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Etapa deletada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao deletar etapa:', error);
      toast.error(error.message || 'Erro ao deletar etapa');
    },
  });

  // Mutation para mover leads ao deletar etapa
  const moveLeadsMutation = useMutation({
    mutationFn: async ({ leadsToMove, targetEtapaId }: { leadsToMove: LeadPipeline[]; targetEtapaId: string }) => {
      console.log('🔄 Movendo leads para outra etapa:', { count: leadsToMove.length, targetEtapaId });

      const leadIds = leadsToMove.map(lead => lead.id);
      
      const { error } = await supabase
        .from('leads')
        .update({
          etapa_kanban_id: targetEtapaId,
          data_ultimo_contato: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', leadIds);

      if (error) {
        // Tratamento específico para erros de RLS em leads
        if (error.code === '42501' || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para mover estes leads.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Leads movidos com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao mover leads:', error);
      toast.error(error.message || 'Erro ao mover leads');
    },
  });

  // Função para salvar etapa
  const handleSaveEtapa = async (nome: string, editingEtapa: EtapaPipeline | null, etapas: any[]) => {
    await saveEtapaMutation.mutateAsync({ nome, editingEtapa, etapas });
  };

  // Função para deletar etapa
  const handleDeleteEtapa = async (etapa: EtapaPipeline, leads: LeadPipeline[]) => {
    const leadsDaEtapa = leads.filter(lead => lead.etapa_kanban_id === etapa.id);
    
    if (leadsDaEtapa.length > 0) {
      // Retorna informação de que é necessário mover leads
      return {
        needsMoveLeads: true,
        etapaToDelete: etapa,
        leadsToMove: leadsDaEtapa,
      };
    } else {
      // Deleta diretamente se não há leads
      await deleteEtapaMutation.mutateAsync(etapa.id);
      return { needsMoveLeads: false };
    }
  };

  // Função para mover leads e deletar etapa
  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string, etapaToDelete: EtapaPipeline, leads: LeadPipeline[]) => {
    const leadsToMove = leads.filter(lead => lead.etapa_kanban_id === etapaToDelete.id);
    
    // Primeiro mover os leads
    await moveLeadsMutation.mutateAsync({ leadsToMove, targetEtapaId });
    
    // Depois deletar a etapa
    await deleteEtapaMutation.mutateAsync(etapaToDelete.id);
  };

  return {
    handleSaveEtapa,
    handleDeleteEtapa,
    handleMoveLeadsAndDeleteEtapa,
    isSavingEtapa: saveEtapaMutation.isPending,
    isDeletingEtapa: deleteEtapaMutation.isPending,
    isMovingLeads: moveLeadsMutation.isPending,
  };
};
