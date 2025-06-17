
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Settings, Search, Filter, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Imports dos hooks personalizados
import { useLeadsData, Lead } from '@/hooks/useLeadsData';
import { useEtapasKanban } from '@/hooks/useEtapasKanban';
import { useKanbanLeadActions } from '@/hooks/useKanbanLeadActions';
import { useKanbanEtapaActions } from '@/hooks/useKanbanEtapaActions';
import { useKanbanModals } from '@/hooks/useKanbanModals';

// Imports dos componentes modais
import { KanbanColumn } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { EtapaModal } from './EtapaModal';
import { MoveLeadsModal } from './MoveLeadsModal';

/**
 * Interface para definir a estrutura de uma etapa/coluna do Kanban
 */
interface IKanbanColumn {
  id: string;
  nome: string;
  title?: string;
  cor?: string;
  ordem?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para as propriedades das etapas (alias para IKanbanColumn)
 */
interface Etapa extends IKanbanColumn {}

/**
 * Componente principal do Kanban Board
 * 
 * Funcionalidades:
 * - Visualização de leads organizados por etapas em colunas
 * - Drag & drop para mover leads entre etapas
 * - Criação, edição e exclusão de leads
 * - Criação, edição e exclusão de etapas
 * - Busca e filtros de leads
 * - Modais para gerenciamento de dados
 */
const KanbanBoard: React.FC = () => {
  // =================================================================
  // ESTADOS LOCAIS
  // =================================================================
  
  /** Estado para controlar se está arrastando elementos */
  const [isDragging, setIsDragging] = useState(false);
  
  /** Estado para o termo de busca */
  const [searchTerm, setSearchTerm] = useState('');
  
  /** Estado para o filtro selecionado */
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // =================================================================
  // HOOKS PERSONALIZADOS
  // =================================================================
  
  /** Hook para buscar dados dos leads */
  const { 
    leads = [], 
    loading: isLoadingLeads, 
    error: leadsError 
  } = useLeadsData();
  
  /** Hook para buscar dados das etapas do kanban */
  const { 
    data: etapas = [], 
    isLoading: isLoadingEtapas, 
    error: etapasError 
  } = useEtapasKanban();
  
  /** Hook para ações relacionadas aos leads (salvar, deletar, mover) */
  const leadActions = useKanbanLeadActions();
  
  /** Hook para ações relacionadas às etapas (criar, editar, deletar) */
  const etapaActions = useKanbanEtapaActions();
  
  /** Hook para gerenciar todos os modais do kanban */
  const modalActions = useKanbanModals();

  // =================================================================
  // EFEITOS
  // =================================================================
  
  /**
   * Efeito para logar erros quando ocorrerem
   */
  useEffect(() => {
    if (leadsError) {
      console.error('❌ Erro ao carregar leads:', leadsError);
      toast.error('Erro ao carregar leads');
    }
    if (etapasError) {
      console.error('❌ Erro ao carregar etapas:', etapasError);
      toast.error('Erro ao carregar etapas');
    }
  }, [leadsError, etapasError]);

  /**
   * Efeito para debug - logar dados carregados
   */
  useEffect(() => {
    console.log('🔍 Leads carregados:', leads);
    console.log('🔍 Etapas carregadas:', etapas);
  }, [leads, etapas]);

  // =================================================================
  // FUNÇÕES AUXILIARES
  // =================================================================
  
  /**
   * Filtra os leads baseado no termo de busca e filtro selecionado
   */
  const getFilteredLeads = (): Lead[] => {
    let filtered = leads;
    
    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.telefone?.includes(searchTerm) ||
        lead.servico_interesse?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Aplicar filtros específicos
    switch (selectedFilter) {
      case 'recent':
        // Leads dos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(lead => 
          new Date(lead.created_at || '') >= sevenDaysAgo
        );
        break;
      case 'whatsapp':
        // Leads que vieram do WhatsApp
        filtered = filtered.filter(lead => 
          lead.origem_lead?.toLowerCase().includes('whatsapp')
        );
        break;
      case 'hot':
        // Leads quentes (critério: têm telefone e interesse definido)
        filtered = filtered.filter(lead => 
          lead.telefone && lead.servico_interesse
        );
        break;
      default:
        // 'all' - não aplicar filtro adicional
        break;
    }
    
    return filtered;
  };

  /**
   * Obtém os leads de uma etapa específica
   */
  const getLeadsForEtapa = (etapaId: string): Lead[] => {
    return getFilteredLeads().filter(lead => lead.etapa_kanban_id === etapaId);
  };

  // =================================================================
  // HANDLERS DE DRAG & DROP
  // =================================================================
  
