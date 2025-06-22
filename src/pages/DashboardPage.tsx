
import { FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AIReportModal } from '@/components/reports/AIReportModal';
import { useAIReport } from '@/hooks/useAIReport';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { AdminClinicSelector } from '@/components/admin/AdminClinicSelector';
import { useState } from 'react';

/**
 * Página do Dashboard
 * 
 * Exibe métricas e indicadores importantes da clínica.
 * Para administradores, permite selecionar qual clínica visualizar.
 * Para usuários normais, mostra apenas dados da própria clínica.
 * 
 * Funcionalidades:
 * - Botão para gerar relatórios de análise de IA
 * - Modal para configuração e criação de relatórios
 * - Seletor de clínica para administradores
 * - Possibilidade de cancelar relatórios em andamento
 */
const DashboardPage = () => {
  const { isAdmin, loading: adminCheckLoading } = useAdminCheck();
  const [clinicaSelecionada, setClinicaSelecionada] = useState<any | null>(null);

  // Hook do relatório IA - agora pode receber clinicaId específica para admin
  const targetClinicaId = isAdmin ? clinicaSelecionada?.id : undefined;
  
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
  } = useAIReport(targetClinicaId);

  // Mostrar loading enquanto verifica privilégios admin
  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de clínica para administradores */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-sm font-medium text-blue-900">Modo Administrador</span>
          </div>
          <AdminClinicSelector
            clinicaSelecionada={clinicaSelecionada}
            onClinicaSelected={setClinicaSelecionada}
            showStats={true}
          />
        </div>
      )}

      {/* Header da página com botão de relatório */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
            {isAdmin && clinicaSelecionada && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                - {clinicaSelecionada.nome}
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin && !clinicaSelecionada 
              ? 'Selecione uma clínica para visualizar suas métricas'
              : 'Acompanhe as métricas e performance da sua clínica'
            }
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
          
          {/* Botão para gerar novo relatório - só mostra se não é admin ou se tem clínica selecionada */}
          {(!isAdmin || clinicaSelecionada) && (
            <Button
              onClick={openModal}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isCreatingReport || isCancellingReport}
            >
              <FileBarChart className="w-4 h-4 mr-2" />
              Gerar Relatório IA
            </Button>
          )}
        </div>
      </div>

      {/* Componente Dashboard */}
      {(!isAdmin || clinicaSelecionada) ? (
        <Dashboard 
          adminMode={isAdmin} 
          targetClinicaId={isAdmin ? clinicaSelecionada?.id : undefined}
        />
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <FileBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma Clínica</h3>
            <p className="text-gray-600">
              Escolha uma clínica no seletor acima para visualizar seu dashboard
            </p>
          </div>
        </div>
      )}

      {/* Modal para criação de relatório */}
      <AIReportModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onCreateReport={createReport}
        onCancelReport={cancelReport}
        isCreating={isCreatingReport}
        isCancelling={isCancellingReport}
        currentProcessingReport={currentProcessingReport}
        adminMode={isAdmin}
        selectedClinica={clinicaSelecionada}
      />
    </div>
  );
};

export default DashboardPage;
