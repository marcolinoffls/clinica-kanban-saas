// src/components/kanban/KanbanBoard.tsx
import React, { useState, useEffect } from 'react'; // Adicionado React e useEffect
import { Plus } from 'lucide-react';
import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn'; // Renomeado para evitar conflito de nome
import { LeadModal } from './LeadModal';
import { ConsultasHistoryModal } from './ConsultasHistoryModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useUpdateLead, useMoveLeadToStage, CreateLeadData } from '@/hooks/useLeadsData'; // Importado CreateLeadData
import { useUpdateEtapa, useDeleteEtapa, CreateEtapaData } from '@/hooks/useEtapasData'; // Importado CreateEtapaData
import { useClinicaOperations } from '@/hooks/useClinicaOperations';
// import { useReorderEtapas } from '@/hooks/useEtapaReorder'; // Comentado pois o drag de etapas foi removido temporariamente

/**
 * Componente principal do Kanban com funcionalidades aprimoradas
 * * Funcionalidades Atuais:
 * - Movimentação de cards de lead entre colunas por drag and drop.
 * - Colunas (etapas) com cores distintivas.
 * - CRUD de Leads e Etapas.
 * - Verificação de leads antes de deletar etapas e movimentação automática.
 * - Design moderno e responsivo.
 *
 * Funcionalidade Temporariamente Removida (para focar na UX do card):
 * - Reordenação de etapas por drag and drop.
 */

// Tipos TypeScript (já exportados, o que é bom)
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
  // Adicionando 'ordem' que pode vir de etapas, para consistência se usado em 'any'
  ordem?: number;
}

// Interface para as colunas do Kanban, representando as etapas
export interface IKanbanColumn { // Renomeado para IKanbanColumn para clareza
  id: string;
  title: string; // Nome da etapa
  leadIds: string[]; // IDs dos leads pertencentes a esta etapa/coluna
  // Adicionando 'ordem' que pode vir de etapas, para consistência se usado em 'any'
  ordem?: number;
  nome?: string; // Para consistência com o objeto etapa original
}

