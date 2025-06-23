import { useMemo } from 'react'; // Importar o useMemo
import { useClinica } from '@/contexts/ClinicaContext';
import { useAIReportsData } from './useAIReportsData';
import { useCreateAIReport } from './useCreateAIReport';
import { useCancelAIReport } from './useCancelAIReport';
import { useAIReportModal } from './useAIReportModal';
import { useAdminCheck } from './useAdminCheck';
import type { CreateReportData } from '@/types/aiReports';

/**
 * Hook principal para gerenciar relatórios de análise de IA
 *
 * O que faz:
 * - Orquestra todos os hooks relacionados a relatórios
 * - Fornece uma interface unificada para componentes
 * - Combina funcionalidades de modal, dados, criação e cancelamento
 * - Suporte a modo administrador com clinicaId específica
 * - Identifica automaticamente se é admin e passa essa informação
 *
 * Onde é usado:
 * - No DashboardPage para permitir a criação de relatórios
 * - No componente AIReportModal para gerenciar o estado
 *
 * Como se conecta:
 * - Usa o contexto ClinicaContext para obter o ID da clínica (modo normal)
 * - Conecta-se à tabela ai_reports no Supabase
 * - Chama as Edge Functions generate-ai-report e reset-ai-report-status
 */
export const useAIReport = (adminTargetClinicaId?: string) => {
  const { clinicaId: contextClinicaId } = useClinica();
  const { isAdmin } = useAdminCheck();

  // Em modo admin, usar clinicaId fornecida; caso contrário, usar do contexto
  const effectiveClinicaId = adminTargetClinicaId || contextClinicaId;
  const isAdminMode = isAdmin && !!adminTargetClinicaId;

  // Buscar dados dos relatórios - agora com clinicaId específica
  const {
    reports,
    pendingReports,
    completedReports,
    failedReports,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useAIReportsData(effectiveClinicaId);

  // Controlar modal
  const {
    isModalOpen,
    selectedPeriod,
    openModal,
    closeModal,
    updatePeriod,
  } = useAIReportModal();

  // Criar relatórios - agora com clinicaId específica e informação de admin
  const { createReport, isCreating } = useCreateAIReport(
    refetchReports,
    effectiveClinicaId,
    isAdminMode,
  );

  // Cancelar relatórios - agora com clinicaId específica
  const { cancelReport, isCancelling } = useCancelAIReport(
    refetchReports,
    effectiveClinicaId,
  );

  // **INÍCIO DA CORREÇÃO**
  // Encontrar o relatório em processamento atual de forma segura.
  // Usamos useMemo para evitar que este cálculo seja refeito em toda renderização
  // e para garantir que `pendingReports` não seja `undefined` antes de usar `.find()`.
  const currentProcessingReport = useMemo(() => {
    // Se `pendingReports` ainda não foi carregado ou está vazio, retorna undefined.
    // Isso evita o erro "Cannot read properties of undefined (reading 'find')".
    if (!pendingReports) {
      return undefined;
    }
    // Agora que temos certeza que `pendingReports` é um array, podemos usar `.find()`.
    return pendingReports.find(
      (report) =>
        report.status === 'pending' || report.status === 'processing',
    );
  }, [pendingReports]); // A dependência garante que o cálculo só roda quando pendingReports muda.
  // **FIM DA CORREÇÃO**

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
    clinicaId: effectiveClinicaId,
    isAdminMode,
  };
};