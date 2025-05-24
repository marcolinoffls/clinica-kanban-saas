
import { Lead } from './KanbanBoard';
import { useTagStore } from '@/stores/tagStore';

/**
 * Componente que representa um card de lead no Kanban
 * 
 * Funcionalidades:
 * - Exibe informações do lead (nome, telefone, tag)
 * - Suporte a drag and drop
 * - Click para editar lead
 * - Tag colorida para categorização
 * 
 * Props:
 * - lead: dados do lead
 * - onEdit: função para editar o lead
 * - columnId: id da coluna atual (para drag and drop)
 */

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  columnId: string;
}

export const LeadCard = ({ lead, onEdit, columnId }: LeadCardProps) => {
  // Busca as tags do store global
  const { tags } = useTagStore();
  
  // Encontra a tag associada ao lead
  const leadTag = tags.find(tag => tag.id === lead.tagId);

  // Configuração para arrastar o card
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.setData('fromColumn', columnId);
  };

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={handleDragStart}
      onClick={onEdit}
    >
      {/* Nome do lead */}
      <h4 className="font-medium text-gray-900 mb-2">{lead.name}</h4>
      
      {/* Telefone do lead */}
      <p className="text-sm text-gray-600 mb-3">{lead.phone}</p>
      
      {/* Tag colorida se existir */}
      {leadTag && (
        <span
          className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: leadTag.color }}
        >
          {leadTag.name}
        </span>
      )}
      
      {/* Notas do lead (preview) */}
      {lead.notes && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {lead.notes}
        </p>
      )}
    </div>
  );
};