  /**
   * Handler para quando o drag inicia
   */
  const handleOnDragStart = () => {
    console.log('🔄 Iniciando drag');
    setIsDragging(true);
  };

  /**
   * Handler para quando o drag termina
   */
  const handleOnDragEnd = async (result: any) => {
    console.log('🔄 Finalizando drag:', result);
    setIsDragging(false);
    
    const { destination, source, draggableId } = result;
    
    // Se não foi dropado em lugar válido, cancelar
    if (!destination) {
      console.log('❌ Drop cancelado - destino inválido');
      return;
    }
    
    // Se foi dropado no mesmo lugar, cancelar
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('❌ Drop cancelado - mesmo lugar');
      return;
    }
    
    try {
      // Buscar o lead que está sendo movido
      const leadId = draggableId;
      const fromEtapaId = source.droppableId;
      const toEtapaId = destination.droppableId;
      
      console.log('🔄 Movendo lead:', leadId, 'de', fromEtapaId, 'para', toEtapaId);
      
      // Usar a função do hook para mover o lead
      await leadActions.handleDropLeadInColumn(leadId, fromEtapaId, toEtapaId);
      
      console.log('✅ Lead movido com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao mover lead:', error);
      toast.error('Erro ao mover lead');
    }
  };

  // =================================================================
  // HANDLERS DE AÇÕES
  // =================================================================
  
  /**
   * Handler para criar novo lead
   */
  const handleCreateLead = (etapaId?: string) => {
    console.log('➕ Criando novo lead para etapa:', etapaId);
    modalActions.openCreateLeadModal();
  };

  /**
   * Handler para editar lead existente
   */
  const handleEditLead = (lead: Lead) => {
    console.log('✏️ Editando lead:', lead.id);
    modalActions.openEditLeadModal(lead);
  };

  /**
   * Handler para deletar lead
   */
  const handleDeleteLead = async (leadId: string) => {
    console.log('🗑️ Deletando lead:', leadId);
    try {
      await leadActions.handleDeleteLead(leadId);
      console.log('✅ Lead deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar lead:', error);
    }
  };

  /**
   * Handler para salvar lead (criar ou editar)
   */
  const handleSaveLead = async (leadData: Partial<Lead>) => {
    console.log('💾 Salvando lead:', leadData);
    try {
      await leadActions.handleSaveLead(leadData, modalActions.selectedLead);
      modalActions.closeLeadModal();
      console.log('✅ Lead salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar lead:', error);
    }
  };

  /**
   * Handler para criar nova etapa
   */
  const handleCreateEtapa = () => {
    console.log('➕ Criando nova etapa');
    modalActions.openCreateEtapaModal();
  };

  /**
   * Handler para editar etapa existente
   */
  const handleEditEtapa = (etapa: Etapa) => {
    console.log('✏️ Editando etapa:', etapa.id);
    modalActions.openEditEtapaModal(etapa);
  };

  /**
   * Handler para salvar etapa (criar ou editar)
   */
  const handleSaveEtapa = async (nome: string) => {
    console.log('💾 Salvando etapa:', nome);
    try {
      await etapaActions.handleSaveEtapa(nome, modalActions.editingEtapa, etapas);
      modalActions.closeEtapaModal();
      console.log('✅ Etapa salva com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar etapa:', error);
    }
  };

  /**
   * Handler para deletar etapa
   */
  const handleDeleteEtapa = async (etapa: Etapa) => {
    console.log('🗑️ Deletando etapa:', etapa.id);
    try {
      const result = await etapaActions.handleDeleteEtapa(etapa, leads);
      
      if (result.needsMoveLeads) {
        // Se precisa mover leads, abrir modal
        modalActions.openMoveLeadsModal(result.etapaToDelete, result.etapaToDelete.leadsCount || 0);
      } else {
        console.log('✅ Etapa deletada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar etapa:', error);
    }
  };

  /**
   * Handler para mover leads e deletar etapa
   */
  const handleMoveLeadsAndDeleteEtapa = async (targetEtapaId: string) => {
    console.log('🔄 Movendo leads e deletando etapa para:', targetEtapaId);
    try {
      await etapaActions.handleMoveLeadsAndDeleteEtapa(
        targetEtapaId, 
        modalActions.etapaToDelete, 
        leads
      );
      modalActions.closeMoveLeadsModal();
      console.log('✅ Leads movidos e etapa deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao mover leads e deletar etapa:', error);
    }
  };

  // =================================================================
  // LOADING E ERROR STATES
  // =================================================================
  
  if (isLoadingLeads || isLoadingEtapas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Kanban...</p>
        </div>
      </div>
    );
  }

  if (leadsError || etapasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ Erro ao carregar dados do Kanban</p>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // =================================================================
  // RENDER DO COMPONENTE
  // =================================================================
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ========================================= */}
      {/* HEADER COM CONTROLES E FILTROS */}
      {/* ========================================= */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Título */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kanban</h1>
            <p className="text-gray-600">
              {getFilteredLeads().length} leads • {etapas.length} etapas
            </p>
          </div>
          
          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleCreateLead()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
            
            <Button
              onClick={handleCreateEtapa}
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              Nova Etapa
            </Button>
          </div>
        </div>
        
        {/* Controles de busca e filtro */}
        <div className="flex items-center gap-4">
          {/* Campo de busca */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Dropdown de filtros */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {selectedFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setSelectedFilter('all')}
                className={selectedFilter === 'all' ? 'bg-blue-50' : ''}
              >
                Todos os leads
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSelectedFilter('recent')}
                className={selectedFilter === 'recent' ? 'bg-blue-50' : ''}
              >
                Últimos 7 dias
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSelectedFilter('whatsapp')}
                className={selectedFilter === 'whatsapp' ? 'bg-blue-50' : ''}
              >
                Do WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSelectedFilter('hot')}
                className={selectedFilter === 'hot' ? 'bg-blue-50' : ''}
              >
                Leads quentes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ========================================= */}
      {/* BOARD DO KANBAN */}
      {/* ========================================= */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext
          onDragStart={handleOnDragStart}
          onDragEnd={handleOnDragEnd}
        >
          <div className="h-full overflow-x-auto">
            <div className="flex h-full min-w-max gap-6 p-6">
              {/* Renderizar cada etapa como uma coluna */}
              {etapas
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .map((etapa) => {
                  const leadsEtapa = getLeadsForEtapa(etapa.id);
                  
                  return (
                    <div key={etapa.id} className="flex-shrink-0 w-80">
                      <Droppable droppableId={etapa.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="h-full"
                          >
                            <KanbanColumn
                              column={etapa}
                              leads={leadsEtapa}
                              corEtapa={etapa.cor || 'bg-blue-500'}
                              isDragging={isDragging}
                              isDropping={snapshot.isDraggingOver}
                              
                              // Handlers para ações de lead
                              onEditLead={handleEditLead}
                              onDropLeadInColumn={leadActions.handleDropLeadInColumn}
                              onOpenHistory={(lead) => modalActions.openHistoryModal(lead, [])}
                              onOpenChat={leadActions.handleOpenChat}
                              
                              // Handlers para ações de etapa
                              onEditEtapa={() => handleEditEtapa(etapa)}
                              onDeleteEtapa={() => handleDeleteEtapa(etapa)}
                              onAddLead={() => handleCreateLead(etapa.id)}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* ========================================= */}
      {/* MODAIS */}
      {/* ========================================= */}
      
      {/* Modal para criar/editar lead */}
      <LeadModal
        isOpen={modalActions.isLeadModalOpen}
        onClose={modalActions.closeLeadModal}
        lead={modalActions.selectedLead}
        etapas={etapas}
        onSave={handleSaveLead}
      />

      {/* Modal para visualizar histórico do lead */}
      {modalActions.isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Histórico - {modalActions.selectedLead?.nome}
              </h3>
              <Button 
                variant="ghost" 
                onClick={modalActions.closeHistoryModal}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {modalActions.consultasLead.length > 0 ? (
                modalActions.consultasLead.map((consulta, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium">{consulta.tipo || 'Consulta'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(consulta.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    {consulta.observacoes && (
                      <p className="text-sm mt-1">{consulta.observacoes}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Nenhum histórico encontrado para este lead.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para criar/editar etapa */}
      <EtapaModal
        isOpen={modalActions.isEtapaModalOpen}
        onClose={modalActions.closeEtapaModal}
        etapa={modalActions.editingEtapa}
        etapasExistentes={etapas}
        onSave={handleSaveEtapa}
      />

      {/* Modal para mover leads antes de deletar etapa */}
      <MoveLeadsModal
        isOpen={modalActions.isMoveLeadsModalOpen}
        onClose={modalActions.closeMoveLeadsModal}
        onConfirm={handleMoveLeadsAndDeleteEtapa}
        etapaToDelete={modalActions.etapaToDelete}
        leadsCount={
          modalActions.etapaToDelete 
            ? getLeadsForEtapa(modalActions.etapaToDelete.id).length 
            : 0
        }
        etapasDisponiveis={etapas.filter(e => e.id !== modalActions.etapaToDelete?.id)}
      />
    </div>
  );
};

export default KanbanBoard;
