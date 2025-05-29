
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
 * Componente principal do Kanban com funcionalidades aprimoradas
 * 
 * Novas funcionalidades implementadas:
 * - Cores distintivas para cada etapa
 * - Reordenação de etapas por drag and drop
 * - Verificação de leads antes de deletar etapas
 * - Movimentação automática de leads ao deletar etapas
 * - Design moderno e responsivo
 */

// Tipos TypeScript corrigidos para compatibilidade
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
  const [draggedEtapa, setDraggedEtapa] = useState<string | null>(null);

  // Hook principal para dados do Supabase - CORREÇÃO: garantir arrays válidos
  const { etapas = [], leads = [], tags = [], loading } = useSupabaseData();
  
  // Hook para operações da clínica
  const { createLead, createEtapa } = useClinicaOperations();
  
  // Hooks especializados para mutações
  const updateLeadMutation = useUpdateLead();
  const moveLeadMutation = useMoveLeadToStage();
  const updateEtapaMutation = useUpdateEtapa();
  const deleteEtapaMutation = useDeleteEtapa();
  const reorderEtapasMutation = useReorderEtapas();

  // Função para abrir modal de edição de lead
  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  // Função para criar novo lead
  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsLeadModalOpen(true);
  };

  // Função para salvar lead (criar ou editar) com validação
  const handleSaveLead = async (leadData: Partial<Lead> & { nome: string }) => {
    try {
      // Validação local antes de enviar para o Supabase
      if (!leadData.nome?.trim()) {
        throw new Error('Nome do lead é obrigatório');
      }

      if (selectedLead) {
        // Editando lead existente
        await updateLeadMutation.mutateAsync({ id: selectedLead.id, ...leadData });
      } else {
        // CORREÇÃO: Usar createLead corretamente sem clinica_id
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

  // Função para mover lead entre colunas (drag and drop)
  const handleMoveCard = async (leadId: string, fromEtapa: string, toEtapa: string) => {
    if (fromEtapa === toEtapa) return;
    
    try {
      await moveLeadMutation.mutateAsync({ leadId, etapaId: toEtapa });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      alert('Erro ao mover lead. Tente novamente.');
    }
  };

  // Função para abrir histórico de consultas
  const handleOpenHistory = async (lead: Lead) => {
    try {
      // Buscar consultas seria implementado aqui
      const consultas: any[] = [];
      setConsultasLead(consultas);
      setSelectedLead(lead);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      alert('Erro ao carregar histórico. Tente novamente.');
    }
  };

  // Função para abrir chat com lead
  const handleOpenChat = (lead: Lead) => {
    if (onNavigateToChat) {
      onNavigateToChat(lead.id);
    }
  };

  // Função para criar nova etapa
  const handleCreateEtapa = () => {
    setEditingEtapa(null);
    setIsEtapaModalOpen(true);
  };

  // Função para editar etapa existente
  const handleEditEtapa = (etapa: any) => {
    setEditingEtapa(etapa);
    setIsEtapaModalOpen(true);
  };

  // Função para salvar etapa
  const handleSaveEtapa = async (nome: string) => {
    try {
      if (editingEtapa) {
        await updateEtapaMutation.mutateAsync({ id: editingEtapa.id, nome });
      } else {
        // Calcular próxima ordem
        const nextOrder = Math.max(...etapas.map(e => e.ordem || 0), 0) + 1;
        await createEtapa({ nome, ordem: nextOrder });
      }
      setIsEtapaModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      throw error; // Propagar erro para o modal
    }
  };

  // Função para excluir etapa
  const handleDeleteEtapa = async (etapa: any) => {
    // Verificar se a etapa possui leads
    const leadsNaEtapa = leads.filter(lead => lead.etapa_kanban_id === etapa.id);
    
    if (leadsNaEtapa.length > 0) {
      // Se houver leads, abrir modal para mover leads
      setEtapaToDelete({...etapa, leadsCount: leadsNaEtapa.length});
      setIsMoveLeadsModalOpen(true);
    } else {
      // Se não houver leads, confirmar exclusão diretamente
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

  // Função para mover leads e excluir etapa
  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string) => {
    if (!etapaToDelete) return;

    try {
      // Buscar todos os leads da etapa a ser deletada
      const leadsToMove = leads.filter(lead => lead.etapa_kanban_id === etapaToDelete.id);
      
      // Mover todos os leads para a etapa destino
      const movePromises = leadsToMove.map(lead => 
        moveLeadMutation.mutateAsync({ leadId: lead.id, etapaId: targetEtapaId })
      );
      
      await Promise.all(movePromises);
      
      // Após mover todos os leads, deletar a etapa
      await deleteEtapaMutation.mutateAsync(etapaToDelete.id);
      
      setEtapaToDelete(null);
    } catch (error) {
      console.error('Erro ao mover leads e deletar etapa:', error);
      throw error;
    }
  };

  // Função para drag and drop de etapas
  const handleEtapaDragStart = (e: React.DragEvent, etapaId: string) => {
    setDraggedEtapa(etapaId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleEtapaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleEtapaDrop = (e: React.DragEvent, targetEtapaId: string) => {
    e.preventDefault();
    
    if (!draggedEtapa || draggedEtapa === targetEtapaId) {
      setDraggedEtapa(null);
      return;
    }

    // CORREÇÃO: Verificar se etapas é um array válido antes de buscar índices
    if (!Array.isArray(etapas) || etapas.length === 0) {
      setDraggedEtapa(null);
      return;
    }

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
      {/* Header da página com título e botões - Responsivo */}
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

      {/* Board do Kanban - Layout responsivo */}
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
        {/* CORREÇÃO: Verificar se etapas é array válido antes de mapear */}
        {Array.isArray(etapas) && etapas.map((etapa, index) => {
          // CORREÇÃO: Garantir que leads seja array válido antes de filtrar
          const leadsEtapa = Array.isArray(leads) 
            ? leads.filter(lead => lead.etapa_kanban_id === etapa.id)
            : [];
          const corEtapa = ETAPA_COLORS[index % ETAPA_COLORS.length];
          
          return (
            <div
              key={etapa.id}
              draggable
              onDragStart={(e) => handleEtapaDragStart(e, etapa.id)}
              onDragOver={handleEtapaDragOver}
              onDrop={(e) => handleEtapaDrop(e, etapa.id)}
              className={`cursor-move transition-all duration-200 ${
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
                onMoveCard={handleMoveCard}
                onOpenHistory={handleOpenHistory}
                onOpenChat={handleOpenChat}
                onEditEtapa={() => handleEditEtapa(etapa)}
                onDeleteEtapa={() => handleDeleteEtapa(etapa)}
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

      {/* Modal para edição/criação de leads com seleção de etapa */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={selectedLead}
        etapas={etapas}
        onSave={handleSaveLead}
        onOpenHistory={selectedLead ? () => handleOpenHistory(selectedLead) : undefined}
      />

      {/* Modal para histórico de consultas */}
      <ConsultasHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        lead={selectedLead}
        consultas={consultasLead}
      />

      {/* Modal para criar/editar etapas */}
      <EtapaModal
        isOpen={isEtapaModalOpen}
        onClose={() => setIsEtapaModalOpen(false)}
        onSave={handleSaveEtapa}
        etapa={editingEtapa}
        etapasExistentes={etapas}
      />

      {/* Modal para mover leads ao deletar etapa */}
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
