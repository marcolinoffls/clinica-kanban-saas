
import { useState } from 'react';
import { LeadPipeline, EtapaPipeline } from '@/components/pipeline/types';

/**
 * Hook para gerenciar o estado de todos os modais do Pipeline
 * 
 * Gerencia a abertura/fechamento e dados dos modais:
 * - Modal de lead (criar/editar)
 * - Modal de etapa (criar/editar)
 * - Modal de histórico de consultas
 * - Modal de mover leads (ao deletar etapa)
 */

export const usePipelineModals = () => {
  // Estado para modal de lead
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadPipeline | null>(null);

  // Estado para modal de etapa
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<EtapaPipeline | null>(null);

  // Estado para modal de histórico
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [consultasLead, setConsultasLead] = useState<any[]>([]);

  // Estado para modal de mover leads
  const [isMoveLeadsModalOpen, setIsMoveLeadsModalOpen] = useState(false);
  const [etapaToDelete, setEtapaToDelete] = useState<EtapaPipeline | null>(null);

  // Funções para modal de lead
  const openCreateLeadModal = () => {
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };

  const openEditLeadModal = (lead: LeadPipeline) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
  };

  // Funções para modal de etapa
  const openCreateEtapaModal = () => {
    setEditingEtapa(null);
    setIsEtapaModalOpen(true);
  };

  const openEditEtapaModal = (etapa: EtapaPipeline) => {
    setEditingEtapa(etapa);
    setIsEtapaModalOpen(true);
  };

  const closeEtapaModal = () => {
    setIsEtapaModalOpen(false);
    setEditingEtapa(null);
  };

  // Funções para modal de histórico
  const openHistoryModal = (lead: LeadPipeline, consultas: any[]) => {
    setSelectedLead(lead);
    setConsultasLead(consultas);
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedLead(null);
    setConsultasLead([]);
  };

  // Funções para modal de mover leads
  const openMoveLeadsModal = (etapa: EtapaPipeline) => {
    setEtapaToDelete(etapa);
    setIsMoveLeadsModalOpen(true);
  };

  const closeMoveLeadsModal = () => {
    setIsMoveLeadsModalOpen(false);
    setEtapaToDelete(null);
  };

  return {
    // Estados dos modais
    isLeadModalOpen,
    selectedLead,
    isEtapaModalOpen,
    editingEtapa,
    isHistoryModalOpen,
    consultasLead,
    isMoveLeadsModalOpen,
    etapaToDelete,

    // Funções de controle dos modais
    openCreateLeadModal,
    openEditLeadModal,
    closeLeadModal,
    openCreateEtapaModal,
    openEditEtapaModal,
    closeEtapaModal,
    openHistoryModal,
    closeHistoryModal,
    openMoveLeadsModal,
    closeMoveLeadsModal,
  };
};
