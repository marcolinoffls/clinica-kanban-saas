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
  // Estado visual para indicar dragover de card de lead
  const [isDragOverForLeadCard, setIsDragOverForLeadCard] = useState(false);

  /**
   * Handler para dragover na coluna.
   * Só permite drop se o item for um leadCard.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // CORREÇÃO: Não podemos ler dados do dataTransfer durante dragover
    // Vamos confiar apenas nos types disponíveis
    const hasLeadCardType = e.dataTransfer.types.includes('leadId') && 
                           e.dataTransfer.types.includes('fromColumnId') &&
                           e.dataTransfer.types.includes('itemType');
  
    if (hasLeadCardType) {
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOverForLeadCard) setIsDragOverForLeadCard(true);
    } else {
      e.dataTransfer.dropEffect = 'none';
      if (isDragOverForLeadCard) setIsDragOverForLeadCard(false);
    }
  };
  /**
   * Handler para dragleave da coluna.
   * Remove o estado visual de dragover.
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverForLeadCard(false);
    }
  };

  /**
   * Handler para drop de card de lead na coluna.
   * Faz validações e chama o callback de movimentação.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log(`[KanbanColumn] 🔥 INICIANDO handleDrop na coluna "${column.nome}"`);
    e.preventDefault();
    setIsDragOverForLeadCard(false);

    // Tenta extrair os dados do dataTransfer
    const leadId = e.dataTransfer.getData('leadId') || e.dataTransfer.getData('text/plain');
    const fromColumnId = e.dataTransfer.getData('fromColumnId');
    const itemType = e.dataTransfer.getData('itemType');

    // Fallback: tenta extrair do JSON
    let jsonData = null;
    try {
      const jsonString = e.dataTransfer.getData('application/json');
      if (jsonString) jsonData = JSON.parse(jsonString);
    } catch (error) {
      console.warn('[KanbanColumn] Não foi possível parsear JSON do dataTransfer:', error);
    }

    console.log(`[KanbanColumn] 🔍 Dados extraídos do drop:`, {
      leadIdPrimario: leadId,
      leadIdDoJson: jsonData?.leadId,
      fromColumnIdPrimario: fromColumnId,
      fromColumnIdDoJson: jsonData?.fromColumnId,
      itemTypePrimario: itemType,
      itemTypeDoJson: jsonData?.itemType,
      toColumnIdDestino: column.id,
      todosOsTiposDisponiveis: Array.from(e.dataTransfer.types)
    });

    // Usa o fallback do JSON se necessário
    const finalLeadId = leadId || jsonData?.leadId;
    const finalFromColumnId = fromColumnId || jsonData?.fromColumnId;
    const finalItemType = itemType || jsonData?.itemType;

    // Validações detalhadas
    if (!finalLeadId) {
      console.error('[KanbanColumn] ❌ Drop CANCELADO: leadId não encontrado. Dados disponíveis:', {
        leadIdTentativas: [leadId, jsonData?.leadId],
        todosOsTypes: Array.from(e.dataTransfer.types)
      });
      return;
    }
    if (!finalFromColumnId) {
      console.error('[KanbanColumn] ❌ Drop CANCELADO: fromColumnId não encontrado. Dados disponíveis:', {
        fromColumnIdTentativas: [fromColumnId, jsonData?.fromColumnId]
      });
      return;
    }
    if (finalItemType !== 'leadCard') {
      console.error('[KanbanColumn] ❌ Drop CANCELADO: itemType inválido.', {
        itemTypeRecebido: finalItemType,
        itemTypeEsperado: 'leadCard'
      });
      return;
    }
    if (finalFromColumnId === column.id) {
      console.log(`[KanbanColumn] ⚪️ Lead "${finalLeadId}" solto na mesma coluna ("${column.nome}"). Nenhuma mudança necessária.`);
      return;
    }

    // Chama o callback de movimentação
    console.log(`[KanbanColumn] ✅ TODAS as validações passaram. Chamando onDropLeadInColumn...`);
    console.log(`[KanbanColumn] 📞 Parâmetros da chamada:`, {
      leadId: finalLeadId,
      fromColumnId: finalFromColumnId,
      toColumnId: column.id,
      nomeColuna: column.nome
    });

    try {
      onDropLeadInColumn(finalLeadId, finalFromColumnId, column.id);
      console.log(`[KanbanColumn] ✅ onDropLeadInColumn chamado com sucesso`);
    } catch (error) {
      console.error(`[KanbanColumn] ❌ Erro ao chamar onDropLeadInColumn:`, error);
    }
  };

  return (
    <div
      className={`bg-gray-50 rounded-xl p-4 min-w-80 w-80 h-full border shadow-sm flex flex-col transition-all duration-150 
                  ${isColumnDragOverTarget ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'} 
                  ${isDragOverForLeadCard ? 'bg-blue-100 border-blue-400 border-dashed' : ''} 
                  `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-column-id={column.id}
    >
      {/* Header da coluna: Nome, contador de leads e botões de ação (editar/excluir etapa) */}
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
        
        {/* Botões de editar/excluir etapa, aparecem no hover da div pai com a classe 'group' */}
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

      {/* Container da Lista de leads (cards) */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead(lead)}
            onOpenHistory={() => onOpenHistory(lead)}
            onOpenChat={() => onOpenChat(lead)}
            columnId={column.id} // ESSENCIAL para drag and drop funcionar!
          />
        ))}
        
        {/* Placeholder visual quando não há leads na coluna */}
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
};