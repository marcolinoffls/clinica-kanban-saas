import React from 'react';
import { Plus } from 'lucide-react';
import { PipelineColumn } from './PipelineColumn';
import { PipelineLeadModal } from './PipelineLeadModal';
import { PipelineEtapaModal } from './PipelineEtapaModal';
import { PipelineConsultasHistoryModal } from './PipelineConsultasHistoryModal';
import { PipelineMoveLeadsModal } from './PipelineMoveLeadsModal';
import { useLeads } from '@/hooks/useLeadsData';
import { useEtapas } from '@/hooks/useEtapasData';
import { usePipelineModals } from '@/hooks/usePipelineModals';
import { usePipelineLeadActions } from '@/hooks/usePipelineLeadActions';
import { usePipelineEtapaActions } from '@/hooks/usePipelineEtapaActions';
import { usePipelineColumnDrag } from '@/hooks/usePipelineColumnDrag';
import { LeadPipeline, EtapaPipeline } from './types';

/**
 * Componente principal do Pipeline de Vendas
 * 
 * Interface independente para gerenciar leads em formato kanban,
 * com foco no funil de vendas. Inclui funcionalidades completas
 * de CRUD para leads e etapas, além de drag and drop.
 */

interface PipelineBoardProps {
  onNavigateToChat?: (leadId: string) => void;
}

// Cores para as etapas (ciclo de 8 cores)
const ETAPA_COLORS = [
  'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'
];

