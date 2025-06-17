
import React from 'react';
import { Plus } from 'lucide-react';
import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { ConsultasHistoryModal } from './ConsultasHistoryModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useKanbanModals } from '@/hooks/useKanbanModals';
import { useKanbanLeadActions } from '@/hooks/useKanbanLeadActions';
import { useKanbanEtapaActions } from '@/hooks/useKanbanEtapaActions';
import { useKanbanColumnDrag } from '@/hooks/useKanbanColumnDrag';
import { Etapa } from '@/hooks/useEtapasData';
import { Lead } from '@/hooks/useLeadsData';

/**
 * Componente principal do Kanban para gerenciamento de leads
 * 
 * Este componente foi refatorado para ser mais modular, delegando
 * responsabilidades específicas para hooks especializados:
 * - useKanbanModals: controle de modais
 * - useKanbanLeadActions: ações de leads
 * - useKanbanEtapaActions: ações de etapas
 * - useKanbanColumnDrag: drag and drop de colunas
 */

// Exporta o tipo Lead para compatibilidade
export type { Lead };

export interface IKanbanColumn extends Etapa {
  title: string;
  leadIds: string[];
}

interface KanbanBoardProps {
  onNavigateToChat?: (leadId: string) => void;
}

const ETAPA_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'
];

