
import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { PipelineLeadCard } from './PipelineLeadCard';
import { Lead } from '@/hooks/useLeadsData';
import { IPipelineColumn } from './types';

interface PipelineColumnProps {
  column: IPipelineColumn;
  leads: Lead[];
  corEtapa: string;
  onEditLead: (lead: Lead) => void;
  onDropLeadInColumn: (leadId: string, fromColumnId: string, toColumnId: string) => void;
  onOpenHistory: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onEditEtapa: () => void;
  onDeleteEtapa: () => void;
}

/**
 * Componente de coluna do Pipeline de Vendas.
 * Similar ao KanbanColumn, mas com visual adaptado para pipeline.
 */
export const PipelineColumn = ({
  column,
  leads,
  corEtapa,
  onEditLead,
  onDropLeadInColumn,
  onOpenHistory,
  onOpenChat,
  onEditEtapa,
  onDeleteEtapa,
}: PipelineColumnProps) => {
  const [isDragOverForLeadCard, setIsDragOverForLeadCard] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (window.__DRAGGED_LEAD__) {
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOverForLeadCard) {
        setIsDragOverForLeadCard(true);
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverForLeadCard(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverForLeadCard(false);
    
    const draggedLeadData = window.__DRAGGED_LEAD__;
    
    if (!draggedLeadData) {
      return;
    }
    
    const { id: leadId, fromColumnId } = draggedLeadData;
    
    if (!leadId || !fromColumnId) {
      return;
    }
    
    if (fromColumnId === column.id) {
      return;
    }
    
    onDropLeadInColumn(leadId, fromColumnId, column.id);
  };

  return (
    <div
      className={`
        bg-gray-50 rounded-xl p-4 min-w-[20rem] w-80 h-full border shadow-sm 
        flex flex-col transition-all duration-150
        ${isDragOverForLeadCard ? 'bg-purple-100 border-purple-400 border-dashed' : 'border-gray-200'} 
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
            {column.nome}
          </h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            {leads.length}
          </span>
        </div>
        
        {/* Botões de ação da etapa */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={onEditEtapa}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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

      {/* Lista de leads */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {leads.map((lead) => (
          <PipelineLeadCard
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
