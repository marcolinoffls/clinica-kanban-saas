// src/components/kanban/KanbanColumn.tsx

import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Lead, IKanbanColumn } from './KanbanBoard'; // Supondo que KanbanBoard.tsx exporta estes tipos
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
  column: IKanbanColumn;
  leads: Lead[];
  corEtapa: string;
  onEditLead: (lead: Lead) => void;
  onDropLeadInColumn: (leadId: string, fromColumnId: string, toColumnId: string) => void;
  onOpenHistory: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onEditEtapa: () => void; // Callback para editar a etapa/coluna
  onDeleteEtapa: () => void; // Callback para deletar a etapa/coluna
  isColumnDragOverTarget?: boolean; // Para feedback visual se uma coluna inteira está sendo arrastada sobre esta
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
  isColumnDragOverTarget, // Usado para feedback visual ao arrastar colunas (não cards)
}: KanbanColumnProps) => {
  // Estado para controle visual quando um card de lead está sendo arrastado sobre esta coluna
  const [isDragOverForLeadCard, setIsDragOverForLeadCard] = useState(false);

  /**
   * Handler para o evento onDragOver.
   * Chamado continuamente enquanto um item arrastável está sobre a coluna.
   * É crucial chamar e.preventDefault() para permitir o drop.
   * Usa uma variável global window.__DRAGGED_LEAD__ para verificar se o item arrastado é um lead.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessário para permitir que o evento onDrop seja disparado

    // Verifica se há um lead sendo arrastado (definido em LeadCard > handleDragStart)
    if (window.__DRAGGED_LEAD__) {
      console.log(`[KanbanColumn] 🟡 DragOver na coluna: "${column.title || column.nome}". Lead sendo arrastado: ${window.__DRAGGED_LEAD__.id}`);
      e.dataTransfer.dropEffect = 'move'; // Define o cursor para indicar uma operação de mover
      if (!isDragOverForLeadCard) {
        setIsDragOverForLeadCard(true); // Ativa o feedback visual de "drop target"
      }
    } else {
      // Se não for um lead (ou nada reconhecível), não permite o drop
      e.dataTransfer.dropEffect = 'none';
      if (isDragOverForLeadCard) {
        setIsDragOverForLeadCard(false); // Desativa o feedback visual
      }
    }
  };

  /**
   * Handler para o evento onDragLeave.
   * Chamado quando um item arrastável sai da área da coluna.
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Verifica se o mouse realmente saiu do elemento e não apenas para um filho
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverForLeadCard(false); // Desativa o feedback visual
    }
  };

  /**
   * Handler para o evento onDrop.
   * Chamado quando um item arrastável é solto sobre a coluna.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log(`[KanbanColumn] 🔥 INICIANDO handleDrop na coluna "${column.title || column.nome}"`);
    e.preventDefault(); // Previne o comportamento padrão do navegador (ex: abrir link)
    setIsDragOverForLeadCard(false); // Desativa o feedback visual após o drop

    // Obtém os dados do lead arrastado da variável global
    // (window as any) é usado aqui para acessar __DRAGGED_LEAD__ se a tipagem global não estiver totalmente configurada
    const draggedLeadData = window.__DRAGGED_LEAD__;

    if (!draggedLeadData) {
      console.error('[KanbanColumn] ❌ Drop CANCELADO: Nenhum dado de lead encontrado em window.__DRAGGED_LEAD__.');
      return;
    }

    const { id: leadId, fromColumnId } = draggedLeadData;

    // Validações essenciais
    if (!leadId || !fromColumnId) {
      console.error('[KanbanColumn] ❌ Drop CANCELADO: Dados inválidos do lead arrastado.', { leadId, fromColumnId });
      return;
    }

    // Não faz nada se o lead for solto na mesma coluna de origem
    if (fromColumnId === column.id) {
      console.log(`[KanbanColumn] ⚪️ Lead "${leadId}" solto na mesma coluna ("${column.title || column.nome}"). Nenhuma ação.`);
      // Importante: Limpar __DRAGGED_LEAD__ deve ser feito no handleDragEnd do LeadCard
      // para garantir que seja limpo mesmo se o drop não for bem-sucedido ou ocorrer fora de um alvo válido.
      return;
    }

    // Se todas as validações passarem, chama a função para mover o lead
    try {
      console.log(`[KanbanColumn] ✅ Chamando onDropLeadInColumn com:`, {
        leadId,
        fromColumnId,
        toColumnId: column.id,
        nomeColunaDestino: column.title || column.nome
      });
      onDropLeadInColumn(leadId, fromColumnId, column.id);
    } catch (error) {
      console.error('[KanbanColumn] ❌ Erro ao chamar onDropLeadInColumn:', error);
    }
    // Limpar window.__DRAGGED_LEAD__ é responsabilidade do handleDragEnd do LeadCard.
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
      data-column-id={column.id} // Útil para debugging e testes
    >
      {/* Header da coluna: Nome, contador de leads e botões de ação (editar/excluir etapa) */}
      <div className="flex justify-between items-center mb-4 group">
        <div className="flex items-center gap-3">
          {/* Indicador de cor da etapa */}
          <div 
            className={`w-3 h-3 rounded-full ${corEtapa}`} // corEtapa deve ser uma classe Tailwind (ex: bg-blue-500)
            title={`Cor da etapa: ${column.title || column.nome}`}
          />
          {/* Título da coluna/etapa */}
          <h3 className="font-semibold text-gray-900 text-sm">
            {column.title || column.nome}
          </h3>
          {/* Contador de leads na coluna */}
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
      {/* flex-1 para ocupar o espaço restante e overflow-y-auto para scroll interno se necessário */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 -mr-1 custom-scrollbar"> {/* Adicionado custom-scrollbar se você tiver estilos para isso */}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead(lead)}
            onOpenHistory={() => onOpenHistory(lead)}
            onOpenChat={() => onOpenChat(lead)}
            columnId={column.id} // Passa o ID da coluna atual para o LeadCard
          />
        ))}
        
        {/* Placeholder visual quando não há leads na coluna */}
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400 flex flex-col items-center justify-center h-full">
            <p className="text-sm">Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
};
`