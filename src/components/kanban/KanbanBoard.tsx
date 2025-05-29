// src/components/kanban/KanbanBoard.tsx
import React, { useState } from 'react';
import { Plus, GripVertical } from 'lucide-react'; // Adicionado GripVertical para o handle de arrastar coluna
import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { ConsultasHistoryModal } from './ConsultasHistoryModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useUpdateLead, useMoveLeadToStage, CreateLeadData } from '@/hooks/useLeadsData';
import { useUpdateEtapa, useDeleteEtapa, CreateEtapaData } from '@/hooks/useEtapasData';
import { useClinicaOperations } from '@/hooks/useClinicaOperations';
import { useReorderEtapas } from '@/hooks/useEtapaReorder';

// Interfaces exportadas para uso em outros componentes
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
  ordem?: number;
}

export interface IKanbanColumn {
  id: string;
  title: string;
  leadIds: string[]; // Não é mais usado diretamente se passamos o array de leads para KanbanColumnComponent
  ordem?: number; // Essencial para a lógica de reordenação de colunas
  nome: string; // Nome da etapa, usado como title
}

interface KanbanBoardProps {
  onNavigateToChat?: (leadId: string) => void;
}

const ETAPA_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'
];

export const KanbanBoard = ({ onNavigateToChat }: KanbanBoardProps) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<IKanbanColumn | null>(null);
  const [consultasLead, setConsultasLead] = useState<any[]>([]);
  const [etapaToDelete, setEtapaToDelete] = useState<(IKanbanColumn & { leadsCount?: number }) | null>(null);
  const [isMoveLeadsModalOpen, setIsMoveLeadsModalOpen] = useState(false);
  
  // Estado para controlar qual COLUNA está sendo arrastada
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  // Estado para controlar sobre qual COLUNA o mouse está ao arrastar outra COLUNA
  const [columnDragOverTargetId, setColumnDragOverTargetId] = useState<string | null>(null);


  const { etapas = [], leads = [], tags = [], loading } = useSupabaseData();
  const { createLead, createEtapa } = useClinicaOperations();
  const updateLeadMutation = useUpdateLead();
  const moveLeadMutation = useMoveLeadToStage();
  const updateEtapaMutation = useUpdateEtapa();
  const deleteEtapaMutation = useDeleteEtapa();
  const reorderEtapasMutation = useReorderEtapas();

  // --- Funções de CRUD de Leads e Etapas (mantidas como na sua versão anterior, resumidas aqui) ---
  const handleEditLead = (lead: Lead) => { setSelectedLead(lead); setIsLeadModalOpen(true); };
  const handleCreateLead = () => { setSelectedLead(null); setIsLeadModalOpen(true); };
  const handleSaveLead = async (leadData: Omit<CreateLeadData, 'clinica_id'> & Partial<Lead> & { etapa_kanban_id?: string }) => { try { if (!leadData.nome?.trim()) { throw new Error('Nome do lead é obrigatório'); } if (selectedLead && selectedLead.id) { await updateLeadMutation.mutateAsync({ id: selectedLead.id, ...leadData }); } else { await createLead({ nome: leadData.nome, telefone: leadData.telefone || undefined, email: leadData.email || undefined, etapa_kanban_id: leadData.etapa_kanban_id || undefined, tag_id: leadData.tag_id || undefined, anotacoes: leadData.anotacoes || undefined, origem_lead: leadData.origem_lead || undefined, servico_interesse: leadData.servico_interesse || undefined, }); } setIsLeadModalOpen(false); } catch (error: any) { console.error('Erro ao salvar lead:', error); alert(error.message || 'Erro ao salvar lead.'); }};
  const handleOpenHistory = (lead: Lead) => { setConsultasLead([]); setSelectedLead(lead); setIsHistoryModalOpen(true); };
  const handleOpenChat = (lead: Lead) => { if (onNavigateToChat) onNavigateToChat(lead.id); };
  const handleCreateEtapa = () => { setEditingEtapa(null); setIsEtapaModalOpen(true); };
  const handleEditEtapa = (etapa: IKanbanColumn) => { setEditingEtapa(etapa); setIsEtapaModalOpen(true); };
  const handleSaveEtapa = async (nome: string) => { try { if (editingEtapa && editingEtapa.id) { await updateEtapaMutation.mutateAsync({ id: editingEtapa.id, nome }); } else { const currentEtapas = Array.isArray(etapas) ? etapas : []; const nextOrder = Math.max(...currentEtapas.map(e => e.ordem || 0), -1) + 1; await createEtapa({ nome, ordem: nextOrder } as Omit<CreateEtapaData, 'clinica_id'>); } setIsEtapaModalOpen(false); setEditingEtapa(null); } catch (error) { throw error; }};
  const handleDeleteEtapa = async (etapaParaDeletar: IKanbanColumn) => { const currentLeads = Array.isArray(leads) ? leads : []; const leadsNaEtapa = currentLeads.filter(l => l.etapa_kanban_id === etapaParaDeletar.id); if (leadsNaEtapa.length > 0) { setEtapaToDelete({ ...etapaParaDeletar, leadsCount: leadsNaEtapa.length }); setIsMoveLeadsModalOpen(true); } else { const c = confirm(`Excluir "${etapaParaDeletar.title || etapaParaDeletar.nome}"?`); if (!c) return; try { await deleteEtapaMutation.mutateAsync(etapaParaDeletar.id); } catch (e) {alert('Erro ao excluir'); console.error(e);}} };
  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string) => { if (!etapaToDelete || !etapaToDelete.id) return; try { const currentLeads = Array.isArray(leads) ? leads : []; const leadsToMove = currentLeads.filter(lead => lead.etapa_kanban_id === etapaToDelete.id); const movePromises = leadsToMove.map(lead => moveLeadMutation.mutateAsync({ leadId: lead.id, etapaId: targetEtapaId })); await Promise.all(movePromises); await deleteEtapaMutation.mutateAsync(etapaToDelete.id); setEtapaToDelete(null); setIsMoveLeadsModalOpen(false); } catch (error) { console.error('Erro ao mover e deletar:', error); alert('Erro.'); }};
  // -------------------------------------------------------------------------------------------

  /**
   * Callback para quando um LeadCard é solto em uma KanbanColumn.
   * Esta função é passada para KanbanColumnComponent e chamada por ela.
   */
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    if (fromColumnId === toColumnId) return;
    try {
      await moveLeadMutation.mutateAsync({ leadId, etapaId: toColumnId });
    } catch (error) {
      console.error('Erro ao mover lead para coluna no Board:', error);
      alert('Erro ao mover lead. Tente novamente.');
    }
  };

  // --- Manipuladores de Drag and Drop para COLUNAS ---
  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.dataTransfer.setData('columnId', columnId); // Identifica a coluna sendo arrastada
    e.dataTransfer.setData('itemType', 'kanbanColumn'); // Identifica o TIPO de item
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumnId(columnId);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null); // Limpa a coluna arrastada
    setColumnDragOverTargetId(null); // Limpa o alvo do drag over
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    const itemType = e.dataTransfer.types.find(type => type.toLowerCase() === 'itemtype') 
      ? e.dataTransfer.getData('itemType') 
      : null;

    if (itemType === 'kanbanColumn' && draggedColumnId && draggedColumnId !== targetColumnId) {
      e.dataTransfer.dropEffect = 'move';
      setColumnDragOverTargetId(targetColumnId); // Define sobre qual coluna estamos passando
    } else {
      e.dataTransfer.dropEffect = 'none';
      setColumnDragOverTargetId(null);
    }
  };
  
  const handleColumnDragLeave = () => {
    setColumnDragOverTargetId(null); // Limpa quando o mouse sai da área de drop da coluna
  };

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    const sourceColumnId = e.dataTransfer.getData('columnId');
    const itemType = e.dataTransfer.getData('itemType');

    setColumnDragOverTargetId(null); // Limpa o feedback visual do alvo
    setDraggedColumnId(null); // Limpa o estado da coluna arrastada

    if (itemType === 'kanbanColumn' && sourceColumnId && sourceColumnId !== targetColumnId) {
      const currentEtapas = Array.isArray(etapas) ? [...etapas] : [];
      if (currentEtapas.length === 0) return;

      const sourceIndex = currentEtapas.findIndex(etapa => etapa.id === sourceColumnId);
      let targetIndex = currentEtapas.findIndex(etapa => etapa.id === targetColumnId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const [draggedItem] = currentEtapas.splice(sourceIndex, 1); // Remove o item arrastado
      
      // Se movendo para uma posição posterior, o targetIndex precisa ser ajustado se o source era antes
      if (sourceIndex < targetIndex) {
         // Não precisa de ajuste aqui, o splice já cuida disso se inserirmos em targetIndex
      }
      currentEtapas.splice(targetIndex, 0, draggedItem); // Insere na nova posição

      const etapasToUpdate = currentEtapas.map((etapa, index) => ({
        id: etapa.id,
        ordem: index, // A nova ordem é simplesmente o índice no array reordenado
      }));
      
      console.log("Reordenando etapas para:", etapasToUpdate);
      reorderEtapasMutation.mutate({ etapas: etapasToUpdate });
    }
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
      {/* Header da página ... (mantido como antes) ... */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Leads</h2>
          <p className="text-gray-600 mt-1">Acompanhe o progresso dos seus leads no funil de vendas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCreateEtapa}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus size={18} /> Nova Etapa
          </button>
          <button
            onClick={handleCreateLead}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Board do Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-200px)] items-start"> {/* items-start para alinhar colunas no topo */}
        {Array.isArray(etapas) && etapas
          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) // Garante a ordenação inicial das colunas
          .map((etapa: IKanbanColumn, index) => {
            const leadsDaEtapa = Array.isArray(leads)
              ? leads.filter(lead => lead.etapa_kanban_id === etapa.id)
              // TODO: Adicionar ordenação dos leads dentro da etapa se houver um campo 'ordem_na_etapa'
              // .sort((a, b) => (a.ordem_na_etapa || 0) - (b.ordem_na_etapa || 0))
              : [];
            const corDaEtapa = ETAPA_COLORS[index % ETAPA_COLORS.length];

            return (
              // Este div é o wrapper que se torna arrastável para a COLUNA
              <div
                key={etapa.id}
                draggable // Torna a coluna inteira arrastável
                onDragStart={(e) => handleColumnDragStart(e, etapa.id)}
                onDragEnd={handleColumnDragEnd} // Limpa estados de drag
                onDragOver={(e) => handleColumnDragOver(e, etapa.id)} // Permite que outras colunas sejam soltas aqui
                onDragLeave={handleColumnDragLeave} // Limpa feedback de alvo de drop
                onDrop={(e) => handleColumnDrop(e, etapa.id)} // Lida com o drop de outra coluna aqui
                // Adiciona uma alça visual para arrastar a coluna (opcional, pode ser o header da coluna)
                // Aqui, fazemos toda a div da coluna ser o "handle" de arraste
                className={`h-full cursor-grab ${draggedColumnId === etapa.id ? 'is-dragging-column' : ''}`}
              >
                <style>{`.is-dragging-column { opacity: 0.4; }`}</style>
                <KanbanColumnComponent
                  column={etapa}
                  leads={leadsDaEtapa}
                  corEtapa={corDaEtapa}
                  onEditLead={handleEditLead}
                  onDropLeadInColumn={handleDropLeadInColumn} // Passa o handler correto
                  onOpenHistory={handleOpenHistory}
                  onOpenChat={handleOpenChat}
                  onEditEtapa={() => handleEditEtapa(etapa)}
                  onDeleteEtapa={() => handleDeleteEtapa(etapa)}
                  isColumnDragOverTarget={columnDragOverTargetId === etapa.id && draggedColumnId !== etapa.id}
                />
              </div>
            );
        })}
        
        {(!Array.isArray(etapas) || etapas.length === 0) && (
           <div className="w-full flex items-center justify-center py-20"> {/* w-full para centralizar melhor */}
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

      {/* Modais ... (mesmos de antes) */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={selectedLead}
        etapas={Array.isArray(etapas) ? etapas : []}
        onSave={handleSaveLead as any}
        onOpenHistory={selectedLead ? () => handleOpenHistory(selectedLead) : undefined}
      />
      <ConsultasHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} lead={selectedLead} consultas={consultasLead} />
      <EtapaModal isOpen={isEtapaModalOpen} onClose={() => setIsEtapaModalOpen(false)} onSave={handleSaveEtapa} etapa={editingEtapa} etapasExistentes={Array.isArray(etapas) ? etapas : []} />
      <MoveLeadsModal 
        isOpen={isMoveLeadsModalOpen} 
        onClose={() => { setIsMoveLeadsModalOpen(false); setEtapaToDelete(null); }} 
        onConfirm={handleMoveLeadsAndDeleteEtapa} 
        etapaToDelete={etapaToDelete} 
        leadsCount={etapaToDelete?.leadsCount || 0} 
        etapasDisponiveis={Array.isArray(etapas) ? etapas.filter(e => e.id !== etapaToDelete?.id) : []} 
      />
    </div>
  );
};