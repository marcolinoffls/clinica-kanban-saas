
import { KanbanColumn as IKanbanColumn, Lead } from './KanbanBoard';
import { LeadCard } from './LeadCard';

/**
 * Componente que representa uma coluna do Kanban
 * 
 * Funcionalidades:
 * - Exibe o título da etapa e contagem de leads
 * - Lista os cards dos leads nesta etapa
 * - Suporte a drag and drop
 * 
 * Props:
 * - column: dados da coluna (id, título, leadIds)
 * - leads: array de leads desta coluna
 * - onEditLead: função para editar um lead
 * - onMoveCard: função para mover card entre colunas
 */

interface KanbanColumnProps {
  column: IKanbanColumn;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onMoveCard: (leadId: string, fromColumn: string, toColumn: string) => void;
}

export const KanbanColumn = ({ column, leads, onEditLead, onMoveCard }: KanbanColumnProps) => {
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
      className="bg-gray-100 rounded-lg p-4 min-w-80 h-fit"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header da coluna com título e contagem */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">{column.title}</h3>
        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-sm">
          {leads.length}
        </span>
      </div>

      {/* Lista de cards dos leads */}
      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead(lead)}
            columnId={column.id}
          />
        ))}
        
        {/* Mensagem quando não há leads na coluna */}
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
};
