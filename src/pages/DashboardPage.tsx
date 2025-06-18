
import { FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AIReportModal } from '@/components/reports/AIReportModal';
import { useAIReport } from '@/hooks/useAIReport';

/**
 * Página do Dashboard
 * 
 * Exibe métricas e indicadores importantes da clínica.
 * Esta página encapsula o componente Dashboard existente
 * para permitir navegação via rotas distintas.
 * 
 * Funcionalidades:
 * - Botão para gerar relatórios de análise de IA
 * - Modal para configuração e criação de relatórios
 * - Possibilidade de cancelar relatórios em andamento
 */
const DashboardPage = () => {
  const {
    isModalOpen,
    openModal,
    closeModal,
    createReport,
    cancelReport,
    isCreatingReport,
    isCancellingReport,
    pendingReports,
    currentProcessingReport
  } = useAIReport();

  return (
    <div className="space-y-6">
      {/* Header da página com botão de relatório */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe as métricas e performance da sua clínica
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Indicador de relatórios em andamento */}
          {pendingReports.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
              <span>
                {pendingReports.length} relatório{pendingReports.length > 1 ? 's' : ''} processando
              </span>
            </div>
          )}
          
          {/* Botão para gerar novo relatório */}
          <Button
            onClick={openModal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isCreatingReport || isCancellingReport}
          >
            <FileBarChart className="w-4 h-4 mr-2" />
            Gerar Relatório IA
          </Button>
        </div>
      </div>

      {/* Componente Dashboard existente */}
      <Dashboard />

      {/* Modal para criação de relatório */}
      <AIReportModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onCreateReport={createReport}
        onCancelReport={cancelReport}
        isCreating={isCreatingReport}
        isCancelling={isCancellingReport}
        currentProcessingReport={currentProcessingReport}
      />
    </div>
  );
};

export default DashboardPage;
