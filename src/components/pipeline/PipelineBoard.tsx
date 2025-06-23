
/**
 * Componente do quadro Kanban do pipeline
 * 
 * CORREÇÃO: Ajustado para trabalhar com os dados corretos dos hooks
 * 
 * O que faz:
 * - Renderiza colunas do pipeline com leads
 * - Suporte a drag and drop
 * - Modais de lead e etapa
 * - Modo admin para visualizar pipeline de clínicas específicas
 */

import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PipelineColumn } from './PipelineColumn';
import { PipelineLeadModal } from './PipelineLeadModal';
import { PipelineEtapaModal } from './PipelineEtapaModal';
import { PipelineConsultasHistoryModal } from './PipelineConsultasHistoryModal';
import { PipelineMoveLeadsModal } from './PipelineMoveLeadsModal';
import { usePipelineModals } from '@/hooks/usePipelineModals';
import { usePipelineLeadActions } from '@/hooks/usePipelineLeadActions';
import { usePipelineEtapaActions } from '@/hooks/usePipelineEtapaActions';
import { usePipelineColumnDrag } from '@/hooks/usePipelineColumnDrag';
import { useEtapasKanban } from '@/hooks/useEtapasKanban';
import { useLeads } from '@/hooks/useSupabaseLeads';
import { useAdminPipelineData } from '@/hooks/useAdminPipelineData';
import type { LeadPipeline, EtapaPipeline } from './types';

interface PipelineBoardProps {
  adminMode?: boolean;
  targetClinicaId?: string;
}

export const PipelineBoard = ({ adminMode = false, targetClinicaId }: PipelineBoardProps) => {
  // Dados do pipeline - usar admin ou dados normais
  const normalPipelineData = {
    etapas: useEtapasKanban().data || [],
    leads: useLeads().data || [],
    clinicaId: undefined
  };
  
  const adminPipelineData = useAdminPipelineData(targetClinicaId);
  
  // CORREÇÃO: Usar dados corretos baseado no modo
  const pipelineData = adminMode && targetClinicaId ? adminPipelineData : normalPipelineData;
  
  // Verificar se os dados têm a estrutura correta
  const etapas = Array.isArray(pipelineData) ? []  // Se retornou array direto, usar vazio
                : pipelineData?.etapas || [];     // Se tem estrutura de objeto, usar etapas
  
  const leads = Array.isArray(pipelineData) ? []   // Se retornou array direto, usar vazio  
                : pipelineData?.leads || [];      // Se tem estrutura de objeto, usar leads

  // Hooks de modais
  const modals = usePipelineModals();

  // Hooks de ações
  const leadActions = usePipelineLeadActions();
  const etapaActions = usePipelineEtapaActions();
  const { handleDragEnd } = usePipelineColumnDrag({
    etapas,
    leads,
    onLeadMove: leadActions.handleDropLeadInColumn
  });

  // Handlers corrigidos
  const handleAddLead = () => {
    modals.openAddLeadModal();
  };

  const handleEditLead = (lead: LeadPipeline) => {
    modals.openEditLeadModal(lead);
  };

  const handleAddEtapa = () => {
    modals.openAddEtapaModal();
  };

  const handleEditEtapa = (etapa: EtapaPipeline) => {
    modals.openEditEtapaModal(etapa);
  };

  if (!etapas || etapas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Carregando pipeline...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline</h2>
          <p className="text-gray-600">Gerencie seus leads através do funil de vendas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddLead} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
          <Button 
            onClick={handleAddEtapa}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Etapa
          </Button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full overflow-x-auto pb-4">
            {etapas.map((etapa) => {
              const etapaLeads = leads.filter(lead => lead.etapa_kanban_id === etapa.id);
              
              return (
                <PipelineColumn
                  key={etapa.id}
                  etapa={etapa}
                  leads={etapaLeads}
                  onEditLead={handleEditLead}
                  onDeleteLead={leadActions.deleteLead}
                  onEditEtapa={() => handleEditEtapa(etapa)}
                  onDeleteEtapa={etapaActions.handleDeleteEtapa}
                  onMoveLeads={() => modals.openMoveLeadsModal(etapa)}
                  onNavigateToChat={leadActions.handleOpenChat}
                  onOpenHistory={leadActions.handleOpenHistory}
                  isAdminMode={adminMode}
                />
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Modais */}
      <PipelineLeadModal
        isOpen={modals.isLeadModalOpen}
        onClose={modals.closeLeadModal}
        lead={modals.selectedLead}
        etapas={etapas}
        onSave={(leadData) => leadActions.handleSaveLead(leadData, modals.selectedLead)}
        loading={leadActions.isSavingLead}
      />

      <PipelineEtapaModal
        isOpen={modals.isEtapaModalOpen}
        onClose={modals.closeEtapaModal}
        etapa={modals.editingEtapa}
        onSave={(nome) => etapaActions.handleSaveEtapa(nome, modals.editingEtapa, etapas)}
        loading={etapaActions.isSavingEtapa}
      />

      <PipelineConsultasHistoryModal
        isOpen={modals.isHistoryModalOpen}
        onClose={modals.closeHistoryModal}
        lead={modals.selectedLead}
        consultas={modals.consultasLead}
      />

      <PipelineMoveLeadsModal
        isOpen={modals.isMoveLeadsModalOpen}
        onClose={modals.closeMoveLeadsModal}
        sourceEtapa={modals.moveLeadsSourceEtapa}
        targetEtapas={etapas.filter(etapa => etapa.id !== modals.moveLeadsSourceEtapa?.id)}
        leads={leads.filter(lead => lead.etapa_kanban_id === modals.moveLeadsSourceEtapa?.id)}
        onMoveLeads={etapaActions.handleMoveLeadsAndDeleteEtapa}
        loading={etapaActions.isDeletingEtapa}
      />
    </div>
  );
};