export const PipelineBoard = ({ onNavigateToChat }: PipelineBoardProps) => {
  // Hooks para gerenciar estado dos modais
  const modalControls = usePipelineModals();
  
  // Hooks para ações de leads e etapas
  const leadActions = usePipelineLeadActions(onNavigateToChat);
  const etapaActions = usePipelineEtapaActions();
  const columnDrag = usePipelineColumnDrag();

  // Buscar dados principais
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: etapas = [], isLoading: etapasLoading } = useEtapas();

  const loading = leadsLoading || etapasLoading;

  // Converter dados para tipos do Pipeline
  const leadsTyped: LeadPipeline[] = Array.isArray(leads) ? leads.map(lead => ({
    id: lead.id,
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email,
    anotacoes: lead.anotacoes,
    etapa_kanban_id: lead.etapa_kanban_id,
    tag_id: lead.tag_id,
    data_ultimo_contato: lead.data_ultimo_contato,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    clinica_id: lead.clinica_id,
    origem_lead: lead.origem_lead,
    servico_interesse: lead.servico_interesse,
  })) : [];

  const etapasTyped: EtapaPipeline[] = Array.isArray(etapas) ? etapas.map(etapa => ({
    id: etapa.id,
    nome: etapa.nome,
    ordem: etapa.ordem,
    clinica_id: etapa.clinica_id,
    created_at: etapa.created_at,
  })) : [];

  // Função para salvar lead
  const handleSaveLead = async (leadData: any) => {
    await leadActions.handleSaveLead(leadData, modalControls.selectedLead);
    modalControls.closeLeadModal();
  };

  // Função para abrir histórico
  const handleOpenHistory = async (lead: LeadPipeline) => {
    const consultas = await leadActions.handleOpenHistory(lead);
    modalControls.openHistoryModal(lead, consultas);
  };

  // Função para salvar etapa
  const handleSaveEtapa = async (nome: string) => {
    await etapaActions.handleSaveEtapa(nome, modalControls.editingEtapa, etapasTyped);
    modalControls.closeEtapaModal();
  };

  // Função para excluir etapa
  const handleDeleteEtapa = async (etapa: EtapaPipeline) => {
    const result = await etapaActions.handleDeleteEtapa(etapa, leadsTyped);
    
    if (result?.needsMoveLeads && result.etapaToDelete) {
      modalControls.openMoveLeadsModal(result.etapaToDelete);
    }
  };

  // Função para mover leads e deletar etapa
  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string) => {
    if (!modalControls.etapaToDelete) return;
    
    await etapaActions.handleMoveLeadsAndDeleteEtapa(
      targetEtapaId, 
      modalControls.etapaToDelete, 
      leadsTyped
    );
    modalControls.closeMoveLeadsModal();
  };

  // Função para criar lead em etapa específica
  const handleCreateLeadInEtapa = (etapaId: string) => {
    modalControls.openCreateLeadModal();
    // Aqui você pode setar a etapa padrão se necessário
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando Pipeline de Vendas...</p>
        </div>
      </div>
    );
  }

  // Declarar variáveis globais para drag (apenas para TypeScript)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__DRAGGED_LEAD__ = null;
      window.__DRAGGED_COLUMN__ = null;
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header do Pipeline */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4 px-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-gray-600 mt-2">
            Gerencie seus leads através do funil de vendas. Arraste os cards para mover leads entre etapas.
          </p>
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
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Container das colunas do Pipeline com Drag and Drop */}
      <div className="flex-1 px-6 pb-6">
        <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-250px)] items-start">
          {etapasTyped
            .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
            .map((etapa, index) => {
              const leadsDaEtapa = leadsTyped.filter(lead => lead.etapa_kanban_id === etapa.id);
              const corDaEtapa = ETAPA_COLORS[index % ETAPA_COLORS.length];
              const isDraggedColumn = columnDrag.draggedColumnId === etapa.id;

              return (
                <div
                  key={etapa.id}
                  draggable
                  onDragStart={(e) => columnDrag.handleColumnDragStart(e, etapa.id)}
                  onDragEnd={columnDrag.handleColumnDragEnd}
                  onDragOver={(e) => columnDrag.handleColumnDragOver(e, etapa.id)}
                  onDragLeave={columnDrag.handleColumnDragLeave}
                  onDrop={(e) => columnDrag.handleColumnDrop(e, etapa.id, etapasTyped)}
                  className={`h-full flex flex-col transition-all duration-200 
                              ${columnDrag.columnDragOverTargetId === etapa.id && columnDrag.draggedColumnId !== etapa.id ? 'outline-2 outline-purple-500 outline-dashed rounded-xl' : ''} 
                            `}
                  data-etapa-draggable-id={etapa.id}
                >
                  <PipelineColumn
                    etapa={etapa}
                    leads={leadsDaEtapa}
                    corEtapa={corDaEtapa}
                    onEditLead={modalControls.openEditLeadModal}
                    onDropLeadInColumn={leadActions.handleDropLeadInColumn}
                    onOpenHistory={handleOpenHistory}
                    onOpenChat={leadActions.handleOpenChat}
                    onEditEtapa={() => modalControls.openEditEtapaModal(etapa)}
                    onDeleteEtapa={() => handleDeleteEtapa(etapa)}
                    onCreateLead={handleCreateLeadInEtapa}
                    isDraggedColumn={isDraggedColumn}
                  />
                </div>
              );
          })}
          
          {/* Estado vazio quando não há etapas */}
          {etapasTyped.length === 0 && (
            <div className="w-full flex items-center justify-center py-20">
              <div className="text-center">
                <div className="p-6 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Plus size={40} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Bem-vindo ao Pipeline de Vendas!
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Comece criando sua primeira etapa para organizar seu funil de vendas. 
                  Você pode criar etapas como "Novo Lead", "Em Contato", "Proposta Enviada", etc.
                </p>
                <button
                  onClick={modalControls.openCreateEtapaModal}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Criar Primeira Etapa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modais do Pipeline */}
      <PipelineLeadModal
        isOpen={modalControls.isLeadModalOpen}
        onClose={modalControls.closeLeadModal}
        lead={modalControls.selectedLead}
        etapas={etapasTyped}
        onSave={handleSaveLead}
        onOpenHistory={modalControls.selectedLead ? () => handleOpenHistory(modalControls.selectedLead!) : undefined}
      />
      
      <PipelineEtapaModal
        isOpen={modalControls.isEtapaModalOpen}
        onClose={modalControls.closeEtapaModal}
        onSave={handleSaveEtapa}
        etapa={modalControls.editingEtapa}
        etapasExistentes={etapasTyped}
      />
      
      <PipelineConsultasHistoryModal
        isOpen={modalControls.isHistoryModalOpen}
        onClose={modalControls.closeHistoryModal}
        lead={modalControls.selectedLead}
        consultas={modalControls.consultasLead}
      />
      
      <PipelineMoveLeadsModal
        isOpen={modalControls.isMoveLeadsModalOpen}
        onClose={modalControls.closeMoveLeadsModal}
        onConfirm={handleMoveLeadsAndDeleteEtapa}
        etapaToDelete={modalControls.etapaToDelete}
        leadsCount={modalControls.etapaToDelete ? leadsTyped.filter(l => l.etapa_kanban_id === modalControls.etapaToDelete?.id).length : 0}
        etapasDisponiveis={etapasTyped.filter(e => e.id !== modalControls.etapaToDelete?.id)}
      />
    </div>
  );
};
