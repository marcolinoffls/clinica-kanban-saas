
import { useClinica } from '@/contexts/ClinicaContext';
import { useAIReportsData } from './useAIReportsData';
import { useCreateAIReport } from './useCreateAIReport';
import { useAIReportModal } from './useAIReportModal';
import type { CreateReportData } from '@/types/aiReports';

/**
 * Hook principal para gerenciar relatórios de análise de IA
 * 
 * O que faz:
 * - Orquestra todos os hooks relacionados a relatórios
 * - Fornece uma interface unificada para componentes
 * - Combina funcionalidades de modal, dados e criação
 * 
 * Onde é usado:
 * - No DashboardPage para permitir a criação de relatórios
 * - No componente AIReportModal para gerenciar o estado
 * 
 * Como se conecta:
 * - Usa o contexto ClinicaContext para obter o ID da clínica
 * - Conecta-se à tabela ai_reports no Supabase
 * - Chama a Edge Function generate-ai-report
 */
export const useAIReport = () => {
  const { clinicaId } = useClinica();
  
  // Buscar dados dos relatórios
  const {
    reports,
    pendingReports,
    completedReports,
    failedReports,
    isLoading: isLoadingReports,
    refetch: refetchReports
  } = useAIReportsData();

  // Controlar modal
  const {
    isModalOpen,
    selectedPeriod,
    openModal,
    closeModal,
    updatePeriod
  } = useAIReportModal();

  // Criar relatórios
  const { createReport, isCreating } = useCreateAIReport(refetchReports);

  return {
    // Estados do modal
    isModalOpen,
    openModal,
    closeModal,

    // Estados do período
    selectedPeriod,
    updatePeriod,

    // Estados dos relatórios
    reports,
    pendingReports,
    completedReports,
    failedReports,
    isLoadingReports,

    // Ações
    createReport: (reportData: CreateReportData) => createReport(reportData),
    isCreatingReport: isCreating,
    refetchReports,

    // Dados da clínica
    clinicaId
  };
};
