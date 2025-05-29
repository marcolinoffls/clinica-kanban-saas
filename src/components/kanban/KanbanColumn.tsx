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
      <div className="flex justify-between items-center mb-4