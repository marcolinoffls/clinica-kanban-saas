
import { Edit2, Trash2 } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { LeadCard } from './LeadCard';
import { Lead, Etapa, Tag } from './KanbanBoard';

/**
 * Componente de coluna do Kanban
 * 
 * Exibe uma etapa do processo com seus leads
 * Permite arrastar e soltar leads entre etapas
 * Fornece ações para editar/excluir a etapa
 */

interface KanbanColumnProps {
  etapa: Etapa;
  leads: Lead[];
  tags: Tag[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onEditEtapa: () => void;
  onDeleteEtapa: () => void;
  onAddLead: (etapaId: string) => void;
  dragHandleProps?: any;
}

export const KanbanColumn = ({ 
  etapa, 
  leads, 
  tags,
  onEditLead, 
  onDeleteLead,
  onEditEtapa,
  onDeleteEtapa,
  onAddLead,
  dragHandleProps
}: KanbanColumnProps) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 min-w-80 h-fit border border-gray-200 shadow-sm">
      {/* Header da coluna */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div {...dragHandleProps} className="cursor-grab">
            <h3 className="font-semibold text-gray-800 text-sm">{etapa.nome}</h3>
          </div>
          
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
      <Droppable droppableId={etapa.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-[120px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'rotate-2 shadow-xl' : ''}
                  >
                    <LeadCard
                      lead={lead}
                      tags={tags}
                      onEdit={() => onEditLead(lead)}
                      onDelete={() => onDeleteLead(lead.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
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
        )}
      </Droppable>
    </div>
  );
};
