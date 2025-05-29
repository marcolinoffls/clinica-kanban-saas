// src/components/kanban/KanbanColumn.tsx
import React from 'react';
import { Edit2, Trash2, GripVertical } from 'lucide-react'; // Adicionado GripVertical
import { Lead, IKanbanColumn } from './KanbanBoard'; // Certifique-se que KanbanBoard.tsx EXPORTE estas interfaces
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
  column: IKanbanColumn;
  leads: Lead[];
  corEtapa: string;
  onEditLead: (lead: Lead) => void;
  // Callback para quando um LeadCard é solto nesta coluna
  onDropLeadInColumn: (leadId: string, fromColumnId: string, toColumnId: string) => void;
  onOpenHistory: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onEditEtapa: () => void;
  onDeleteEtapa: () => void;
  // Props para o drag and drop da COLUNA
  isDraggingColumn?: boolean; // Opcional: para feedback visual se a coluna está sendo arrastada
}

export const KanbanColumn = ({
  column,
  leads,
  corEtapa,
  onEditLead,
  onDropLeadInColumn, // Callback para quando um LEAD é solto aqui
  onOpenHistory,
  onOpenChat,
  onEditEtapa,
  onDeleteEtapa,
  isDraggingColumn, // Nova prop para feedback visual
}: KanbanColumnProps) => {

  /**
   * Manipulador para o evento onDragOver DESTA COLUNA.
   * Permite que LeadCards sejam soltos AQUI.
   */
  const handleLeadDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Permite o drop
    const draggedItemType = e.dataTransfer.types.find(type => type === 'leadId');
    if (draggedItemType) {
      // Opcional: Adicionar classe para feedback visual que a coluna é um alvo de drop para leads
      // e.currentTarget.classList.add('lead-drag-over-target');
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none'; // Não permitir drop de outros tipos de item (como colunas) aqui
    }
  };

  // const handleLeadDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
  //   // e.currentTarget.classList.remove('lead-drag-over-target');
  // };

  /**
   * Manipulador para o evento onDrop DESTA COLUNA.
   * Chamado quando um LeadCard é solto sobre esta coluna.
   */
  const handleLeadDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // e.currentTarget.classList.remove('lead-drag-over-target');

    const leadId = e.dataTransfer.getData('leadId');
    const fromColumnId = e.dataTransfer.getData('fromColumnId');

    // Verifica se os dados são de um lead e se a origem é diferente
    if (leadId && fromColumnId && fromColumnId !== column.id) {
      onDropLeadInColumn(leadId, fromColumnId, column.id);
    } else if (leadId && fromColumnId === column.id) {
      // Card solto na mesma coluna.
      // A reordenação DENTRO da coluna (se implementada) seria tratada no onDrop do LeadCard
      // ou aqui se a intenção fosse mover para o final da coluna.
      console.log(`Lead ${leadId} solto na mesma coluna ${column.id}. Nenhuma mudança de etapa.`);
    }
  };


  return (
    // O div principal da coluna.
    // É um alvo de drop para LeadCards.
    // A propriedade `draggable` e os handlers para arrastar a coluna estarão no wrapper em KanbanBoard.tsx
    <div
      className={`bg-gray-50 rounded-xl p-4 min-w-80 h-full border border-gray-200 shadow-sm flex flex-col transition-opacity ${
        isDraggingColumn ? 'opacity-50' : 'opacity-100' // Feedback visual se a coluna está sendo arrastada
      }`}
      onDragOver={handleLeadDragOver} // Permite que LeadCards sejam soltos aqui
      // onDragLeave={handleLeadDragLeave} // Limpa feedback visual
      onDrop={handleLeadDrop}       // Lida com LeadCards soltos aqui
      data-column-id={column.id}
    >
      {/* Header da coluna: título, cor, contagem de leads e botões de ação da etapa */}
      {/* Adicionamos um "handle" para arrastar a coluna, se necessário, ou tornamos o header arrastável */}
      <div
        className="flex justify-between items-center mb-4"
        // Se você quiser que apenas o header arraste a coluna, adicione draggable e onDragStart aqui
        // e passe os handlers do KanbanBoard para cá. Por enquanto, o div wrapper em KanbanBoard fará isso.
      >
        <div className="flex items-center gap-3">
          {/* Ícone para arrastar a coluna (opcional, pode ser todo o header) */}
          {/* <GripVertical className="cursor-grab text-gray-400" size={16} /> */}
          <div className={`w-3 h-3 rounded-full ${corEtapa}`}></div>
          <h3 className="font-semibold text-gray-800 text-sm">{column.title}</h3>
          <div className="flex gap-1">
            <button
              onClick={onEditEtapa}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar nome da etapa"
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
        <span className="bg-white text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
          {leads.length}
        </span>
      </div>

      {/* Container para os cards de leads */}
      <div className="space-y-3 min-h-[120px] flex-grow overflow-y-auto">
        {Array.isArray(leads) && leads.map((lead, index) => ( // Adicionamos o index aqui
          <LeadCard
            key={lead.id}
            lead={lead}
            index={index} // Passa o índice do lead na coluna
            onEdit={() => onEditLead(lead)}
            onOpenHistory={() => onOpenHistory(lead)}
            onOpenChat={() => onOpenChat(lead)}
            columnId={column.id}
            // onDropOnCard não é mais necessário se a coluna é o único alvo de drop para cards
            // A menos que você queira reordenar cards dentro da coluna soltando sobre outro card.
            // Se a reordenação dentro da coluna não for prioridade agora, pode remover esta prop.
          />
        ))}
        
        {(!Array.isArray(leads) || leads.length === 0) && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg h-full flex flex-col justify-center">
            <div className="text-gray-400 text-sm">
              <p className="font-medium mb-1">Nenhum lead aqui</p>
              <p className="text-xs">Arraste leads para esta etapa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};