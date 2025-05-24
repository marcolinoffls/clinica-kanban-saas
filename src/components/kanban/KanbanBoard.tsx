
import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { LeadCard } from './LeadCard';
import { LeadModal } from './LeadModal';

/**
 * Componente principal do Kanban para gerenciamento de leads
 * 
 * Funcionalidades:
 * - Exibe leads organizados em colunas (etapas do funil)
 * - Permite drag and drop entre as etapas
 * - Modal para edição de leads
 * - Adição de novas etapas dinamicamente
 * 
 * Estados gerenciados:
 * - leads: array com todos os leads
 * - columns: colunas do kanban (etapas)
 * - selectedLead: lead selecionado para edição
 * - isModalOpen: controle do modal de edição
 */

// Tipos TypeScript para tipagem segura
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  stage: string;
  tagId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  title: string;
  leadIds: string[];
}

export const KanbanBoard = () => {
  // Estados do componente
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dados mockados para demonstração (em produção viriam do Supabase)
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'Maria Silva',
      phone: '(11) 99999-9999',
      email: 'maria@email.com',
      notes: 'Interessada em implante',
      stage: 'waiting',
      tagId: 'implante',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'João Santos',
      phone: '(11) 88888-8888',
      email: 'joao@email.com',
      notes: 'Consulta de rotina',
      stage: 'attending',
      tagId: 'consulta',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Colunas padrão do kanban (podem ser customizadas pelo usuário)
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'waiting',
      title: 'Aguardando Atendimento',
      leadIds: ['1']
    },
    {
      id: 'attending',
      title: 'Em Atendimento',
      leadIds: ['2']
    },
    {
      id: 'scheduled',
      title: 'Agendado',
      leadIds: []
    }
  ]);

  // Função para abrir modal de edição de lead
  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Função para criar novo lead
  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  // Função para salvar lead (criar ou editar)
  const handleSaveLead = (leadData: Partial<Lead>) => {
    if (selectedLead) {
      // Editando lead existente
      setLeads(prev => prev.map(lead => 
        lead.id === selectedLead.id 
          ? { ...lead, ...leadData, updatedAt: new Date() }
          : lead
      ));
    } else {
      // Criando novo lead
      const newLead: Lead = {
        id: Date.now().toString(),
        name: leadData.name || '',
        phone: leadData.phone || '',
        email: leadData.email,
        notes: leadData.notes,
        stage: 'waiting',
        tagId: leadData.tagId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setLeads(prev => [...prev, newLead]);
      
      // Adiciona o novo lead na primeira coluna
      setColumns(prev => prev.map(col => 
        col.id === 'waiting' 
          ? { ...col, leadIds: [...col.leadIds, newLead.id] }
          : col
      ));
    }
    setIsModalOpen(false);
  };

  // Função para mover lead entre colunas (drag and drop)
  const handleMoveCard = (leadId: string, fromColumn: string, toColumn: string) => {
    setColumns(prev => prev.map(col => {
      if (col.id === fromColumn) {
        return { ...col, leadIds: col.leadIds.filter(id => id !== leadId) };
      }
      if (col.id === toColumn) {
        return { ...col, leadIds: [...col.leadIds, leadId] };
      }
      return col;
    }));

    // Atualiza o stage do lead
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, stage: toColumn, updatedAt: new Date() }
        : lead
    ));
  };

  return (
    <div className="h-full">
      {/* Header da página com título e botão de novo lead */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciamento de Leads
          </h2>
          <p className="text-gray-600 mt-1">
            Acompanhe o progresso dos seus leads no funil de vendas
          </p>
        </div>
        <button
          onClick={handleCreateLead}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Lead
        </button>
      </div>

      {/* Board do Kanban */}
      <div className="flex gap-6 h-full overflow-x-auto">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            leads={leads.filter(lead => column.leadIds.includes(lead.id))}
            onEditLead={handleEditLead}
            onMoveCard={handleMoveCard}
          />
        ))}
      </div>

      {/* Modal para edição/criação de leads */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLead}
        onSave={handleSaveLead}
      />
    </div>
  );
};
