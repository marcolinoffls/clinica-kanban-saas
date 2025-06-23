// src/hooks/useAIReport.ts

import { useMemo } from 'react';
import { useClinica } from '@/contexts/ClinicaContext';
import { useAIReportsData } from './useAIReportsData';
import { useCreateAIReport } from './useCreateAIReport';
import { useCancelAIReport } from './useCancelAIReport';
import { useAIReportModal } from './useAIReportModal';
import { useAdminCheck } from './useAdminCheck';
import type { CreateReportData, AIReport } from '@/types/aiReports';

/**
 * Hook principal para gerenciar relatórios de análise de IA
 */
export const useAIReport = (adminTargetClinicaId?: string) => {
  const { clinicaId: contextClinicaId } = useClinica();
  const { isAdmin } = useAdminCheck();

  const effectiveClinicaId = adminTargetClinicaId || contextClinicaId;
  const isAdminMode = isAdmin && !!adminTargetClinicaId;

  // Chamada para o hook corrigido
  const {
    reports,
    pendingReports,
    completedReports,
    failedReports,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useAIReportsData(effectiveClinicaId, { adminMode: isAdminMode });

  const {
    isModalOpen,
    selectedPeriod,
    openModal,
    closeModal,
    updatePeriod,
  } = useAIReportModal();

  const { createReport, isCreating } = useCreateAIReport(
    refetchReports,
    effectiveClinicaId,
    isAdminMode,
  );

  const { cancelReport, isCancelling } = useCancelAIReport(
    refetchReports,
    effectiveClinicaId,
  );

  const currentProcessingReport = useMemo(() => {
    if (!pendingReports) return undefined;
    return pendingReports.find(
      (report) =>
        report.status === 'pending' || report.status === 'processing',
    );
  }, [pendingReports]);

  // **INÍCIO DA CORREÇÃO**
  // Encontrar o último relatório finalizado (com sucesso ou falha).
  // Usamos useMemo para garantir que `reports` não seja `undefined` ao usar `.find()`.
  const latestReport = useMemo(() => {
    // Se `reports` não existe ou está vazio, retorna null.
    // Isso evita o erro "Cannot read properties of undefined (reading 'find')".
    if (!reports || reports.length === 0) {
      return null;
    }
    // Agora o `.find()` é seguro.
    return reports.find(
      (report: AIReport) =>
        report.status === 'success' || report.status === 'failed',
    );
  }, [reports]);
  // **FIM DA CORREÇÃO**

  return {
    isModalOpen,
    openModal,
    closeModal,
    selectedPeriod,
    updatePeriod,
    reports,
    pendingReports,
    completedReports,
    failedReports,
    isLoadingReports,
    createReport: (reportData: CreateReportData) => createReport(reportData),
    isCreatingReport: isCreating,
    cancelReport: (reportId: string) => cancelReport(reportId),
    isCancellingReport: isCancelling,
    currentProcessingReport,
    latestReport, // Adicionar o novo valor ao retorno
    refetchReports,
    clinicaId: effectiveClinicaId,
    isAdminMode,
  };
};