// Props do componente KanbanBoard
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
  const [editingEtapa, setEditingEtapa] = useState<IKanbanColumn | null>(null); // Tipo mais específico
  const [consultasLead, setConsultasLead] = useState<any[]>([]); // Manter any se a estrutura não for definida
  const [etapaToDelete, setEtapaToDelete] = useState<(IKanbanColumn & { leadsCount?: number }) | null>(null); // Tipo mais específico
  const [isMoveLeadsModalOpen, setIsMoveLeadsModalOpen] = useState(false);
  // const [draggedEtapa, setDraggedEtapa] = useState<string | null>(null); // Comentado - drag de etapa removido

  // Hook principal para dados do Supabase. Garante que etapas e leads sejam arrays.
  const { etapas = [], leads = [], tags = [], loading } = useSupabaseData();

  // Hook para operações da clínica (criar lead, criar etapa)
  const { createLead, createEtapa } = useClinicaOperations();

  // Hooks especializados para mutações
  const updateLeadMutation = useUpdateLead();
  const moveLeadMutation = useMoveLeadToStage();
  const updateEtapaMutation = useUpdateEtapa();
  const deleteEtapaMutation = useDeleteEtapa();
  // const reorderEtapasMutation = useReorderEtapas(); // Comentado

  // Função para abrir modal de edição de lead
  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  // Função para criar novo lead
  const handleCreateLead = () => {
    setSelectedLead(null); // Limpa o lead selecionado para indicar criação
    setIsLeadModalOpen(true);
  };

  // Função para salvar lead (criar ou editar)
  // Ajustada para usar CreateLeadData (que omite clinica_id) do useClinicaOperations
  const handleSaveLead = async (leadData: Omit<CreateLeadData, 'clinica_id'> & Partial<Lead> & { etapa_kanban_id?: string }) => {
    try {
      if (!leadData.nome?.trim()) {
        throw new Error('Nome do lead é obrigatório');
      }

      if (selectedLead && selectedLead.id) {
        // Editando lead existente: usa o ID do selectedLead
        await updateLeadMutation.mutateAsync({ id: selectedLead.id, ...leadData });
      } else {
        // Criando novo lead: usa createLead do useClinicaOperations
        // O clinica_id será adicionado automaticamente pelo hook useClinicaOperations
        await createLead({
          nome: leadData.nome, // nome é obrigatório em CreateLeadData
          telefone: leadData.telefone || undefined,
          email: leadData.email || undefined,
          etapa_kanban_id: leadData.etapa_kanban_id || undefined, // Passa a etapa selecionada no modal
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

  // Função para mover card de lead entre colunas (etapas)
  const handleMoveCard = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    if (fromColumnId === toColumnId) return; // Não faz nada se soltar na mesma coluna

    console.log(`Movendo lead ${leadId} da coluna ${fromColumnId} para ${toColumnId}`);
    try {
      await moveLeadMutation.mutateAsync({ leadId, etapaId: toColumnId });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      alert('Erro ao mover lead. Tente novamente.');
    }
  };

  // Função para abrir histórico de consultas do lead
  const handleOpenHistory = async (lead: Lead) => {
    try {
      // TODO: Implementar busca real de consultas associadas ao lead.id
      const fetchedConsultas: any[] = []; // Simula busca
      setConsultasLead(fetchedConsultas);
      setSelectedLead(lead);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar histórico de consultas:', error);
      alert('Erro ao carregar histórico. Tente novamente.');
    }
  };

  // Função para navegar para o chat com o lead
  const handleOpenChat = (lead: Lead) => {
    if (onNavigateToChat) {
      onNavigateToChat(lead.id);
    } else {
      console.warn('onNavigateToChat não foi fornecido para KanbanBoard');
    }
  };

  // Função para iniciar criação de nova etapa
  const handleCreateEtapa = () => {
    setEditingEtapa(null); // Limpa etapa em edição para indicar criação
    setIsEtapaModalOpen(true);
  };

  // Função para iniciar edição de etapa existente
  const handleEditEtapa = (etapa: IKanbanColumn) => { // Usar IKanbanColumn ou tipo da etapa
    setEditingEtapa(etapa);
    setIsEtapaModalOpen(true);
  };

  // Função para salvar etapa (criar ou editar)
  const handleSaveEtapa = async (nome: string) => {
    try {
      if (editingEtapa && editingEtapa.id) {
        // Editando etapa existente
        await updateEtapaMutation.mutateAsync({ id: editingEtapa.id, nome });
      } else {
        // Criando nova etapa
        // Garante que 'etapas' é um array antes de usar map e Math.max
        const currentEtapas = Array.isArray(etapas) ? etapas : [];
        const nextOrder = Math.max(...currentEtapas.map(e => e.ordem || 0), -1) + 1; // -1 para caso de array vazio
        
        // Usa createEtapa do useClinicaOperations (que adiciona clinica_id)
        await createEtapa({ nome, ordem: nextOrder } as Omit<CreateEtapaData, 'clinica_id'>);
      }
      setIsEtapaModalOpen(false);
      setEditingEtapa(null); // Limpa etapa em edição
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      // O modal EtapaModal já trata a exibição de erros, então apenas relançamos.
      throw error;
    }
  };

  // Função para deletar uma etapa
  const handleDeleteEtapa = async (etapaParaDeletar: IKanbanColumn) => { // Usar IKanbanColumn ou tipo da etapa
    // Garante que 'leads' é um array
    const currentLeads = Array.isArray(leads) ? leads : [];
    const leadsNaEtapa = currentLeads.filter(lead => lead.etapa_kanban_id === etapaParaDeletar.id);

    if (leadsNaEtapa.length > 0) {
      // Se houver leads, abrir modal para que o usuário escolha para onde movê-los
      setEtapaToDelete({ ...etapaParaDeletar, leadsCount: leadsNaEtapa.length });
      setIsMoveLeadsModalOpen(true);
    } else {
      // Se não houver leads, confirmar e deletar diretamente
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

  // Função chamada após o usuário escolher a etapa de destino no MoveLeadsModal
  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string) => {
    if (!etapaToDelete || !etapaToDelete.id) return;

    try {
      const currentLeads = Array.isArray(leads) ? leads : [];
      const leadsToMove = currentLeads.filter(lead => lead.etapa_kanban_id === etapaToDelete.id);

      // Mover todos os leads para a nova etapa
      const movePromises = leadsToMove.map(lead =>
        moveLeadMutation.mutateAsync({ leadId: lead.id, etapaId: targetEtapaId })
      );
      await Promise.all(movePromises);

      // Deletar a etapa original
      await deleteEtapaMutation.mutateAsync(etapaToDelete.id);

      setEtapaToDelete(null); // Limpa o estado
      setIsMoveLeadsModalOpen(false); // Fecha o modal
    } catch (error) {
      console.error('Erro ao mover leads e deletar etapa:', error);
      // O modal pode ter seu próprio tratamento de erro, ou podemos alertar aqui
      alert('Ocorreu um erro ao mover os leads e deletar a etapa.');
    }
  };

  // Funções para drag and drop de ETAPAS (colunas) - TEMPORARIAMENTE DESABILITADAS
  // const handleEtapaDragStart = (e: React.DragEvent, etapaId: string) => {
  //   // e.dataTransfer.setData('etapaId', etapaId); // Para identificar o que está sendo arrastado
  //   // setDraggedEtapa(etapaId);
  //   // e.dataTransfer.effectAllowed = 'move';
  // };

  // const handleEtapaDragOver = (e: React.DragEvent) => {
  //   // e.preventDefault(); // Necessário para permitir o drop
  //   // e.dataTransfer.dropEffect = 'move';
  // };

  // const handleEtapaDrop = (e: React.DragEvent, targetEtapaId: string) => {
  //   // e.preventDefault();
  //   // const draggedEtapaId = draggedEtapa; // Ou e.dataTransfer.getData('etapaId');

  //   // if (!draggedEtapaId || draggedEtapaId === targetEtapaId) {
  //   //   setDraggedEtapa(null);
  //   //   return;
  //   // }

  //   // if (!Array.isArray(etapas) || etapas.length === 0) {
  //   //   setDraggedEtapa(null);
  //   //   return;
  //   // }

  //   // const draggedIndex = etapas.findIndex(etapa => etapa.id === draggedEtapaId);
  //   // const targetIndex = etapas.findIndex(etapa => etapa.id === targetEtapaId);

  //   // if (draggedIndex === -1 || targetIndex === -1) {
  //   //   setDraggedEtapa(null);
  //   //   return;
  //   // }

  //   // const newEtapas = [...etapas];
  //   // const [draggedItem] = newEtapas.splice(draggedIndex, 1);
  //   // newEtapas.splice(targetIndex, 0, draggedItem);

  //   // const etapasToUpdate = newEtapas.map((etapa, index) => ({
  //   //   id: etapa.id,
  //   //   ordem: index, // Atualiza a ordem baseada na nova posição no array
  //   // }));

  //   // reorderEtapasMutation.mutate({ etapas: etapasToUpdate });
  //   // setDraggedEtapa(null);
  // };


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

  // Renderização do componente
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

      {/* Board do Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
        {/* Garante que 'etapas' é um array antes de mapear */}
        {Array.isArray(etapas) && etapas.map((etapa, index) => {
          // Garante que 'leads' é um array antes de filtrar
          const leadsDaEtapa = Array.isArray(leads)
            ? leads.filter(lead => lead.etapa_kanban_id === etapa.id)
            : [];
          const corDaEtapa = ETAPA_COLORS[index % ETAPA_COLORS.length];

          return (
            // O div abaixo era usado para o drag da coluna. Como essa funcionalidade foi removida/despriorizada,
            // ele agora serve apenas como um container para a key e estilo.
            // Se for reativar o drag de colunas, os handlers `draggable`, `onDragStart`, `onDragOver`, `onDrop` para colunas iriam aqui.
            <div
              key={etapa.id}
              // className={`transition-all duration-200 ${
              //   draggedEtapa === etapa.id ? 'opacity-50 scale-95' : ''
              // }`}
            >
              <KanbanColumnComponent
                // A prop 'column' agora é do tipo IKanbanColumn
                column={{
                  id: etapa.id,
                  title: etapa.nome, // O título da coluna é o nome da etapa
                  leadIds: leadsDaEtapa.map(l => l.id) // Passa os IDs dos leads desta etapa
                }}
                leads={leadsDaEtapa} // Passa os objetos de lead completos para a coluna
                corEtapa={corDaEtapa}
                onEditLead={handleEditLead}
                onMoveCard={handleMoveCard} // Para mover cards de lead
                onOpenHistory={handleOpenHistory}
                onOpenChat={handleOpenChat}
                onEditEtapa={() => handleEditEtapa(etapa as IKanbanColumn)} // Passa o objeto etapa para edição
                onDeleteEtapa={() => handleDeleteEtapa(etapa as IKanbanColumn)} // Passa o objeto etapa para deleção
              />
            </div>
          );
        })}

        {/* Mensagem para quando não há etapas criadas */}
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
        etapas={Array.isArray(etapas) ? etapas : []} // Garante que etapas seja um array
        // A prop 'onSave' do LeadModal espera um tipo compatível com handleSaveLead
        onSave={handleSaveLead as any} // Usar 'as any' temporariamente se a tipagem exata for complexa de alinhar imediatamente
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