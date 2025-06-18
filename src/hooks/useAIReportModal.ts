
import { useState } from 'react';
import type { PeriodSelection } from '@/types/aiReports';

/**
 * Hook para controlar o modal de relatórios de IA
 * 
 * O que faz:
 * - Gerencia a visibilidade do modal (abrir/fechar)
 * - Controla o período selecionado pelo usuário
 * - Fornece funções para atualizar o estado do modal
 * 
 * Onde é usado:
 * - No hook principal useAIReport
 * - Componentes que precisam controlar o modal
 */
export const useAIReportModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>({
    start: null,
    end: null,
    filterName: 'Últimos 30 dias'
  });

  // Funções para controlar o modal
  const openModal = () => {
    console.log('📊 Abrindo modal de relatório');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Função para atualizar o período selecionado
  const updatePeriod = (start: Date | null, end: Date | null, filterName: string) => {
    setSelectedPeriod({ start, end, filterName });
  };

  return {
    isModalOpen,
    selectedPeriod,
    openModal,
    closeModal,
    updatePeriod
  };
};
