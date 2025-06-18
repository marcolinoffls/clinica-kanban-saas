
import { useClinica } from '@/contexts/ClinicaContext';
import { useAIReportsData } from './useAIReportsData';
import { useCreateAIReport } from './useCreateAIReport';
import { useCancelAIReport } from './useCancelAIReport';
import { useAIReportModal } from './useAIReportModal';
import type { CreateReportData } from '@/types/aiReports';

/**
 * Hook principal para gerenciar relatórios de análise de IA
 * 
 * O que faz:
 * - Orquestra todos os hooks relacionados a relatórios
 * - Fornece uma interface unificada para componentes
 * - Combina funcionalidades de modal, dados, criação e cancelamento
 * 
 * Onde é usado:
 * - No DashboardPage para permitir a criação de relatórios
 * - No componente AIReportModal para gerenciar o estado
 * 
 * Como se conecta:
 * - Usa o contexto ClinicaContext para obter o ID da clínica
 * - Conecta-se à tabela ai_reports no Supabase
 * - Chama as Edge Functions generate-ai-report e reset-ai-report-status
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

  // Cancelar relatórios
  const { cancelReport, isCancelling } = useCancelAIReport(refetchReports);

  // Encontrar o relatório em processamento atual
  const currentProcessingReport = pendingReports.find(report => 
    report.status === 'pending' || report.status === 'processing'
  );

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

    // Ações de criação
    createReport: (reportData: CreateReportData) => createReport(reportData),
    isCreatingReport: isCreating,

    // Ações de cancelamento
    cancelReport: (reportId: string) => cancelReport(reportId),
    isCancellingReport: isCancelling,
    currentProcessingReport,

    // Utilitários
    refetchReports,
    clinicaId
  };
};
