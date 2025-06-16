
/**
 * Hook para gerenciar ações dos leads no Kanban
 * 
 * O que faz:
 * - Gerencia abertura/fechamento de modais
 * - Controla criação e edição de leads
 * - Controla exclusão de leads
 * 
 * Onde é usado:
 * - Componente KanbanBoard para ações dos leads
 * 
 * Como se conecta:
 * - Usa React Query para mutações
 * - Interage com tabela leads do Supabase
 * - Usa context de clínica para filtrar dados
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import { toast } from 'sonner';

interface Lead {
  id: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  etapa_kanban_id: string | null;
  clinica_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  anotacoes: string | null;
  origem_lead: string | null;
  servico_interesse: string | null;
  convertido: boolean | null;
  data_ultimo_contato: string | null;
  ltv: number | null;
  tag_id: string | null;
  tag_id_alias: string | null;
  avatar_url: string | null;
  status_conversao: string | null;
  anuncio: string | null;
  ad_name: string | null;
  ad_ink: string | null;
  notes: string | null;
  data_ultimo_followup: string | null;
  follow_up_pausado: boolean | null;
  ai_conversation_enabled: boolean | null;
  nome_clinica: string | null;
  id_direct: string | null;
  meu_id_direct: string | null;
  name: string | null;
  phone: string | null;
}

interface NewLeadData {
  nome: string;
  telefone?: string;
  email?: string;
  etapa_kanban_id: string;
  origem_lead?: string;
  servico_interesse?: string;
  anotacoes?: string;
}

export const useKanbanLeadActions = () => {
  const { clinicaId } = useClinica();
  const queryClient = useQueryClient();
  
  // Estados para controle dos modais
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newLeadEtapaId, setNewLeadEtapaId] = useState<string | null>(null);

  // Função para abrir modal de novo lead
  const openNewLeadModal = (etapaId: string) => {
    setNewLeadEtapaId(etapaId);
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };

  // Função para abrir modal de edição de lead
  const openEditLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setNewLeadEtapaId(null);
    setIsLeadModalOpen(true);
  };

  // Função para fechar modal
  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
    setNewLeadEtapaId(null);
  };

  // Mutation para criar novo lead
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: NewLeadData) => {
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          clinica_id: clinicaId,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar lead:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['leads', clinicaId] });
      queryClient.invalidateQueries({ queryKey: ['etapas-leads', clinicaId] });
      toast.success('Lead criado com sucesso!');
      closeLeadModal();
    },
    onError: (error: any) => {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead. Tente novamente.');
    },
  });

  // Mutation para atualizar lead
  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar lead:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['leads', clinicaId] });
      queryClient.invalidateQueries({ queryKey: ['etapas-leads', clinicaId] });
      toast.success('Lead atualizado com sucesso!');
      closeLeadModal();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead. Tente novamente.');
    },
  });

  // Mutation para deletar lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao deletar lead:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['leads', clinicaId] });
      queryClient.invalidateQueries({ queryKey: ['etapas-leads', clinicaId] });
      toast.success('Lead deletado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar lead:', error);
      toast.error('Erro ao deletar lead. Tente novamente.');
    },
  });

  // Função para salvar lead (criar ou atualizar)
  const saveLead = (leadData: NewLeadData | Lead) => {
    if (selectedLead) {
      // Editando lead existente
      updateLeadMutation.mutate({
        leadId: selectedLead.id,
        updates: leadData,
      });
    } else {
      // Criando novo lead
      createLeadMutation.mutate(leadData as NewLeadData);
    }
  };

  // Função para deletar lead
  const deleteLead = (leadId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este lead?')) {
      deleteLeadMutation.mutate(leadId);
    }
  };

  return {
    // Estados
    isLeadModalOpen,
    selectedLead,
    newLeadEtapaId,
    
    // Ações dos modais
    openNewLeadModal,
    openEditLeadModal,
    closeLeadModal,
    
    // Ações de CRUD
    saveLead,
    deleteLead,
    
    // Estados de loading
    isCreating: createLeadMutation.isPending,
    isUpdating: updateLeadMutation.isPending,
    isDeleting: deleteLeadMutation.isPending,
  };
};
