// src/components/kanban/KanbanBoard.tsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
// Renomeado KanbanColumn importado para KanbanColumnComponent para evitar conflito com a interface
import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { ConsultasHistoryModal } from './ConsultasHistoryModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';
import { useSupabaseData } from '@/hooks/useSupabaseData'; // Hook central para buscar dados
import { useMoveLeadToStage, CreateLeadData } from '@/hooks/useLeadsData'; // Hook específico para mover leads
import { useUpdateEtapa, useDeleteEtapa, CreateEtapaData, Etapa } from '@/hooks/useEtapasData';
import { useClinicaOperations } from '@/hooks/useClinicaOperations';
import { useReorderEtapas } from '@/hooks/useEtapaReorder';
// Certifique-se de que a interface Lead e IKanbanColumn estão corretamente definidas e exportadas se necessário.
// Se elas já são exportadas por este arquivo, a importação delas mesmas não é necessária.

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
  // Estados para modais e seleção
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<IKanbanColumn | null>(null);
  const [consultasLead, setConsultasLead] = useState<any[]>([]);
  const [etapaToDelete, setEtapaToDelete] = useState<(IKanbanColumn & { leadsCount?: number }) | null>(null);
  const [isMoveLeadsModalOpen, setIsMoveLeadsModalOpen] = useState(false);

  // Estados para drag and drop de colunas
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [columnDragOverTargetId, setColumnDragOverTargetId] = useState<string | null>(null);

  // Hooks de dados e mutações do React Query
  const { etapas = [], leads = [], tags = [], loading } = useSupabaseData();
  const { createLead, createEtapa } = useClinicaOperations();
  const updateLeadMutation = useUpdateLead();
  const moveLeadMutation = useMoveLeadToStage(); // Hook para mover leads entre etapas
  const updateEtapaMutation = useUpdateEtapa();
  const deleteEtapaMutation = useDeleteEtapa();
  const reorderEtapasMutation = useReorderEtapas();

  // ... (outras funções como handleEditLead, handleCreateLead, handleSaveLead, etc. permanecem as mesmas) ...
  // Essas funções não são o foco principal do problema de D&D, mas são importantes para o funcionamento geral.
  // Certifique-se que handleSaveLead esteja passando corretamente 'etapa_kanban_id' para createLead.

  /**
   * Manipulador chamado quando um LeadCard é SOLTO em uma KanbanColumnComponent.
   * Esta função é crucial para a persistência da mudança de etapa do lead.
   */
  const handleDropLeadInColumn = async (leadId: string, fromColumnId: string, toColumnId: string) => {
    // Log inicial para rastrear a chamada da função e os parâmetros recebidos.
    console.log(`[KanbanBoard] 📦 handleDropLeadInColumn: Tentando mover lead...`, {
      leadId,
      fromColumnId,
      toColumnId
    });

    // Validações essenciais dos parâmetros.
    if (!leadId || !fromColumnId || !toColumnId) {
      console.error('[KanbanBoard] ❌ Erro em handleDropLeadInColumn: IDs inválidos ou ausentes.', { leadId, fromColumnId, toColumnId });
      // Poderia adicionar um toast.error aqui para informar o usuário sobre a falha interna.
      return;
    }

    // Se o lead foi solto na mesma coluna de onde veio, não faz nada.
    // (A lógica de reordenação de cards DENTRO da mesma coluna, se necessária, seria tratada aqui ou em KanbanColumn).
    if (fromColumnId === toColumnId) {
      console.log(`[KanbanBoard] ⚪️ Lead "${leadId}" solto na mesma coluna de origem ("${fromColumnId}"). Nenhuma atualização de etapa necessária.`);
      return;
    }

    // Busca informações do lead apenas para logging mais detalhado, se necessário.
    const leadParaMover = Array.isArray(leads) ? leads.find(l => l.id === leadId) : null;
    if (leadParaMover) {
      console.log(`[KanbanBoard] 📋 Detalhes do lead a ser movido: "${leadParaMover.nome}", ID: ${leadId}`);
    } else {
      console.warn(`[KanbanBoard] ⚠️ Lead com ID "${leadId}" não encontrado no estado local 'leads'. Continuando com a mutação.`);
    }
    
    try {
      // Log antes de chamar a mutação.
      console.log(`[KanbanBoard] 🚀 Executando mutação useMoveLeadToStage para mover lead "${leadId}" para etapa "${toColumnId}".`);
      
      // Chama a mutação para atualizar a etapa do lead no backend.
      // O hook useMoveLeadToStage (em useLeadsData.ts) é responsável por:
      // 1. Fazer a chamada API para o Supabase para atualizar o campo 'etapa_kanban_id' do lead.
      // 2. No 'onSuccess', invalidar a query 'leads' para que o React Query busque os dados atualizados.
      const result = await moveLeadMutation.mutateAsync({ 
        leadId, 
        etapaId: toColumnId 
      });
      
      // Log de sucesso da mutação.
      // Se este log aparecer, a atualização no backend (Supabase) provavelmente ocorreu.
      // O próximo passo é a invalidação do cache do React Query funcionar corretamente.
      console.log('[KanbanBoard] ✅ Mutação useMoveLeadToStage executada com sucesso. Resultado:', result);
      // Um toast de sucesso já deve ser disparado pelo próprio hook useMoveLeadToStage no seu onSuccess.

    } catch (error: any) {
      // Captura e loga qualquer erro que ocorra durante a execução da mutação.
      // O hook useMoveLeadToStage também tem seu próprio onError que deve disparar um toast.
      console.error('[KanbanBoard] ❌ Erro detalhado ao executar moveLeadMutation.mutateAsync:', {
        errorMessage: error.message,
        leadId,
        toColumnId,
        errorStack: error.stack
      });
      // Poderia adicionar um toast.error genérico aqui também, mas é melhor centralizar nos hooks.
      // alert(`Erro ao mover o lead: ${error.message}`); // Use toast para melhor UX
    }
  };
  
  // ... (resto das funções: handleOpenHistory, handleOpenChat, handleCreateEtapa, handleEditEtapa, handleSaveEtapa, handleDeleteEtapa, handleMoveLeadsAndDeleteEtapa)
  // ... (lógica de drag and drop para COLUNAS: handleColumnDragStart, handleColumnDragEnd, handleColumnDragOver, handleColumnDragLeave, handleColumnDrop)
  // ... (função convertEtapaToKanbanColumn)
  // ... (JSX de renderização, incluindo o mapeamento das colunas e a passagem de props)

  // =====================================================================================
  // MANTER O RESTANTE DO SEU CÓDIGO KANBANBOARD.TSX A PARTIR DAQUI
  // As funções abaixo são apenas para completar a estrutura, cole seu código original aqui.
  // =====================================================================================
  
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
      throw error; // Re-lança para que o EtapaModal possa tratar se necessário
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
  
  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.dataTransfer.setData('draggedColumnId', columnId);
    e.dataTransfer.setData('itemType', 'kanbanColumn');
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumnId(columnId);
    console.log(`[KanbanBoard] Iniciando drag da COLUNA ${columnId}`);
  };

  const handleColumnDragEnd = () => {
    console.log(`[KanbanBoard] Finalizando drag da COLUNA ${draggedColumnId}`);
    setDraggedColumnId(null);
    setColumnDragOverTargetId(null);
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    const itemType = e.dataTransfer.getData('itemType');
    const sourceColumnId = e.dataTransfer.getData('draggedColumnId');

    if (itemType === 'kanbanColumn' && sourceColumnId && sourceColumnId !== targetColumnId) {
      e.dataTransfer.dropEffect = 'move';
      if (columnDragOverTargetId !== targetColumnId) {
        // console.log(`[KanbanBoard] DragOver COLUNA ${sourceColumnId} sobre COLUNA ${targetColumnId}`);
        setColumnDragOverTargetId(targetColumnId);
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
      if (columnDragOverTargetId && sourceColumnId === targetColumnId) {
         setColumnDragOverTargetId(null); // Limpa se estiver sobre si mesma
      }
    }
  };
  
  const handleColumnDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        // console.log(`[KanbanBoard] DragLeave da COLUNA ${columnDragOverTargetId}`);
        setColumnDragOverTargetId(null);
    }
  };

