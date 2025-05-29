
// src/components/kanban/KanbanColumn.tsx
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Lead, IKanbanColumn } from './KanbanBoard'; // Certifique-se que KanbanBoard.tsx EXPORTE estas interfaces
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
  column: IKanbanColumn;
  leads: Lead[];
  corEtapa: string;
  onEditLead: (lead: Lead) => void;
  onDropLeadInColumn: (leadId: string, fromColumnId: string, toColumnId: string) => void;
  onOpenHistory: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onEditEtapa: () => void;
  onDeleteEtapa: () => void;
  // Opcional: para feedback visual quando uma coluna é um alvo de drop para *outra coluna*
  isColumnDragOverTarget?: boolean; 
}

export const KanbanColumn = ({
  column,
  leads,
  corEtapa,
  onEditLead,
  onDropLeadInColumn,
  onOpenHistory,
  onOpenChat,
  onEditEtapa,
  onDeleteEtapa,
  isColumnDragOverTarget, // Usado para feedback visual
}: KanbanColumnProps) => {

  /**
   * Manipulador para onDragOver na coluna.
   * Permite que itens (especificamente LeadCards) sejam soltos aqui.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessário para permitir o drop
    // Verifica se o item sendo arrastado é um 'leadCard'
    const isLeadCard = e.dataTransfer.types.includes('itemtype') && e.dataTransfer.getData('itemType') === 'leadCard';
    if (isLeadCard) {
      e.dataTransfer.dropEffect = 'move';
      // Opcional: Adicionar uma classe para indicar que a coluna é um alvo válido para o card
      e.currentTarget.classList.add('drag-over-column-for-card');
    } else {
      e.dataTransfer.dropEffect = 'none'; // Não permite drop se não for um leadCard
    }
  };

  /**
   * Manipulador para onDragLeave na coluna.
   * Limpa o feedback visual.
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('drag-over-column-for-card');
  };

  /**
   * Manipulador para onDrop na coluna.
   * Chamado quando um LeadCard é solto nesta coluna.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over-column-for-card');

    const leadId = e.dataTransfer.getData('leadId');
    const fromColumnId = e.dataTransfer.getData('fromColumnId');
    const itemType = e.dataTransfer.getData('itemType');

    // Processa o drop apenas se for um leadCard
    if (itemType === 'leadCard' && leadId && fromColumnId && fromColumnId !== column.id) {
      onDropLeadInColumn(leadId, fromColumnId, column.id);
    }
  };

  return (
    // O div principal da coluna. Ele é um alvo de drop para LeadCards.
    // Não é `draggable` aqui; o wrapper em KanbanBoard.tsx cuidará disso.
    <div
      className={`bg-gray-50 rounded-xl p-4 min-w-80 w-80 h-full border border-gray-200 shadow-sm flex flex-col transition-all duration-150 
                  ${isColumnDragOverTarget ? 'ring-2 ring-blue-500 ring-offset-2' : ''} 
                  `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-column-id={column.id}
    >
      {/* Estilo para feedback visual quando a coluna é um alvo de drop para um card */}
      <style>{`.drag-over-column-for-card { background-color: #EFF6FF; /* Azul bem claro */ border-style: dashed; }`}</style>
      
      {/* Header da coluna */}
      {/* O header NÃO é draggable por si só aqui. O drag da coluna é no wrapper do KanbanBoard.tsx */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div 
            className={`w-3 h-3 rounded-full ${corEtapa}`}
            title={`Cor da etapa: ${column.nome}`}
          />
          <h3 className="font-semibold text-gray-900 text-sm">
            {column.title || column.nome}
          </h3>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
            {leads.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEditEtapa}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar etapa"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDeleteEtapa}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir etapa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Lista de leads (cards) */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead(lead)}
            onOpenHistory={() => onOpenHistory(lead)}
            onOpenChat={() => onOpenChat(lead)}
            columnId={column.id}
          />
        ))}
        
        {/* Placeholder quando não há leads */}
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
};
