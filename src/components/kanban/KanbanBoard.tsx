
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { LeadModal } from './LeadModal';
import { ConsultasHistoryModal } from './ConsultasHistoryModal';
import { EtapaModal } from './EtapaModal';
import { useSupabaseData } from '@/hooks/useSupabaseData';

/**
 * Componente principal do Kanban integrado com Supabase
 * 
 * Melhorias implementadas:
 * - Persistência automática da posição dos cards
 * - Adição de novas etapas dinamicamente
 * - Edição segura de nomes das etapas
 * - Modal de histórico de consultas com LTV
 * - Validação de dados antes do envio ao Supabase
 * 
 * Integração com backend:
 * - Dados salvos no Supabase em tempo real
 * - Políticas RLS para segurança
 * - Triggers de validação no banco
 */

// Tipos TypeScript corrigidos para compatibilidade
export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  anotacoes?: string;
  etapa_kanban_id: string;
  tag_id?: string;
  ltv?: number;
  data_ultimo_contato?: string;
  created_at: string;
  updated_at: string;
  // Campos gerados para compatibilidade
  name?: string;
  phone?: string;
  notes?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  leadIds: string[];
}

export const KanbanBoard = () => {
  // Estados do componente
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<any>(null);
  const [consultasLead, setConsultasLead] = useState<any[]>([]);

  // Hook personalizado para dados do Supabase
  const {
    etapas,
    leads,
    tags,
    loading,
    moverLead,
    criarEtapa,
    editarEtapa,
    salvarLead,
    buscarConsultasLead
  } = useSupabaseData();

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
  const handleSaveLead = async (leadData: Partial<Lead>) => {
    try {
      // Validação local antes de enviar para o Supabase
      if (!leadData.nome?.trim()) {
        throw new Error('Nome do lead é obrigatório');
      }
      if (!leadData.telefone?.trim()) {
        throw new Error('Telefone do lead é obrigatório');
      }

      await salvarLead(leadData);
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
      await moverLead(leadId, toEtapa);
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      alert('Erro ao mover lead. Tente novamente.');
    }
  };

  // Função para abrir histórico de consultas
  const handleOpenHistory = async (lead: Lead) => {
    try {
      const consultas = await buscarConsultasLead(lead.id);
      setConsultasLead(consultas);
      setSelectedLead(lead);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
      alert('Erro ao carregar histórico. Tente novamente.');
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

  // Função para salvar etapa com validação extra para etapas padrão
  const handleSaveEtapa = async (nome: string) => {
    try {
      // Lista de etapas padrão que precisam de confirmação extra
      const etapasPadrao = ['Novo Lead', 'Em Atendimento', 'Em Negociação', 'Agendado'];
      
      if (editingEtapa && etapasPadrao.includes(editingEtapa.nome)) {
        const confirmacao = confirm(
          `Você está editando uma etapa padrão "${editingEtapa.nome}". Tem certeza que deseja continuar?`
        );
        if (!confirmacao) return;
      }

      if (editingEtapa) {
        await editarEtapa(editingEtapa.id, nome);
      } else {
        await criarEtapa(nome);
      }
      setIsEtapaModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      throw error; // Propagar erro para o modal
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciamento de Leads
          </h2>
          <p className="text-gray-600 mt-1">
            Acompanhe o progresso dos seus leads no funil de vendas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCreateEtapa}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
      <div className="flex gap-6 h-full overflow-x-auto pb-6">
        {etapas.map((etapa) => {
          // Filtrar leads desta etapa
          const leadsEtapa = leads.filter(lead => lead.etapa_kanban_id === etapa.id);
          
          return (
            <KanbanColumn
              key={etapa.id}
              column={{
                id: etapa.id,
                title: etapa.nome,
                leadIds: leadsEtapa.map(l => l.id)
              }}
              leads={leadsEtapa}
              onEditLead={handleEditLead}
              onMoveCard={handleMoveCard}
              onOpenHistory={handleOpenHistory}
              onEditEtapa={() => handleEditEtapa(etapa)}
            />
          );
        })}
        
        {/* Mensagem quando não há etapas */}
        {etapas.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
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

      {/* Modal para edição/criação de leads */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={selectedLead}
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
    </div>
  );
};
