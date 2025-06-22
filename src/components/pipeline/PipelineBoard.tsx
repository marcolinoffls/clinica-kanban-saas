
import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { PipelineColumn } from './PipelineColumn';
import { PipelineLeadModal } from './PipelineLeadModal';
import { PipelineEtapaModal } from './PipelineEtapaModal';
import { PipelineMoveLeadsModal } from './PipelineMoveLeadsModal';
import { PipelineConsultasHistoryModal } from './PipelineConsultasHistoryModal';
import { usePipelineModals } from '@/hooks/usePipelineModals';
import { usePipelineColumnDrag } from '@/hooks/usePipelineColumnDrag';
import { usePipelineEtapaActions } from '@/hooks/usePipelineEtapaActions';
import { usePipelineLeadActions } from '@/hooks/usePipelineLeadActions';
import { useEtapasKanban } from '@/hooks/useEtapasKanban';
import { useAdminPipelineData } from '@/hooks/useAdminPipelineData';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * Componente principal do Pipeline Board
 * 
 * O que faz:
 * - Renderiza o quadro Kanban com colunas de etapas
 * - Gerencia drag and drop de cards entre colunas
 * - Suporte a modo administrador para visualizar pipeline de qualquer clínica
 * - Conecta com hooks para buscar etapas e leads
 * 
 * Onde é usado:
 * - Na página principal do pipeline/kanban
 * - Em modo administrador para visualizar pipelines de clínicas específicas
 */

interface PipelineBoardProps {
  onNavigateToChat: (leadId: string) => void;
  adminMode?: boolean;
  targetClinicaId?: string;
}

export const PipelineBoard = ({ 
  onNavigateToChat, 
  adminMode = false, 
  targetClinicaId 
}: PipelineBoardProps) => {
  // Usar hook apropriado baseado no modo
  const normalData = useEtapasKanban();
  const adminData = useAdminPipelineData(targetClinicaId || null);
  
  const { data: pipelineData, isLoading, refetch } = adminMode ? adminData : normalData;
  
  const etapas = adminMode ? pipelineData?.etapas || [] : pipelineData || [];
  const leads = adminMode ? pipelineData?.leads || [] : [];

  const modals = usePipelineModals();
  const dragHook = usePipelineColumnDrag();
  const etapaActions = usePipelineEtapaActions();
  const leadActions = usePipelineLeadActions();

  const [selectedEtapaId, setSelectedEtapaId] = useState<string>('');

  // Função para lidar com o drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      // Implementar lógica de drag and drop se necessário
      console.log('Drag and drop:', { destination, source, draggableId });
    } catch (error) {
      console.error('Erro no drag and drop:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pipeline...</p>
        </div>
      </div>
    );
  }

  if (!etapas || etapas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {adminMode 
              ? 'Esta clínica ainda não possui etapas configuradas no pipeline.'
              : 'Nenhuma etapa encontrada no pipeline.'
            }
          </p>
          {!adminMode && (
            <Button
              onClick={() => modals.openEtapaModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Etapa
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 h-full">
          {etapas.map((etapa) => {
            // Filtrar leads para esta etapa
            const leadsEtapa = adminMode 
              ? leads.filter(lead => lead.etapa_kanban_id === etapa.id)
              : []; // Para modo normal, o hook já filtra os leads

            return (
              <PipelineColumn
                key={etapa.id}
                etapa={etapa}
                leads={leadsEtapa}
                onAddLead={() => {
                  setSelectedEtapaId(etapa.id);
                  modals.openLeadModal();
                }}
                onEditLead={(lead) => {
                  modals.openLeadModal(lead);
                }}
                onDeleteLead={leadActions.deleteLead}
                onEditEtapa={() => modals.openEtapaModal(etapa)}
                onDeleteEtapa={etapaActions.deleteEtapa}
                onMoveLeads={() => {
                  setSelectedEtapaId(etapa.id);
                  modals.openMoveLeadsModal();
                }}
                onNavigateToChat={onNavigateToChat}
                onOpenHistory={(lead) => modals.openHistoryModal(lead)}
                isAdminMode={adminMode}
              />
            );
          })}
          
          {/* Botão para adicionar nova etapa (apenas modo normal) */}
          {!adminMode && (
            <div className="min-w-80">
              <Button
                onClick={() => modals.openEtapaModal()}
                variant="outline"
                className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Etapa
              </Button>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Modais (apenas para modo normal) */}
      {!adminMode && (
        <>
          <PipelineLeadModal
            isOpen={modals.isLeadModalOpen}
            onClose={modals.closeLeadModal}
            lead={modals.selectedLead}
            etapas={etapas}
            selectedEtapaId={selectedEtapaId}
            onSave={leadActions.saveLead}
            onOpenHistory={() => modals.openHistoryModal(modals.selectedLead)}
          />

          <PipelineEtapaModal
            isOpen={modals.isEtapaModalOpen}
            onClose={modals.closeEtapaModal}
            etapa={modals.selectedEtapa}
            onSave={etapaActions.saveEtapa}
          />

          <PipelineMoveLeadsModal
            isOpen={modals.isMoveLeadsModalOpen}
            onClose={modals.closeMoveLeadsModal}
            sourceEtapaId={selectedEtapaId}
            etapas={etapas}
            onMoveLeads={leadActions.moveLeads}
          />

          <PipelineConsultasHistoryModal
            isOpen={modals.isHistoryModalOpen}
            onClose={modals.closeHistoryModal}
            lead={modals.selectedLead}
          />
        </>
      )}
    </div>
  );
};
