
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { AdminClinicSelector } from '@/components/admin/AdminClinicSelector';
import { Workflow } from 'lucide-react';

/**
 * Página do Pipeline de Vendas (Funil de Vendas)
 *
 * Esta página oferece uma visão em formato Kanban para gerenciar
 * leads através do funil de vendas. Para administradores, permite
 * selecionar qual clínica visualizar.
 * 
 * Funcionalidades:
 * - Visualização em colunas (etapas) do funil
 * - Drag and drop de leads entre etapas
 * - CRUD completo de leads e etapas
 * - Integração com chat para cada lead
 * - Seletor de clínica para administradores
 */
const PipelinePage = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminCheckLoading } = useAdminCheck();
  const [clinicaSelecionada, setClinicaSelecionada] = useState<any | null>(null);

  // Função para navegar para o chat com um lead específico
  const handleNavigateToChat = React.useCallback((leadId: string) => {
    if (leadId && typeof leadId === 'string') {
      const params = new URLSearchParams();
      params.set('leadId', leadId);
      
      // Se admin e tem clínica selecionada, manter na URL
      if (isAdmin && clinicaSelecionada?.id) {
        params.set('adminClinicId', clinicaSelecionada.id);
      }
      
      navigate(`/chat?${params.toString()}`);
    }
  }, [navigate, isAdmin, clinicaSelecionada]);

  // Mostrar loading enquanto verifica privilégios admin
  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 space-y-6">
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

      {/* Header da página */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3">
          <Workflow className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pipeline de Vendas
              {isAdmin && clinicaSelecionada && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  - {clinicaSelecionada.nome}
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {isAdmin && !clinicaSelecionada 
                ? 'Selecione uma clínica para visualizar seu funil de vendas'
                : 'Gerencie seus leads através do funil de vendas'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Componente PipelineBoard */}
      {(!isAdmin || clinicaSelecionada) ? (
        <PipelineBoard 
          onNavigateToChat={handleNavigateToChat}
          adminMode={isAdmin}
          targetClinicaId={isAdmin ? clinicaSelecionada?.id : undefined}
        />
      ) : (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma Clínica</h3>
            <p className="text-gray-600">
              Escolha uma clínica no seletor acima para visualizar seu pipeline de vendas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelinePage;
