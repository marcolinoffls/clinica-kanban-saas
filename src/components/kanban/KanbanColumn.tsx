
// src/components/kanban/KanbanColumn.tsx
import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Lead, IKanbanColumn } from './KanbanBoard';
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
  isColumnDragOverTarget,
}: KanbanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  /**
   * Manipulador para onDragOver na coluna.
   * Permite que itens (especificamente LeadCards) sejam soltos aqui.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const itemType = e.dataTransfer.types.includes('leadid') ? 'leadCard' : e.dataTransfer.getData('itemType');
    const leadId = e.dataTransfer.getData('leadId') || e.dataTransfer.getData('text/plain');
    
    console.log('🟡 Drag over na coluna:', column.nome, 'itemType:', itemType, 'leadId:', leadId);
    
    // Só permite drop se for um leadCard e tiver leadId
    if (itemType === 'leadCard' && leadId) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  /**
   * Manipulador para onDragLeave na coluna.
   * Limpa o feedback visual.
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Só remove o estado se realmente saiu da área da coluna
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  /**
   * Manipulador para onDrop na coluna.
   * Chamado quando um LeadCard é solto nesta coluna.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const leadId = e.dataTransfer.getData('leadId') || e.dataTransfer.getData('text/plain');
    const fromColumnId = e.dataTransfer.getData('fromColumnId');
    const itemType = e.dataTransfer.types.includes('leadid') ? 'leadCard' : e.dataTransfer.getData('itemType');

    console.log('🟢 Drop na coluna:', column.nome, {
      leadId,
      fromColumnId,
      toColumnId: column.id,
      itemType,
      dataTransferTypes: Array.from(e.dataTransfer.types)
    });

    // Validação rigorosa antes de processar o drop
    if (!leadId) {
      console.warn('⚠️ Drop cancelado: leadId não encontrado');
      return;
    }

    if (!fromColumnId) {
      console.warn('⚠️ Drop cancelado: fromColumnId não encontrado');
      return;
    }

    if (fromColumnId === column.id) {
      console.log('⚪ Lead já está na coluna de destino, ignorando drop');
      return;
    }

    // Processa o drop apenas se for um leadCard válido
    if (itemType === 'leadCard') {
      console.log('✅ Processando drop do lead:', leadId, 'para coluna:', column.id);
      onDropLeadInColumn(leadId, fromColumnId, column.id);
    } else {
      console.warn('⚠️ Drop cancelado: itemType inválido:', itemType);
    }
  };

  return (
    <div
      className={`bg-gray-50 rounded-xl p-4 min-w-80 w-80 h-full border border-gray-200 shadow-sm flex flex-col transition-all duration-150 
                  ${isColumnDragOverTarget ? 'ring-2 ring-blue-500 ring-offset-2' : ''} 
                  ${isDragOver ? 'bg-blue-50 border-blue-300 border-dashed' : ''}
                  `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-column-id={column.id}
    >
      {/* Header da coluna */}
      <div className="flex justify-between items-center mb-4 group">
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
