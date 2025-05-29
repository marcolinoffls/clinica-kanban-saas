
import { History, MessageCircle, Tag, Trash2 } from 'lucide-react';
import { Lead, Tag as TagType } from './KanbanBoard';

/**
 * Card de lead com design moderno
 * 
 * Exibe informações do lead e ações disponíveis
 * Permite edição e exclusão do lead
 */

interface LeadCardProps {
  lead: Lead;
  tags: TagType[];
  onEdit: () => void;
  onDelete: () => void;
}

export const LeadCard = ({ lead, tags, onEdit, onDelete }: LeadCardProps) => {
  // Buscar dados da tag para exibir cor
  const tagDoLead = tags.find(tag => tag.id === lead.tag_id);

  // Prevenir propagação de eventos dos botões
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200 relative group"
      onClick={onEdit}
    >
      {/* Botões de ação no topo */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDeleteClick}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Excluir lead"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Nome do lead */}
      <h4 className="font-semibold text-gray-900 mb-2 pr-16 text-sm leading-tight">
        {lead.nome}
      </h4>
      
      {/* Telefone do lead */}
      {lead.telefone && (
        <p className="text-sm text-gray-600 mb-3">{lead.telefone}</p>
      )}
      
      {/* Email do lead se existir */}
      {lead.email && (
        <p className="text-xs text-gray-500 mb-3 truncate">{lead.email}</p>
      )}
      
      {/* Tags e informações adicionais */}
      <div className="space-y-2">
        {/* Tag do lead */}
        {tagDoLead && (
          <div className="flex items-center gap-1">
            <Tag size={12} className="text-gray-400" />
            <span 
              className="text-xs px-2 py-1 rounded-full text-white font-medium"
              style={{ backgroundColor: tagDoLead.cor }}
            >
              {tagDoLead.nome}
            </span>
          </div>
        )}

        {/* Origem do lead */}
        {lead.origem_lead && (
          <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
            {lead.origem_lead}
          </span>
        )}

        {/* Serviço de interesse */}
        {lead.servico_interesse && (
          <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
            {lead.servico_interesse}
          </span>
        )}
      </div>
      
      {/* Notas do lead (preview) */}
      {lead.anotacoes && (
        <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">
          {lead.anotacoes}
        </p>
      )}
    </div>
  );
};
