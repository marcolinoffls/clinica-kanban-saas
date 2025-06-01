// src/components/kanban/KanbanBoard.tsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { ConsultasHistoryModal } from './ConsultasHistoryModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useUpdateLead, useMoveLeadToStage, CreateLeadData } from '@/hooks/useLeadsData';
import { useUpdateEtapa, useDeleteEtapa, CreateEtapaData, Etapa } from '@/hooks/useEtapasData';
import { useClinicaOperations } from '@/hooks/useClinicaOperations';
import { useReorderEtapas } from '@/hooks/useEtapaReorder';

/**
 * Componente principal do Kanban com funcionalidades aprimoradas.
 * Permite arrastar e soltar tanto cards de lead entre colunas,
 * quanto as próprias colunas para reordenação.
 */

// Interface para os dados de um Lead
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
  ordem?: number; // Opcional: para ordenação interna se implementado
}

// Interface para representar uma coluna (etapa) no Kanban
// Agora extende Etapa para ser compatível com os dados do banco
export interface IKanbanColumn extends Etapa {
  title: string; // Calculado a partir de nome
  leadIds: string[]; // IDs dos leads nesta coluna (calculado)
}

interface KanbanBoardProps {
  onNavigateToChat?: (leadId: string) => void;
}

// Cores para as etapas (ciclo de 7 cores)
const ETAPA_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'
];

