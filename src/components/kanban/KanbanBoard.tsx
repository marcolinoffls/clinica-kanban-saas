
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { ConsultasHistoryModal } from './ConsultasHistoryModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useUpdateLead, useMoveLeadToStage } from '@/hooks/useLeadsData';
import { useUpdateEtapa, useDeleteEtapa } from '@/hooks/useEtapasData';
import { useClinicaOperations } from '@/hooks/useClinicaOperations';
import { useReorderEtapas } from '@/hooks/useEtapaReorder';

/**
 * Componente principal do Kanban com funcionalidades de drag and drop separadas
 * 
 * CORREÇÃO APLICADA:
 * - Separação completa entre drag de leads e drag de etapas
 * - Eventos isolados para evitar conflitos
 * - Validações específicas para cada tipo de drag
 * - Prevenção de propagação de eventos
 */

// Tipos TypeScript para os dados
export interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  anotacoes: string | null;
  etapa_kanban_id: string | null;
  tag_id: string | null;
  data_ultimo_contato: string | null;
  created_at: string;
  updated_at: string | null;
  clinica_id: string | null;
  origem_lead: string | null;
  servico_interesse: string | null;
}

export interface KanbanColumn {
  id: string;
  title: string;
  leadIds: string[];
}

interface KanbanBoardProps {
  onNavigateToChat?: (leadId: string) => void;
}

// Cores para as etapas (ciclo de 7 cores)
const ETAPA_COLORS = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-yellow-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-pink-500'
];