// src/components/kanban/KanbanBoard.tsx

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    e.preventDefault();
    
    const sourceColumnId = e.dataTransfer.getData('draggedColumnId');
    const itemType = e.dataTransfer.getData('itemType');

    // Log inicial para verificar os dados recebidos do dataTransfer
    console.log('[KanbanBoard] 🟢 Drop de COLUNA detectado. Dados do evento:', { 
      sourceColumnId, 
      targetColumnId, // Este é o ID da coluna ONDE o drop ocorreu
      itemType,
      allTypesInDataTransfer: Array.from(e.dataTransfer.types)
    });

    // Limpa os estados visuais de drag
    setDraggedColumnId(null);
    setColumnDragOverTargetId(null);

    // Condições para processar o drop de uma coluna
    if (itemType === 'kanbanColumn' && sourceColumnId && targetColumnId && sourceColumnId !== targetColumnId) {
      console.log(`[KanbanBoard] Processando drop da coluna ID: ${sourceColumnId} para a posição da coluna ID: ${targetColumnId}`);

      // Cria uma cópia MUTÁVEL do array de etapas, já ordenado pela ordem atual.
      // Isso é importante para que os índices de splice e map sejam consistentes.
      const currentEtapasOrdenadas = Array.isArray(etapas) 
        ? [...etapas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)) 
        : [];

      if (currentEtapasOrdenadas.length === 0) {
        console.warn("[KanbanBoard] ⚠️ Não há etapas para reordenar.");
        return;
      }
      console.log("[KanbanBoard] Etapas atuais ordenadas:", JSON.parse(JSON.stringify(currentEtapasOrdenadas)));


      const sourceIndex = currentEtapasOrdenadas.findIndex(etapa => etapa.id === sourceColumnId);
      const targetIndex = currentEtapasOrdenadas.findIndex(etapa => etapa.id === targetColumnId);

      console.log('[KanbanBoard] Índices para reordenação:', { sourceIndex, targetIndex });

      if (sourceIndex === -1) {
        console.error(`[KanbanBoard] ❌ ERRO: Coluna de origem (ID: ${sourceColumnId}) não encontrada no array de etapas ordenadas. Abortando reordenação.`);
        return;
      }
      if (targetIndex === -1) {
        console.error(`[KanbanBoard] ❌ ERRO: Coluna de destino (ID: ${targetColumnId}) não encontrada no array de etapas ordenadas. Abortando reordenação.`);
        return;
      }

      // Remove o item arrastado da sua posição original
      const [draggedItemArray] = currentEtapasOrdenadas.splice(sourceIndex, 1);
      const draggedItem = draggedItemArray; // Atribui o primeiro elemento do array retornado por splice

      if (!draggedItem || typeof draggedItem.id === 'undefined') { // Verificação mais robusta
        console.error('[KanbanBoard] ❌ ERRO CRÍTICO: draggedItem é inválido ou não tem ID após o splice.', {draggedItem});
        // Potencialmente restaurar currentEtapasOrdenadas para o estado anterior se a operação falhar aqui
        return; 
      }
      console.log('[KanbanBoard] Item arrastado (draggedItem):', JSON.parse(JSON.stringify(draggedItem)));


      // Insere o item arrastado na nova posição (posição da coluna alvo)
      currentEtapasOrdenadas.splice(targetIndex, 0, draggedItem);
      console.log("[KanbanBoard] Etapas após reordenação local:", JSON.parse(JSON.stringify(currentEtapasOrdenadas)));


      // Mapeia o array reordenado para criar o payload de atualização,
      // atribuindo um novo índice de 'ordem' sequencial.
      const etapasToUpdate = currentEtapasOrdenadas.map((etapa, index) => {
        // Adiciona uma verificação para o caso de 'etapa' ser undefined (embora não devesse ser após as verificações anteriores)
        if (!etapa || typeof etapa.id === 'undefined') {
          console.error(`[KanbanBoard] ❌ ERRO no map: Etapa inválida no índice ${index}. Etapa:`, etapa);
          // Pode ser necessário decidir como lidar com este caso raro: pular, lançar erro, etc.
          // Por segurança, vamos retornar um objeto que não quebre, mas isso indica um problema anterior.
          return { id: `ERRO_ID_UNDEFINED_INDEX_${index}`, ordem: index, nome: "ERRO_NOME_ETAPA" }; // Ou filtrar este item antes de enviar para a mutação
        }
        return {
          id: etapa.id,
          nome: etapa.nome, // Incluir nome para log/debug, a mutação só deve precisar de id e ordem
          ordem: index, 
        };
      });
      
      // Filtrar quaisquer itens problemáticos antes de enviar para a mutação
      const validEtapasToUpdate = etapasToUpdate.filter(etapa => !etapa.id.startsWith("ERRO_ID_UNDEFINED"));
      if (validEtapasToUpdate.length !== etapasToUpdate.length) {
          console.warn("[KanbanBoard] ⚠️ Algumas etapas foram filtradas devido a IDs inválidos antes de enviar para a mutação reorderEtapas.");
      }


      if (validEtapasToUpdate.length > 0) {
        console.log('[KanbanBoard] 🔄 Enviando para reorderEtapasMutation:', JSON.parse(JSON.stringify(validEtapasToUpdate.map(e => ({id: e.id, ordem: e.ordem})))));
        reorderEtapasMutation.mutate({ etapas: validEtapasToUpdate.map(e => ({id: e.id, ordem: e.ordem})) });
      } else if (etapasToUpdate.length > 0) { // Se havia etapas mas todas foram inválidas
        console.error("[KanbanBoard] ❌ Nenhuma etapa válida para atualizar após o processamento do map.");
      }

    } else {
      console.log('[KanbanBoard] Drop de coluna ignorado: condições não atendidas (itemType, IDs, ou mesma coluna).', { itemType, sourceColumnId, targetColumnId });
    }
  };
  
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
                onDragStart={(e) => handleColumnDragStart(e, etapa.id)}
                onDragEnd={handleColumnDragEnd}
                onDragOver={(e) => handleColumnDragOver(e, etapa.id)}
                onDragLeave={handleColumnDragLeave}
                onDrop={(e) => handleColumnDrop(e, etapa.id)}
                className={`h-full flex flex-col transition-all duration-200 cursor-grab 
                            ${draggedColumnId === etapa.id ? 'opacity-40 scale-95' : ''}
                            ${columnDragOverTargetId === etapa.id && draggedColumnId !== etapa.id ? 'outline-2 outline-blue-500 outline-dashed rounded-xl' : ''} 
                          `}
                data-etapa-draggable-id={etapa.id}
              >
                <KanbanColumnComponent
                  column={kanbanColumn}
                  leads={leadsDaEtapa}
                  corEtapa={corDaEtapa}
                  onEditLead={handleEditLead}
                  onDropLeadInColumn={handleDropLeadInColumn}
                  onOpenHistory={handleOpenHistory}
                  onOpenChat={handleOpenChat}
                  onEditEtapa={() => handleEditEtapa(kanbanColumn)}
                  onDeleteEtapa={() => handleDeleteEtapa(kanbanColumn)}
                  isColumnDragOverTarget={columnDragOverTargetId === etapa.id && draggedColumnId !== etapa.id && !!draggedColumnId}
                />
              </div>
            );
        })}
        
        {(!Array.isArray(etapas) || etapas.length === 0) && (
          <div className="w-full flex items-center justify-center py-20">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma etapa criada</h3>
              <p className="text-gray-600 mb-4">Crie sua primeira etapa para começar a organizar seus leads.</p>
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

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={selectedLead}
        etapas={Array.isArray(etapas) ? etapas : []}
        onSave={handleSaveLead as any}
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