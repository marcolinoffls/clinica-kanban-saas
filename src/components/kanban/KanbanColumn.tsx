
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

/**
 * Componente de coluna do Kanban.
 * - Aceita drag and drop de cards de lead.
 * - Mostra header com nome, cor, contador e ações da etapa.
 * - Renderiza os LeadCards da etapa.
 */
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
  // Estado para controle visual quando um card de lead está sendo arrastado sobre esta coluna
  const [isDragOverForLeadCard, setIsDragOverForLeadCard] = useState(false);

  /**
   * Verifica se há dados válidos de um lead sendo arrastado
   */
  const getDraggedLeadData = () => {
    // Método primário: usar window.__DRAGGED_LEAD__
    if (window.__DRAGGED_LEAD__) {
      return window.__DRAGGED_LEAD__;
    }
    return null;
  };

  /**
   * Handler para o evento onDragOver.
   * Chamado continuamente enquanto um item arrastável está sobre a coluna.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    console.log('🟡 [KanbanColumn] DRAG OVER - Coluna:', column.nome);
    console.log('🟡 [KanbanColumn] window.__DRAGGED_LEAD__:', window.__DRAGGED_LEAD__);
    
    if (window.__DRAGGED_LEAD__) {
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOverForLeadCard) {
        setIsDragOverForLeadCard(true);
        console.log('🟡 [KanbanColumn] Ativando feedback visual');
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
      if (isDragOverForLeadCard) {
        setIsDragOverForLeadCard(false);
      }
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🔥 [KanbanColumn] DROP na coluna:', column.nome);
    e.preventDefault();
    setIsDragOverForLeadCard(false);
    
    const draggedLeadData = window.__DRAGGED_LEAD__;
    console.log('🔥 [KanbanColumn] Dados arrastados:', draggedLeadData);
    
    if (!draggedLeadData) {
      console.error('❌ [KanbanColumn] Nenhum dado encontrado');
      return;
    }
    
    const { id: leadId, fromColumnId } = draggedLeadData;
    
    if (fromColumnId === column.id) {
      console.log('⚪️ [KanbanColumn] Mesma coluna, ignorando');
      return;
    }
    
    console.log('✅ [KanbanColumn] Chamando onDropLeadInColumn:', {
      leadId,
      fromColumnId,
      toColumnId: column.id
    });
    
    onDropLeadInColumn(leadId, fromColumnId, column.id);
  };
  /**
   * Handler para o evento onDragLeave.
   * Chamado quando um item arrastável sai da área da coluna.
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Verifica se o mouse realmente saiu do elemento e não apenas para um filho
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverForLeadCard(false);
    }
  };

  /**
   * Handler para o evento onDrop.
   * Chamado quando um item arrastável é solto sobre a coluna.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverForLeadCard(false);

    console.log('[KanbanColumn] 🎯 Drop detectado na coluna:', column.title || column.nome);

    // Tenta obter dados do lead arrastado
    const draggedData = getDraggedLeadData();

    if (!draggedData) {
      console.warn('[KanbanColumn] ❌ Nenhum dado de lead encontrado no drop');
      return;
    }

    const { id: leadId, fromColumnId } = draggedData;

    // Validações
    if (!leadId || !fromColumnId) {
      console.error('[KanbanColumn] ❌ Dados inválidos:', { leadId, fromColumnId });
      return;
    }

    // Não faz nada se for a mesma coluna
    if (fromColumnId === column.id) {
      console.log('[KanbanColumn] ⚪️ Drop na mesma coluna, ignorando');
      return;
    }

    console.log('[KanbanColumn] ✅ Executando drop:', {
      leadId,
      fromColumnId,
      toColumnId: column.id,
      columnName: column.title || column.nome
    });

    // Chama a função de callback para processar o drop
    try {
      onDropLeadInColumn(leadId, fromColumnId, column.id);
    } catch (error) {
      console.error('[KanbanColumn] ❌ Erro ao processar drop:', error);
    }
  };

  return (
    <div
      className={`
        bg-gray-50 rounded-xl p-4 min-w-[20rem] w-80 h-full border shadow-sm 
        flex flex-col transition-all duration-150
        ${isColumnDragOverTarget ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'} 
        ${isDragOverForLeadCard ? 'bg-blue-100 border-blue-400 border-dashed' : ''} 
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
            title={`Cor da etapa: ${column.title || column.nome}`}
          />
          <h3 className="font-semibold text-gray-900 text-sm">
            {column.title || column.nome}
          </h3>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
            {leads.length}
          </span>
        </div>
        
        {/* Botões de editar/excluir etapa */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={onEditEtapa}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar etapa"
            aria-label={`Editar etapa ${column.title || column.nome}`}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDeleteEtapa}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir etapa"
            aria-label={`Excluir etapa ${column.title || column.nome}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Container da Lista de leads */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
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
        
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400 flex flex-col items-center justify-center h-full">
            <p className="text-sm">Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
};