export const KanbanBoard = ({ onNavigateToChat }: KanbanBoardProps) => {
  // Estados para modais e seleção
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<IKanbanColumn | null>(null);
  const [consultasLead, setConsultasLead] = useState<any[]>([]);
  const [etapaToDelete, setEtapaToDelete] = useState<(IKanbanColumn & { leadsCount?: number }) | null>(null);
  const [isMoveLeadsModalOpen, setIsMoveLeadsModalOpen] = useState(false);

  // Estado para controlar qual COLUNA (etapa) está sendo arrastada
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  // Estado para feedback visual da coluna alvo durante o drag de outra coluna
  const [columnDragOverTargetId, setColumnDragOverTargetId] = useState<string | null>(null);

  // Hooks de dados e mutações
  const { etapas = [], leads = [], tags = [], loading } = useSupabaseData();
  const { createLead, createEtapa } = useClinicaOperations();
  const updateLeadMutation = useUpdateLead();
  const moveLeadMutation = useMoveLeadToStage(); // Para mover cards de lead
  const updateEtapaMutation = useUpdateEtapa();
  const deleteEtapaMutation = useDeleteEtapa();
  const reorderEtapasMutation = useReorderEtapas(); // Para reordenar colunas

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

  // Função para salvar lead (criar ou editar)
  const handleSaveLead = async (leadData: Omit<CreateLeadData, 'clinica_id'> & Partial<Lead> & { etapa_kanban_id?: string }) => {
    try {
      if (!leadData.nome?.trim()) {
        throw new Error('Nome do lead é obrigatório');
      }
      if (selectedLead && selectedLead.id) {
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

  /**
   * Chamado quando um LeadCard é solto em uma KanbanColumnComponent.
   * Atualiza a etapa_kanban_id do lead.
   */
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    console.log(`📦 KanbanBoard.handleDropLeadInColumn chamado:`, {
      leadId,
      fromColumnId, 
      toColumnId
    });

    // Validações iniciais
    if (!leadId || !fromColumnId || !toColumnId) {
      console.error('❌ Parâmetros inválidos para drop:', { leadId, fromColumnId, toColumnId });
      return;
    }

    if (fromColumnId === toColumnId) {
      console.log('⚪ Lead já está na coluna de destino, ignorando');
      return;
    }

    // Buscar informações do lead para logging
    const lead = Array.isArray(leads) ? leads.find(l => l.id === leadId) : null;
    if (lead) {
      console.log(`📋 Movendo lead "${lead.nome}" da coluna ${fromColumnId} para ${toColumnId}`);
    }
    
    try {
      console.log('🚀 Executando mutação useMoveLeadToStage...');
      
      const result = await moveLeadMutation.mutateAsync({ 
        leadId, 
        etapaId: toColumnId 
      });
      
      console.log('✅ Mutação executada com sucesso:', result);

    } catch (error: any) {
      console.error('❌ Erro detalhado ao mover lead:', {
        error: error.message,
        leadId,
        toColumnId,
        stack: error.stack
      });
      
      // O toast de erro já é mostrado pelo hook useMoveLeadToStage
    }
  };

  // Função para abrir histórico de consultas
  const handleOpenHistory = async (lead: Lead) => {
    try {
      const c: any[] = []; // Simulação
      setConsultasLead(c);
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
  const handleEditEtapa = (etapa: IKanbanColumn) => {
    setEditingEtapa(etapa);
    setIsEtapaModalOpen(true);
  };

  // Função para salvar etapa
  const handleSaveEtapa = async (nome: string) => {
    try {
      if (editingEtapa && editingEtapa.id) {
        await updateEtapaMutation.mutateAsync({ id: editingEtapa.id, nome });
      } else {
        const currentEtapas = Array.isArray(etapas) ? etapas : [];
        const nextOrder = Math.max(...currentEtapas.map(e => e.ordem || 0), -1) + 1;
        await createEtapa({ nome, ordem: nextOrder } as Omit<CreateEtapaData, 'clinica_id'>);
      }
      setIsEtapaModalOpen(false);
      setEditingEtapa(null);
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      throw error;
    }
  };

  // Função para excluir etapa
  const handleDeleteEtapa = async (etapaParaDeletar: IKanbanColumn) => {
    const currentLeads = Array.isArray(leads) ? leads : [];
    const leadsNaEtapa = currentLeads.filter(l => l.etapa_kanban_id === etapaParaDeletar.id);
    if (leadsNaEtapa.length > 0) {
      setEtapaToDelete({ ...etapaParaDeletar, leadsCount: leadsNaEtapa.length });
      setIsMoveLeadsModalOpen(true);
    } else {
      const confirmacao = confirm(
        `Tem certeza que deseja excluir a etapa "${etapaParaDeletar.title || etapaParaDeletar.nome}"?\n\nEsta ação não pode ser desfeita.`
      );
      if (!confirmacao) return;
      try {
        await deleteEtapaMutation.mutateAsync(etapaParaDeletar.id);
      } catch (error: any) {
        console.error('Erro ao excluir etapa:', error);
        alert(error.message || 'Erro ao excluir etapa. Tente novamente.');
      }
    }
  };

  // Função para mover leads e excluir etapa
  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string) => {
    if (!etapaToDelete || !etapaToDelete.id) return;
    try {
      const currentLeads = Array.isArray(leads) ? leads : [];
      const leadsToMove = currentLeads.filter(lead => lead.etapa_kanban_id === etapaToDelete.id);
      const movePromises = leadsToMove.map(lead =>
        moveLeadMutation.mutateAsync({ leadId: lead.id, etapaId: targetEtapaId })
      );
      await Promise.all(movePromises);
      await deleteEtapaMutation.mutateAsync(etapaToDelete.id);
      setEtapaToDelete(null);
      setIsMoveLeadsModalOpen(false);
    } catch (error) {
      console.error('Erro ao mover leads e deletar etapa:', error);
      alert('Ocorreu um erro ao mover os leads e deletar a etapa.');
    }
  };

  // --- Manipuladores de Drag and Drop para COLUNAS (ETAPAS) ---
  /**
   * Início do arraste de uma COLUNA.
   * Define o ID da coluna e o tipo de item sendo arrastado.
   */
  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    // Verifica se o clique foi diretamente no wrapper da coluna ou num filho como um botão
    // Para evitar que o arraste da coluna comece ao clicar em botões dentro dela,
    // pode-se verificar e.target ou adicionar um "handle" específico para arrastar.
    // Por simplicidade, vamos assumir que o arraste é no div principal da coluna.
    
    e.dataTransfer.setData('draggedColumnId', columnId); // Identifica a coluna sendo arrastada
    e.dataTransfer.setData('itemType', 'kanbanColumn');  // Identifica o TIPO de item
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumnId(columnId); // Estado para feedback visual
  };

  /**
   * Chamado quando uma coluna arrastada é solta (final do drag).
   * Limpa os estados de feedback visual.
   */
  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
    setColumnDragOverTargetId(null);
  };

  /**
   * Chamado continuamente enquanto uma coluna arrastada está sobre outra área de drop (outra coluna).
   * Previne o comportamento padrão para permitir o drop.
   * Atualiza o estado para feedback visual do alvo.
   */
  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    
    const itemType = e.dataTransfer.getData('itemType');
    const draggedId = e.dataTransfer.getData('draggedColumnId');

    if (itemType === 'kanbanColumn' && draggedId && draggedId !== targetColumnId) {
      e.dataTransfer.dropEffect = 'move';
      setColumnDragOverTargetId(targetColumnId);
    } else {
      e.dataTransfer.dropEffect = 'none';
      if (draggedId === targetColumnId) {
        setColumnDragOverTargetId(null);
      }
    }
  };
  
  /**
   * Chamado quando uma coluna arrastada sai da área de drop de outra coluna.
   * Limpa o feedback visual do alvo.
   */
  const handleColumnDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Só remove o estado se realmente saiu da área da coluna
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setColumnDragOverTargetId(null);
    }
  };

  /**
   * Chamado quando uma COLUNA arrastada é solta sobre outra COLUNA (o alvo).
   * Lida com a lógica de reordenação das colunas.
   */
  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    
    const sourceColumnId = e.dataTransfer.getData('draggedColumnId');
    const itemType = e.dataTransfer.getData('itemType');

    console.log('🟢 Drop de coluna:', { sourceColumnId, targetColumnId, itemType });

    setDraggedColumnId(null);
    setColumnDragOverTargetId(null);

    if (itemType === 'kanbanColumn' && sourceColumnId && sourceColumnId !== targetColumnId) {
      const currentEtapas = Array.isArray(etapas) ? [...etapas] : [];
      if (currentEtapas.length === 0) return;

      const sourceIndex = currentEtapas.findIndex(etapa => etapa.id === sourceColumnId);
      const targetIndex = currentEtapas.findIndex(etapa => etapa.id === targetColumnId);

      if (sourceIndex === -1 || targetIndex === -1) {
        console.warn("⚠️ Índice de origem ou destino não encontrado para reordenação de colunas.");
        return;
      }

      // Lógica de reordenação
      const [draggedItem] = currentEtapas.splice(sourceIndex, 1);
      currentEtapas.splice(targetIndex, 0, draggedItem);

      // Prepara os dados para atualização no backend
      const etapasToUpdate = currentEtapas.map((etapa, index) => ({
        id: etapa.id,
        ordem: index,
      }));
      
      console.log('🔄 Reordenando etapas:', etapasToUpdate);
      reorderEtapasMutation.mutate({ etapas: etapasToUpdate });
    }
  };

  // Função para converter Etapa em IKanbanColumn
  const convertEtapaToKanbanColumn = (etapa: Etapa): IKanbanColumn => {
    const currentLeads = Array.isArray(leads) ? leads : [];
    const leadsDaEtapa = currentLeads.filter(lead => lead.etapa_kanban_id === etapa.id);
    
    return {
      ...etapa,
      title: etapa.nome, // Mapeia nome para title
      leadIds: leadsDaEtapa.map(lead => lead.id), // Calcula leadIds
    };
  };

  // Feedback visual durante o carregamento inicial
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
      {/* Header da página */}
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

      {/* Board do Kanban: container para as colunas */}
      <div
        className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-200px)] items-start"
        // Os eventos de drag over e drop para COLUNAS são agora nos wrappers individuais de cada coluna
        // para permitir que uma coluna seja solta "sobre" ou "entre" outras.
      >
        {/* Mapeia as etapas (colunas) ordenadas */}
        {Array.isArray(etapas) && etapas
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)) // Ordena as colunas pela prop 'ordem'
          .map((etapa: Etapa, index) => { // etapa agora é do tipo Etapa
            const kanbanColumn = convertEtapaToKanbanColumn(etapa); // Converte para IKanbanColumn
            const leadsDaEtapa = Array.isArray(leads)
              ? leads.filter(lead => lead.etapa_kanban_id === etapa.id)
              : [];
            const corDaEtapa = ETAPA_COLORS[index % ETAPA_COLORS.length];

            return (
              // Este div é o wrapper que se torna arrastável para reordenar a COLUNA
              <div
                key={etapa.id}
                draggable // Torna a coluna inteira (este wrapper) arrastável
                onDragStart={(e) => handleColumnDragStart(e, etapa.id)}
                onDragEnd={handleColumnDragEnd} // Limpa estados de drag
                onDragOver={(e) => handleColumnDragOver(e, etapa.id)} // Permite que outras colunas sejam soltas aqui
                onDragLeave={handleColumnDragLeave} // Limpa feedback visual de alvo
                onDrop={(e) => handleColumnDrop(e, etapa.id)}   // Lida com o drop de outra coluna aqui
                className={`h-full flex flex-col transition-all duration-200 cursor-grab 
                            ${draggedColumnId === etapa.id ? 'opacity-40 scale-95' : ''}
                          `}
                // Adiciona um data-attribute para debugging ou estilos
                data-etapa-draggable-id={etapa.id}
              >
                {/* O componente KanbanColumnComponent em si não é mais draggable, mas é um alvo de drop para cards. */}
                <KanbanColumnComponent
                  column={kanbanColumn} // Passa a etapa convertida (IKanbanColumn)
                  leads={leadsDaEtapa}
                  corEtapa={corDaEtapa}
                  onEditLead={handleEditLead}
                  onDropLeadInColumn={handleDropLeadInColumn} // Passa o handler para drop de leads
                  onOpenHistory={handleOpenHistory}
                  onOpenChat={handleOpenChat}
                  onEditEtapa={() => handleEditEtapa(kanbanColumn)}
                  onDeleteEtapa={() => handleDeleteEtapa(kanbanColumn)}
                  isColumnDragOverTarget={columnDragOverTargetId === etapa.id && draggedColumnId !== etapa.id && !!draggedColumnId}
                />
              </div>
            );
        })}
        
        {/* Placeholder se não houver etapas */}
        {(!Array.isArray(etapas) || etapas.length === 0) && (
          <div className="w-full flex items-center justify-center py-20">
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

      {/* Modais (mantidos como na sua versão original) */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={selectedLead}
        etapas={Array.isArray(etapas) ? etapas : []}
        onSave={handleSaveLead as any} // Tipagem de onSave precisa ser alinhada ou usar 'as any'
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
        etapasExistentes={Array.isArray(etapas) ? etapas : []}
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
        etapasDisponiveis={Array.isArray(etapas) ? etapas.filter(e => e.id !== etapaToDelete?.id) : []}
      />
    </div>
  );
};
