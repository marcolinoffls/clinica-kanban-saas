
import React from 'react';
import { Plus } from 'lucide-react';
import { PipelineColumn } from './PipelineColumn';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useKanbanModals } from '@/hooks/useKanbanModals';
import { useKanbanLeadActions } from '@/hooks/useKanbanLeadActions';
import { useKanbanEtapaActions } from '@/hooks/useKanbanEtapaActions';
import { Etapa } from '@/hooks/useEtapasData';
import { Lead } from '@/hooks/useLeadsData';
import { IPipelineColumn } from './types';

/**
 * Componente principal do Pipeline de Vendas (Kanban)
 * 
 * Reutiliza a lógica e hooks do KanbanBoard existente,
 * mas com uma interface focada no funil de vendas.
 */

interface PipelineBoardProps {
  onNavigateToChat?: (leadId: string) => void;
}

const ETAPA_COLORS = [
  'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'
];

export const PipelineBoard = ({ onNavigateToChat }: PipelineBoardProps) => {
  // Reutiliza os hooks existentes do KanbanBoard
  const modalControls = useKanbanModals();
  const leadActions = useKanbanLeadActions(onNavigateToChat);
  const etapaActions = useKanbanEtapaActions();

  // Dados principais
  const { etapas = [], leads = [], loading } = useSupabaseData();

  // Função para converter Etapa em IPipelineColumn
  const convertEtapaToPipelineColumn = (etapa: Etapa): IPipelineColumn => {
    const currentLeads = Array.isArray(leads) ? leads : [];
    const leadsDaEtapa = currentLeads.filter(lead => lead.etapa_kanban_id === etapa.id);
    return {
      ...etapa,
      title: etapa.nome,
      leadIds: leadsDaEtapa.map(lead => lead.id),
      leadsCount: leadsDaEtapa.length,
    };
  };

  // Função para salvar lead
  const handleSaveLead = async (leadData: any) => {
    await leadActions.handleSaveLead(leadData, modalControls.selectedLead);
    modalControls.closeLeadModal();
  };

  // Função para abrir histórico
  const handleOpenHistory = async (lead: Lead) => {
    const consultas = await leadActions.handleOpenHistory(lead);
    modalControls.openHistoryModal(lead, consultas);
  };

  // Função para salvar etapa
  const handleSaveEtapa = async (nome: string) => {
    await etapaActions.handleSaveEtapa(nome, modalControls.editingEtapa, etapas);
    modalControls.closeEtapaModal();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando funil de vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header do Pipeline */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Funil de Vendas</h2>
          <p className="text-gray-600 mt-1">Acompanhe o progresso dos seus leads através do pipeline de vendas</p>
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
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Container das colunas do Pipeline */}
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-200px)] items-start">
        {Array.isArray(etapas) && etapas
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
          .map((etapa: Etapa, index) => {
            const pipelineColumn = convertEtapaToPipelineColumn(etapa);
            const leadsDaEtapa = Array.isArray(leads)
              ? leads.filter(lead => lead.etapa_kanban_id === etapa.id)
              : [];
            const corDaEtapa = ETAPA_COLORS[index % ETAPA_COLORS.length];

            return (
              <PipelineColumn
                key={etapa.id}
                column={pipelineColumn}
                leads={leadsDaEtapa}
                corEtapa={corDaEtapa}
                onEditLead={modalControls.openEditLeadModal}
                onDropLeadInColumn={leadActions.handleDropLeadInColumn}
                onOpenHistory={handleOpenHistory}
                onOpenChat={leadActions.handleOpenChat}
                onEditEtapa={() => modalControls.openEditEtapaModal(pipelineColumn)}
                onDeleteEtapa={() => console.log('Delete etapa:', etapa.id)}
              />
            );
        })}
        
        {/* Estado vazio quando não há etapas */}
        {(!Array.isArray(etapas) || etapas.length === 0) && (
          <div className="w-full flex items-center justify-center py-20">
            <div className="text-center">
              <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus size={32} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma etapa criada</h3>
              <p className="text-gray-600 mb-4">Crie sua primeira etapa para começar a organizar seu funil de vendas.</p>
              <button
                onClick={modalControls.openCreateEtapaModal}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Criar Primeira Etapa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
