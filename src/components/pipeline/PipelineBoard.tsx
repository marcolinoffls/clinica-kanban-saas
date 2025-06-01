import React from 'react';
import { Plus } from 'lucide-react';
import { PipelineColumn } from './PipelineColumn';
// Removido: import { PipelineLeadModal } from './PipelineLeadModal';
import { LeadModal } from '@/components/kanban/LeadModal'; // <--- ALTERADO: Importar o LeadModal existente
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
// Importar o tipo Lead original se for diferente de LeadPipeline e o LeadModal o esperar
// Se LeadPipeline e Lead (do KanbanModal) forem compatíveis, não é necessário.
// Assumindo que LeadPipeline é compatível com o que LeadModal espera para 'lead' prop.

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
  // IMPORTANTE: Todos os hooks devem ser chamados SEMPRE, na mesma ordem
  // Hooks para gerenciar estado dos modais
  const modalControls = usePipelineModals();

  // Hooks para ações de leads e etapas
  const leadActions = usePipelineLeadActions(onNavigateToChat);
  const etapaActions = usePipelineEtapaActions();
  const columnDrag = usePipelineColumnDrag();

  // Buscar dados principais - SEMPRE chamados
  const { data: leadsData = [], isLoading: leadsLoading, error: leadsError } = useLeads();
  const { data: etapasData = [], isLoading: etapasLoading, error: etapasError } = useEtapas();

  // Declarar variáveis globais para drag (SEMPRE executado)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__DRAGGED_LEAD__ = null;
      // @ts-ignore
      window.__DRAGGED_COLUMN__ = null;
    }
  }, []);

  // Memoização de dados processados (SEMPRE executada)
  const leads = React.useMemo(() => {
    return Array.isArray(leadsData) ? leadsData : [];
  }, [leadsData]);

  const etapas = React.useMemo(() => {
    return Array.isArray(etapasData) ? etapasData : [];
  }, [etapasData]);

  const loading = leadsLoading || etapasLoading;
  const hasError = !!(leadsError || etapasError); // Corrigido para boolean

  // Converter dados para tipos do Pipeline (SEMPRE executado)
  const leadsTyped: LeadPipeline[] = React.useMemo(() => {
    if (!Array.isArray(leads)) return [];

    return leads.map(lead => ({
      id: lead?.id || '',
      nome: lead?.nome || '',
      telefone: lead?.telefone || null,
      email: lead?.email || null,
      anotacoes: lead?.anotacoes || null,
      etapa_kanban_id: lead?.etapa_kanban_id || null,
      tag_id: lead?.tag_id || null,
      data_ultimo_contato: lead?.data_ultimo_contato || null,
      created_at: lead?.created_at || new Date().toISOString(), // Adicionado fallback
      updated_at: lead?.updated_at || null,
      clinica_id: lead?.clinica_id || null,
      origem_lead: lead?.origem_lead || null,
      servico_interesse: lead?.servico_interesse || null,
    }));
  }, [leads]);

  const etapasTyped: EtapaPipeline[] = React.useMemo(() => {
    if (!Array.isArray(etapas)) return [];

    return etapas.map(etapa => ({
      id: etapa?.id || '',
      nome: etapa?.nome || '',
      ordem: etapa?.ordem || 0,
      clinica_id: etapa?.clinica_id || null,
      created_at: etapa?.created_at || null, // Mantido como opcional
    }));
  }, [etapas]);

  // Função para salvar lead (SEMPRE definida)
  const handleSaveLead = React.useCallback(async (leadData: Partial<LeadPipeline>) => { // Ajustado tipo
    if (!leadData) return;
    // O hook `handleSaveLead` de `leadActions` precisa ser compatível com `Partial<LeadPipeline>`
    // ou você precisa mapear `leadData` para o tipo que ele espera.
    // `modalControls.selectedLead` também deve ser do tipo `LeadPipeline | null`.
    await leadActions.handleSaveLead(leadData, modalControls.selectedLead as LeadPipeline | null);
    modalControls.closeLeadModal();
  }, [leadActions, modalControls]);

  // Função para abrir histórico (SEMPRE definida)
  const handleOpenHistory = React.useCallback(async (lead: LeadPipeline) => {
    if (!lead?.id) return;
    const consultas = await leadActions.handleOpenHistory(lead);
    modalControls.openHistoryModal(lead, consultas);
  }, [leadActions, modalControls]);

  // Função para salvar etapa (SEMPRE definida)
  const handleSaveEtapa = React.useCallback(async (nome: string) => {
    if (!nome || typeof nome !== 'string') return;
    // `modalControls.editingEtapa` deve ser do tipo `EtapaPipeline | null`.
    await etapaActions.handleSaveEtapa(nome, modalControls.editingEtapa as EtapaPipeline | null, etapasTyped);
    modalControls.closeEtapaModal();
  }, [etapaActions, modalControls, etapasTyped]);

  // Função para excluir etapa (SEMPRE definida)
  const handleDeleteEtapa = React.useCallback(async (etapa: EtapaPipeline) => {
    if (!etapa?.id) return;
    const result = await etapaActions.handleDeleteEtapa(etapa, leadsTyped);

    if (result?.needsMoveLeads && result.etapaToDelete) {
      // `result.etapaToDelete` deve ser compatível com o que `openMoveLeadsModal` espera.
      modalControls.openMoveLeadsModal(result.etapaToDelete as EtapaPipeline & { leadsCount?: number });
    }
  }, [etapaActions, leadsTyped, modalControls]);

  // Função para mover leads e deletar etapa (SEMPRE definida)
  const handleMoveLeadsAndDeleteEtapa = React.useCallback(async (targetEtapaId: string) => {
    if (!modalControls.etapaToDelete?.id || !targetEtapaId) return;

    await etapaActions.handleMoveLeadsAndDeleteEtapa(
      targetEtapaId,
      modalControls.etapaToDelete as EtapaPipeline, // Assegurar tipo
      leadsTyped
    );
    modalControls.closeMoveLeadsModal();
  }, [etapaActions, modalControls, leadsTyped]);

  // Função para criar lead em etapa específica (SEMPRE definida)
  const handleCreateLeadInEtapa = React.useCallback((etapaId: string) => {
    if (!etapaId) return;
    // Aqui você pode querer passar o etapaId para o modalControls
    // para que o LeadModal possa pré-selecionar a etapa.
    // modalControls.openCreateLeadModal({ initialEtapaId: etapaId });
    modalControls.openCreateLeadModal(); // Mantendo simples por enquanto
  }, [modalControls]);

  // RENDERIZAÇÃO CONDICIONAL APENAS AQUI, DEPOIS DE TODOS OS HOOKS

  // Estado de erro
  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Erro ao carregar dados
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Houve um problema ao carregar os dados do pipeline. Tente recarregar a página.
            {leadsError && <span className="block text-xs mt-1">Erro Leads: {leadsError.message}</span>}
            {etapasError && <span className="block text-xs mt-1">Erro Etapas: {etapasError.message}</span>}
          </p>
        </div>
      </div>
    );
  }

  // Estado de carregamento
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
            onClick={() => modalControls.openCreateLeadModal()} // Garante que selectedLead seja null
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Container das colunas do Pipeline com Drag and Drop */}
      <div className="flex-1 px-6 pb-6">
        <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-250px)] items-start">
          {etapasTyped && etapasTyped.length > 0 ? (
            etapasTyped
              .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
              .map((etapa, index) => {
                if (!etapa?.id) return null;

                const leadsDaEtapa = leadsTyped.filter(lead =>
                  lead?.etapa_kanban_id === etapa.id
                );
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
                      onEditLead={(lead) => modalControls.openEditLeadModal(lead as LeadPipeline)}
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
              })
          ) : (
            /* Estado vazio quando não há etapas */
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
      {modalControls.isLeadModalOpen && (
        // Usando LeadModal existente em vez de PipelineLeadModal
        <LeadModal
          isOpen={modalControls.isLeadModalOpen}
          onClose={modalControls.closeLeadModal}
          // @ts-ignore // selectedLead é LeadPipeline, LeadModal espera Lead (do KanbanBoard)
          // Precisamos garantir que os tipos são compatíveis ou mapear aqui.
          // Se LeadPipeline e Lead (do Kanban) forem suficientemente similares, pode funcionar.
          lead={modalControls.selectedLead as any}
          etapas={etapasTyped.map(et => ({id: et.id, nome: et.nome}))} // Mapear para o formato que LeadModal espera para etapas
          onSave={handleSaveLead as any} // Ajustar tipo se `handleSaveLead` espera LeadPipeline
          // @ts-ignore
          onOpenHistory={modalControls.selectedLead ? () => handleOpenHistory(modalControls.selectedLead!) : undefined}
        />
      )}

      {modalControls.isEtapaModalOpen && (
        <PipelineEtapaModal
          isOpen={modalControls.isEtapaModalOpen}
          onClose={modalControls.closeEtapaModal}
          onSave={handleSaveEtapa}
          etapa={modalControls.editingEtapa as EtapaPipeline | null}
          etapasExistentes={etapasTyped}
        />
      )}

      {modalControls.isHistoryModalOpen && modalControls.selectedLead && (
        <PipelineConsultasHistoryModal
          isOpen={modalControls.isHistoryModalOpen}
          onClose={modalControls.closeHistoryModal}
          lead={modalControls.selectedLead}
          consultas={modalControls.consultasLead}
        />
      )}

      {modalControls.isMoveLeadsModalOpen && modalControls.etapaToDelete && (
        <PipelineMoveLeadsModal
          isOpen={modalControls.isMoveLeadsModalOpen}
          onClose={modalControls.closeMoveLeadsModal}
          onConfirm={handleMoveLeadsAndDeleteEtapa}
          etapaToDelete={modalControls.etapaToDelete as EtapaPipeline & { leadsCount?: number }}
          leadsCount={modalControls.etapaToDelete ? leadsTyped.filter(l => l.etapa_kanban_id === modalControls.etapaToDelete?.id).length : 0}
          etapasDisponiveis={etapasTyped.filter(e => e.id !== modalControls.etapaToDelete?.id)}
        />
      )}
    </div>
  );
};