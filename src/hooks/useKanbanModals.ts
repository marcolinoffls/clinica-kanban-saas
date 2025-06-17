
import { useState } from 'react';
import { Lead } from '@/hooks/useLeadsData';
import { Lead } from '@/hooks/useLeadsData';

interface IKanbanColumn {
  id: string;
  nome: string;
  title?: string;
  cor?: string;
  ordem?: number;
}
/**
 * Hook para gerenciar o estado de todos os modais do Kanban
 * 
 * Centraliza o controle de abertura/fechamento dos modais:
 * - Modal de criação/edição de leads
 * - Modal de histórico de consultas
 * - Modal de criação/edição de etapas
 * - Modal de movimentação de leads antes de deletar etapa
 */
export const useKanbanModals = () => {
  // Estados para modais e seleção
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<IKanbanColumn | null>(null);
  const [consultasLead, setConsultasLead] = useState<any[]>([]);
  const [etapaToDelete, setEtapaToDelete] = useState<(IKanbanColumn & { leadsCount?: number }) | null>(null);
  const [isMoveLeadsModalOpen, setIsMoveLeadsModalOpen] = useState(false);

  // Funções para controlar modais de lead
  const openCreateLeadModal = () => {
    console.log('🆕 Abrindo modal para criar novo lead');
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };

  const openEditLeadModal = (lead: Lead) => {
    console.log('✏️ Abrindo modal para editar lead:', lead.nome);
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
  };

  // Funções para controlar modal de histórico
  const openHistoryModal = (lead: Lead, consultas: any[]) => {
    setConsultasLead(consultas);
    setSelectedLead(lead);
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  // Funções para controlar modais de etapa
  const openCreateEtapaModal = () => {
    setEditingEtapa(null);
    setIsEtapaModalOpen(true);
  };

  const openEditEtapaModal = (etapa: IKanbanColumn) => {
    setEditingEtapa(etapa);
    setIsEtapaModalOpen(true);
  };

  const closeEtapaModal = () => {
    setIsEtapaModalOpen(false);
    setEditingEtapa(null);
  };

  // Funções para controlar modal de movimentação de leads
  const openMoveLeadsModal = (etapa: IKanbanColumn, leadsCount: number) => {
    setEtapaToDelete({ ...etapa, leadsCount });
    setIsMoveLeadsModalOpen(true);
  };

  const closeMoveLeadsModal = () => {
    setIsMoveLeadsModalOpen(false);
    setEtapaToDelete(null);
  };

  return {
    // Estados
    selectedLead,
    isLeadModalOpen,
    isHistoryModalOpen,
    isEtapaModalOpen,
    editingEtapa,
    consultasLead,
    etapaToDelete,
    isMoveLeadsModalOpen,

    // Funções para leads
    openCreateLeadModal,
    openEditLeadModal,
    closeLeadModal,

    // Funções para histórico
    openHistoryModal,
    closeHistoryModal,

    // Funções para etapas
    openCreateEtapaModal,
    openEditEtapaModal,
    closeEtapaModal,

    // Funções para movimentação
    openMoveLeadsModal,
    closeMoveLeadsModal,
  };
};
