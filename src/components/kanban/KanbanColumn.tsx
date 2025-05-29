
import { Edit2, Trash2 } from 'lucide-react';
import { KanbanColumn as IKanbanColumn, Lead } from './KanbanBoard';
import { LeadCard } from './LeadCard';

/**
 * Componente de coluna do Kanban com design aprimorado
 * 
 * Melhorias implementadas:
 * - Círculo colorido identificador da etapa
 * - Design moderno com bordas arredondadas
 * - Área de drop visível e responsiva
 * - Placeholder para colunas vazias
 */

interface KanbanColumnProps {
  column: IKanbanColumn;
  leads: Lead[];
  corEtapa: string; // Nova prop para cor da etapa
  onEditLead: (lead: Lead) => void;
  onMoveCard: (leadId: string, fromColumn: string, toColumn: string) => void;
  onOpenHistory: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onEditEtapa: () => void;
  onDeleteEtapa: () => void;
}

export const KanbanColumn = ({ 
  column, 
  leads, 
  corEtapa,
  onEditLead, 
  onMoveCard, 
  onOpenHistory,
  onOpenChat,
  onEditEtapa,
  onDeleteEtapa 
}: KanbanColumnProps) => {
  // Configuração para permitir drop de cards
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Função para receber cards arrastados de outras colunas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const fromColumn = e.dataTransfer.getData('fromColumn');
    
    if (leadId && fromColumn !== column.id) {
      onMoveCard(leadId, fromColumn, column.id);
    }
  };

  return (
    <div 
      className="bg-gray-50 rounded-xl p-4 min-w-80 h-fit border border-gray-200 shadow-sm"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header da coluna com círculo colorido */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {/* Círculo colorido identificador da etapa */}
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
        
        {/* Badge com contagem */}
        <span className="bg-white text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
          {leads.length}
        </span>
      </div>

      {/* Lista de cards dos leads */}
      <div className="space-y-3 min-h-[120px]">
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
        
        {/* Placeholder para colunas vazias */}
        {leads.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
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