export const KanbanBoard = ({ onNavigateToChat }: KanbanBoardProps) => {
  // Hooks personalizados para diferentes responsabilidades
  const modalControls = useKanbanModals();
  const leadActions = useKanbanLeadActions();
  const etapaActions = useKanbanEtapaActions();
  const columnDrag = useKanbanColumnDrag();

  // Dados principais
  const { etapas = [], leads = [], tags = [], loading } = useSupabaseData();

  // Função para salvar lead (wrapper para integrar com modal)
  const handleSaveLead = async (leadData: any) => {
    await leadActions.handleSaveLead(leadData);
    modalControls.closeLeadModal();
  };

  // Função para abrir histórico
  const handleOpenHistory = async (lead: Lead) => {
    const consultas = await leadActions.handleOpenHistory(lead);
    if (consultas) {
      modalControls.openHistoryModal(lead, consultas);
    }
  };

  // Função para salvar etapa (wrapper para integrar com modal)
  const handleSaveEtapa = async (nome: string) => {
    await etapaActions.handleSaveEtapa(nome, modalControls.editingEtapa, etapas);
    modalControls.closeEtapaModal();
  };

  // Função para excluir etapa
  const handleDeleteEtapa = async (etapaParaDeletar: IKanbanColumn) => {
    const result = await etapaActions.handleDeleteEtapa(etapaParaDeletar, leads);
    
    if (result?.needsMoveLeads && result.etapaToDelete) {
      modalControls.openMoveLeadsModal(result.etapaToDelete, result.etapaToDelete.leadsCount || 0);
    }
  };

  // Função para mover leads e deletar etapa
  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string) => {
    if (!modalControls.etapaToDelete?.id) return;
    
    await etapaActions.handleMoveLeadsAndDeleteEtapa(
      targetEtapaId, 
      modalControls.etapaToDelete, 
      leads
    );
    modalControls.closeMoveLeadsModal();
  };
  
  // Função para converter Etapa em IKanbanColumn
  const convertEtapaToKanbanColumn = (etapa: Etapa): IKanbanColumn => {
    const currentLeads = Array.isArray(leads) ? leads : [];
    const leadsDaEtapa = currentLeads.filter(lead => lead.etapa_kanban_id === etapa.id);
    return {
      ...etapa,
      title: etapa.nome,
      leadIds: leadsDaEtapa.map(lead => lead.id),
    };
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header com título e botões de ação */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Leads</h2>
          <p className="text-gray-600 mt-1">Acompanhe o progresso dos seus leads no funil de vendas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={modalControls.openCreateEtapaModal}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus size={18} /> Nova Etapa
          </button>
          <button
            onClick={modalControls.openCreateLeadModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Container das colunas do Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-200px)] items-start">
        {Array.isArray(etapas) && etapas
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
          .map((etapa: Etapa, index) => {
            const kanbanColumn = convertEtapaToKanbanColumn(etapa);
            const leadsDaEtapa = Array.isArray(leads)
              ? leads.filter(lead => lead.etapa_kanban_id === etapa.id)
              : [];
            const corDaEtapa = ETAPA_COLORS[index % ETAPA_COLORS.length];

            return (
              <div
                key={etapa.id}
                draggable
                onDragStart={(e) => columnDrag.handleColumnDragStart(e, etapa.id)}
                onDragEnd={columnDrag.handleColumnDragEnd}
                onDragOver={(e) => columnDrag.handleColumnDragOver(e, etapa.id)}
                onDragLeave={columnDrag.handleColumnDragLeave}
                onDrop={(e) => columnDrag.handleColumnDrop(e, etapa.id, etapas)}
                className={`h-full flex flex-col transition-all duration-200 cursor-grab 
                            ${columnDrag.draggedColumnId === etapa.id ? 'opacity-40 scale-95' : ''}
                            ${columnDrag.columnDragOverTargetId === etapa.id && columnDrag.draggedColumnId !== etapa.id ? 'outline-2 outline-blue-500 outline-dashed rounded-xl' : ''} 
                          `}
                data-etapa-draggable-id={etapa.id}
              >
                <KanbanColumnComponent
                  column={kanbanColumn}
                  leads={leadsDaEtapa}
                  corEtapa={corDaEtapa}
                  onEditLead={modalControls.openEditLeadModal}
                  onDropLeadInColumn={leadActions.handleDropLeadInColumn}
                  onOpenHistory={handleOpenHistory}
                  onOpenChat={leadActions.handleOpenChat}
                  onEditEtapa={() => modalControls.openEditEtapaModal(kanbanColumn)}
                  onDeleteEtapa={() => handleDeleteEtapa(kanbanColumn)}
                  isColumnDragOverTarget={columnDrag.columnDragOverTargetId === etapa.id && columnDrag.draggedColumnId !== etapa.id && !!columnDrag.draggedColumnId}
                />
              </div>
            );
        })}
        
        {/* Estado vazio quando não há etapas */}
        {(!Array.isArray(etapas) || etapas.length === 0) && (
          <div className="w-full flex items-center justify-center py-20">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma etapa criada</h3>
              <p className="text-gray-600 mb-4">Crie sua primeira etapa para começar a organizar seus leads.</p>
              <button
                onClick={modalControls.openCreateEtapaModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Primeira Etapa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <LeadModal
        isOpen={modalControls.isLeadModalOpen}
        onClose={modalControls.closeLeadModal}
        lead={modalControls.selectedLead}
        etapas={Array.isArray(etapas) ? etapas : []}
        onSave={handleSaveLead}
        onOpenHistory={modalControls.selectedLead ? () => handleOpenHistory(modalControls.selectedLead!) : undefined}
      />
      
      <ConsultasHistoryModal
        isOpen={modalControls.isHistoryModalOpen}
        onClose={modalControls.closeHistoryModal}
        lead={modalControls.selectedLead}
        consultas={modalControls.consultasLead}
      />
      
      <EtapaModal
        isOpen={modalControls.isEtapaModalOpen}
        onClose={modalControls.closeEtapaModal}
        onSave={handleSaveEtapa}
        etapa={modalControls.editingEtapa}
        etapasExistentes={Array.isArray(etapas) ? etapas : []}
      />
      
      <MoveLeadsModal
        isOpen={modalControls.isMoveLeadsModalOpen}
        onClose={modalControls.closeMoveLeadsModal}
        onConfirm={handleMoveLeadsAndDeleteEtapa}
        etapaToDelete={modalControls.etapaToDelete}
        leadsCount={modalControls.etapaToDelete?.leadsCount || 0}
        etapasDisponiveis={Array.isArray(etapas) ? etapas.filter(e => e.id !== modalControls.etapaToDelete?.id) : []}
      />
    </div>
  );
};
