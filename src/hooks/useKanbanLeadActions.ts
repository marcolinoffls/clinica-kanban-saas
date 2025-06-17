
import { useState } from 'react';
import { Lead } from './useLeadsData';
import { useUpdateLead, useDeleteLead } from './useSupabaseLeads';
import { toast } from 'sonner';

/**
 * Hook para gerenciar ações de leads no Kanban
 * 
 * Fornece funcionalidades para:
 * - Abrir/fechar modais de lead
 * - Salvar alterações no lead
 * - Deletar leads
 * - Navegar para chat
 * - Abrir histórico de consultas
 * - Gerenciar drag and drop
 * 
 * Integra com outros hooks para operações CRUD no Supabase
 */

interface UseKanbanLeadActionsReturn {
  // Estados dos modais
  isLeadModalOpen: boolean;
  selectedLead: Lead | null;
  newLeadEtapaId: string;
  
  // Ações dos modais
  openNewLeadModal: (etapaId: string) => void;
  openEditLeadModal: (lead: Lead) => void;
  closeLeadModal: () => void;
  
  // Ações do lead
  handleSaveLead: (leadData: Partial<Lead>) => Promise<void>;
  handleDeleteLead: (leadId: string) => Promise<void>;
  handleOpenChat: (lead: Lead) => void;
  handleOpenHistory: (lead: Lead) => void;
  handleDropLeadInColumn: (leadId: string, targetEtapaId: string) => Promise<void>;
  
  // Estados de loading
  isSaving: boolean;
  isDeleting: boolean;
}

export const useKanbanLeadActions = (): UseKanbanLeadActionsReturn => {
  // Estados locais para controle dos modais
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newLeadEtapaId, setNewLeadEtapaId] = useState('');
  
  // Hooks para operações CRUD
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();
  
  // Função para abrir modal de novo lead
  const openNewLeadModal = (etapaId: string) => {
    console.log('[useKanbanLeadActions] Abrindo modal para novo lead na etapa:', etapaId);
    setNewLeadEtapaId(etapaId);
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };
  
  // Função para abrir modal de edição de lead
  const openEditLeadModal = (lead: Lead) => {
    console.log('[useKanbanLeadActions] Abrindo modal para editar lead:', lead.id);
    setSelectedLead(lead);
    setNewLeadEtapaId('');
    setIsLeadModalOpen(true);
  };
  
  // Função para fechar modal
  const closeLeadModal = () => {
    console.log('[useKanbanLeadActions] Fechando modal de lead');
    setIsLeadModalOpen(false);
    setSelectedLead(null);
    setNewLeadEtapaId('');
  };
  
  // Função para salvar lead (criar ou atualizar)
  const handleSaveLead = async (leadData: Partial<Lead>) => {
    try {
      console.log('[useKanbanLeadActions] Salvando lead com dados:', leadData);
      
      // Se há um lead selecionado, é uma atualização
      if (selectedLead) {
        const updateData = {
          id: selectedLead.id,
          nome: leadData.nome,
          telefone: leadData.telefone,
          email: leadData.email,
          ltv: leadData.ltv,
          origem_lead: leadData.origem_lead,
          servico_interesse: leadData.servico_interesse,
          anotacoes: leadData.anotacoes,
          etapa_kanban_id: leadData.etapa_kanban_id || selectedLead.etapa_kanban_id,
          clinica_id: selectedLead.clinica_id
        };
        
        await updateLeadMutation.mutateAsync(updateData);
        toast.success('Lead atualizado com sucesso!');
      } else {
        // Caso contrário, é um novo lead
        console.log('[useKanbanLeadActions] Criando novo lead - funcionalidade a ser implementada');
        toast.error('Criação de novo lead ainda não implementada');
      }
      
      closeLeadModal();
    } catch (error) {
      console.error('[useKanbanLeadActions] Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead. Tente novamente.');
    }
  };
  
  // Função para deletar lead
  const handleDeleteLead = async (leadId: string) => {
    try {
      console.log('[useKanbanLeadActions] Deletando lead:', leadId);
      await deleteLeadMutation.mutateAsync(leadId);
      toast.success('Lead excluído com sucesso!');
      closeLeadModal();
    } catch (error) {
      console.error('[useKanbanLeadActions] Erro ao deletar lead:', error);
      toast.error('Erro ao excluir lead. Tente novamente.');
    }
  };
  
  // Função para abrir chat com o lead
  const handleOpenChat = (lead: Lead) => {
    console.log('[useKanbanLeadActions] Abrindo chat para lead:', lead.id);
    // Implementar navegação para chat
    window.open(`/chat?lead=${lead.id}`, '_blank');
  };
  
  // Função para abrir histórico de consultas
  const handleOpenHistory = (lead: Lead) => {
    console.log('[useKanbanLeadActions] Abrindo histórico para lead:', lead.id);
    // Implementar modal de histórico
    toast.info('Histórico de consultas - funcionalidade em desenvolvimento');
  };
  
  // Função para mover lead entre colunas via drag and drop
  const handleDropLeadInColumn = async (leadId: string, targetEtapaId: string) => {
    try {
      console.log('[useKanbanLeadActions] Movendo lead', leadId, 'para etapa', targetEtapaId);
      
      // Buscar dados do lead atual para preservar outras informações
      const leadToUpdate = selectedLead || { id: leadId };
      
      const updateData = {
        id: leadId,
        etapa_kanban_id: targetEtapaId,
        // Preservar outros campos se disponíveis
        ...(selectedLead && {
          nome: selectedLead.nome,
          telefone: selectedLead.telefone,
          email: selectedLead.email,
          ltv: selectedLead.ltv,
          origem_lead: selectedLead.origem_lead,
          servico_interesse: selectedLead.servico_interesse,
          anotacoes: selectedLead.anotacoes,
          clinica_id: selectedLead.clinica_id
        })
      };
      
      await updateLeadMutation.mutateAsync(updateData);
      toast.success('Lead movido com sucesso!');
    } catch (error) {
      console.error('[useKanbanLeadActions] Erro ao mover lead:', error);
      toast.error('Erro ao mover lead. Tente novamente.');
    }
  };
  
  return {
    // Estados dos modais
    isLeadModalOpen,
    selectedLead,
    newLeadEtapaId,
    
    // Ações dos modais
    openNewLeadModal,
    openEditLeadModal,
    closeLeadModal,
    
    // Ações do lead
    handleSaveLead,
    handleDeleteLead,
    handleOpenChat,
    handleOpenHistory,
    handleDropLeadInColumn,
    
    // Estados de loading
    isSaving: updateLeadMutation.isPending,
    isDeleting: deleteLeadMutation.isPending
  };
};