export const KanbanBoard = ({ onNavigateToChat }: KanbanBoardProps) => {
  // Estados do componente
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<any>(null);
  const [consultasLead, setConsultasLead] = useState<any[]>([]);
  const [etapaToDelete, setEtapaToDelete] = useState<any>(null);
  const [isMoveLeadsModalOpen, setIsMoveLeadsModalOpen] = useState(false);
  
  // Estados para controle de drag separados
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [draggedEtapa, setDraggedEtapa] = useState<string | null>(null);
  const [etapaReorderMode, setEtapaReorderMode] = useState(false);

  // Hook principal para dados do Supabase
  const { etapas = [], leads = [], tags = [], loading } = useSupabaseData();
  
  // Hook para operações da clínica
  const { createLead, createEtapa } = useClinicaOperations();
  
  // Hooks especializados para mutações
  const updateLeadMutation = useUpdateLead();
  const moveLeadMutation = useMoveLeadToStage();
  const updateEtapaMutation = useUpdateEtapa();
  const deleteEtapaMutation = useDeleteEtapa();
  const reorderEtapasMutation = useReorderEtapas();

  // ========== FUNÇÕES DE LEADS ==========

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = async (leadData: Partial<Lead> & { nome: string }) => {
    try {
      if (!leadData.nome?.trim()) {
        throw new Error('Nome do lead é obrigatório');
      }

      if (selectedLead) {
        await updateLeadMutation.mutateAsync({ id: selectedLead.id, ...leadData });
      } else {
        await createLead({
          nome: leadData.nome,
          telefone: leadData.telefone || undefined,
          email: leadData.email || undefined,
          etapa_kanban_id: leadData.etapa_kanban_id || undefined,
          tag_id: leadData.tag_id || undefined,
          anotacoes: leadData.anotacoes || undefined,
          origem_lead: leadData.origem_lead || undefined,
          servico_interesse: leadData.servico_interesse || undefined,
        });
      }
      
      setIsLeadModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar lead:', error);
      alert(error.message || 'Erro ao salvar lead. Tente novamente.');
    }
  };

  // ========== DRAG AND DROP DE LEADS ==========
  
  const handleLeadDragStart = (leadId: string, fromEtapaId: string) => {
    console.log('🔄 Iniciando drag de lead:', leadId, 'da etapa:', fromEtapaId);
    setDraggedLead(leadId);
    // Resetar qualquer drag de etapa ativo
    setDraggedEtapa(null);
    setEtapaReorderMode(false);
  };

  const handleLeadDragEnd = () => {
    console.log('✅ Finalizando drag de lead');
    setDraggedLead(null);
  };

  const handleLeadDrop = async (leadId: string, fromEtapa: string, toEtapa: string) => {
    if (fromEtapa === toEtapa) {
      console.log('⚠️ Lead já está na etapa de destino');
      return;
    }
    
    try {
      console.log('🔄 Movendo lead', leadId, 'de', fromEtapa, 'para', toEtapa);
      await moveLeadMutation.mutateAsync({ leadId, etapaId: toEtapa });
    } catch (error) {
      console.error('❌ Erro ao mover lead:', error);
      alert('Erro ao mover lead. Tente novamente.');
    }
  };

  // ========== DRAG AND DROP DE ETAPAS ==========
  
  const handleEtapaDragStart = (e: React.DragEvent, etapaId: string) => {
    // Só permitir se estiver em modo de reordenação
    if (!etapaReorderMode) {
      e.preventDefault();
      return;
    }
    
    console.log('🔄 Iniciando drag de etapa:', etapaId);
    setDraggedEtapa(etapaId);
    // Resetar qualquer drag de lead ativo
    setDraggedLead(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('etapa/id', etapaId);
  };

  const handleEtapaDragOver = (e: React.DragEvent) => {
    if (!etapaReorderMode || !draggedEtapa) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleEtapaDrop = (e: React.DragEvent, targetEtapaId: string) => {
    e.preventDefault();
    
    if (!etapaReorderMode || !draggedEtapa || draggedEtapa === targetEtapaId) {
      setDraggedEtapa(null);
      return;
    }

    // Verificar se etapas é um array válido
    if (!Array.isArray(etapas) || etapas.length === 0) {
      setDraggedEtapa(null);
      return;
    }

    console.log('🔄 Reordenando etapa', draggedEtapa, 'para posição de', targetEtapaId);

    // Encontrar posições das etapas
    const draggedIndex = etapas.findIndex(etapa => etapa.id === draggedEtapa);
    const targetIndex = etapas.findIndex(etapa => etapa.id === targetEtapaId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reordenar etapas no array local
    const newEtapas = [...etapas];
    const [draggedEtapaObj] = newEtapas.splice(draggedIndex, 1);
    newEtapas.splice(targetIndex, 0, draggedEtapaObj);

    // Criar array de atualizações com nova ordem
    const etapasToUpdate = newEtapas.map((etapa, index) => ({
      id: etapa.id,
      ordem: index
    }));

    // Enviar atualizações para o backend
    reorderEtapasMutation.mutate({ etapas: etapasToUpdate });
    setDraggedEtapa(null);
  };

  // ========== FUNÇÕES DE ETAPAS ==========

  const handleOpenHistory = async (lead: Lead) => {
    try {
      const consultas: any[] = [];
      setConsultasLead(consultas);
      setSelectedLead(lead);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      alert('Erro ao carregar histórico. Tente novamente.');
    }
  };

  const handleOpenChat = (lead: Lead) => {
    if (onNavigateToChat) {
      onNavigateToChat(lead.id);
    }
  };

  const handleCreateEtapa = () => {
    setEditingEtapa(null);
    setIsEtapaModalOpen(true);
  };

  const handleEditEtapa = (etapa: any) => {
    setEditingEtapa(etapa);
    setIsEtapaModalOpen(true);
  };

  const handleSaveEtapa = async (nome: string) => {
    try {
      if (editingEtapa) {
        await updateEtapaMutation.mutateAsync({ id: editingEtapa.id, nome });
      } else {
        const nextOrder = Math.max(...etapas.map(e => e.ordem || 0), 0) + 1;
        await createEtapa({ nome, ordem: nextOrder });
      }
      setIsEtapaModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      throw error;
    }
  };

  const handleDeleteEtapa = async (etapa: any) => {
    const leadsNaEtapa = leads.filter(lead => lead.etapa_kanban_id === etapa.id);
    
    if (leadsNaEtapa.length > 0) {
      setEtapaToDelete({...etapa, leadsCount: leadsNaEtapa.length});
      setIsMoveLeadsModalOpen(true);
    } else {
      const confirmacao = confirm(
        `Tem certeza que deseja excluir a etapa "${etapa.nome}"?\n\nEsta ação não pode ser desfeita.`
      );

      if (!confirmacao) return;

      try {
        await deleteEtapaMutation.mutateAsync(etapa.id);
      } catch (error: any) {
        console.error('Erro ao excluir etapa:', error);
        alert(error.message || 'Erro ao excluir etapa. Tente novamente.');
      }
    }
  };

  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string) => {
    if (!etapaToDelete) return;

    try {
      const leadsToMove = leads.filter(lead => lead.etapa_kanban_id === etapaToDelete.id);
      
      const movePromises = leadsToMove.map(lead => 
        moveLeadMutation.mutateAsync({ leadId: lead.id, etapaId: targetEtapaId })
      );
      
      await Promise.all(movePromises);
      await deleteEtapaMutation.mutateAsync(etapaToDelete.id);
      
      setEtapaToDelete(null);
    } catch (error) {
      console.error('Erro ao mover leads e deletar etapa:', error);
      throw error;
    }
  };

  // Mostrar loading enquanto carrega dados
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
      {/* Header da página com título e botões */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciamento de Leads
          </h2>
          <p className="text-gray-600 mt-1">
            Acompanhe o progresso dos seus leads no funil de vendas
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setEtapaReorderMode(!etapaReorderMode)}
            className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              etapaReorderMode 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title={etapaReorderMode ? 'Cancelar reordenação' : 'Reordenar etapas'}
          >
            {etapaReorderMode ? 'Cancelar Reordenação' : 'Reordenar Etapas'}
          </button>
          <button
            onClick={handleCreateEtapa}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus size={18} />
            Nova Etapa
          </button>
          <button
            onClick={handleCreateLead}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Aviso quando em modo de reordenação */}
      {etapaReorderMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Modo de Reordenação Ativo:</strong> Arraste as colunas para reordená-las. 
            Clique em "Cancelar Reordenação" para voltar ao modo normal.
          </p>
        </div>
      )}

      {/* Board do Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
        {Array.isArray(etapas) && etapas.map((etapa, index) => {
          const leadsEtapa = Array.isArray(leads) 
            ? leads.filter(lead => lead.etapa_kanban_id === etapa.id)
            : [];
          const corEtapa = ETAPA_COLORS[index % ETAPA_COLORS.length];
          
          return (
            <div
              key={etapa.id}
              draggable={etapaReorderMode}
              onDragStart={(e) => handleEtapaDragStart(e, etapa.id)}
              onDragOver={handleEtapaDragOver}
              onDrop={(e) => handleEtapaDrop(e, etapa.id)}
              className={`transition-all duration-200 ${
                etapaReorderMode ? 'cursor-move' : ''
              } ${
                draggedEtapa === etapa.id ? 'opacity-50 scale-95' : ''
              }`}
            >
              <KanbanColumn
                column={{
                  id: etapa.id,
                  title: etapa.nome,
                  leadIds: leadsEtapa.map(l => l.id)
                }}
                leads={leadsEtapa}
                corEtapa={corEtapa}
                onEditLead={handleEditLead}
                onOpenHistory={handleOpenHistory}
                onOpenChat={handleOpenChat}
                onEditEtapa={() => handleEditEtapa(etapa)}
                onDeleteEtapa={() => handleDeleteEtapa(etapa)}
                // Props específicas para drag de leads
                onLeadDragStart={handleLeadDragStart}
                onLeadDragEnd={handleLeadDragEnd}
                onLeadDrop={handleLeadDrop}
                draggedLead={draggedLead}
                etapaReorderMode={etapaReorderMode}
              />
            </div>
          );
        })}
        
        {/* Mensagem quando não há etapas */}
        {(!Array.isArray(etapas) || etapas.length === 0) && (
          <div className="col-span-full flex items-center justify-center py-20">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma etapa criada
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira etapa para começar a organizar seus leads.
              </p>
              <button
                onClick={handleCreateEtapa}
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
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={selectedLead}
        etapas={etapas}
        onSave={handleSaveLead}
        onOpenHistory={selectedLead ? () => handleOpenHistory(selectedLead) : undefined}
      />

      <ConsultasHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        lead={selectedLead}
        consultas={consultasLead}
      />

      <EtapaModal
        isOpen={isEtapaModalOpen}
        onClose={() => setIsEtapaModalOpen(false)}
        onSave={handleSaveEtapa}
        etapa={editingEtapa}
        etapasExistentes={etapas}
      />

      <MoveLeadsModal
        isOpen={isMoveLeadsModalOpen}
        onClose={() => {
          setIsMoveLeadsModalOpen(false);
          setEtapaToDelete(null);
        }}
        onConfirm={handleMoveLeadsAndDeleteEtapa}
        etapaToDelete={etapaToDelete}
        leadsCount={etapaToDelete?.leadsCount || 0}
        etapasDisponiveis={etapas}
      />
    </div>
  );
};
