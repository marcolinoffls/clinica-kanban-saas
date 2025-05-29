import { History, MessageCircle, Tag } from 'lucide-react';
import { Lead } from './KanbanBoard';
import { useSupabaseData } from '@/hooks/useSupabaseData';

/**
 * Card de lead aprimorado com design moderno
 * 
 * Melhorias implementadas:
 * - Design moderno com bordas arredondadas
 * - Exibição de tags coloridas
 * - Melhor organização visual dos elementos
 * - Hover effects aprimorados
 */

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenChat: () => void;
  columnId: string;
}

export const LeadCard = ({ lead, onEdit, onOpenHistory, onOpenChat, columnId }: LeadCardProps) => {
  // Buscar dados das tags para exibir cor
  const { tags } = useSupabaseData();
  const tagDoLead = tags.find(tag => tag.id === lead.tag_id);

  // Configuração para arrastar o card
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.setData('fromColumn', columnId);
  };

  // Prevenir propagação de eventos dos botões
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenHistory();
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChat();
  };

  return (
    <div
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200 relative group"
      draggable
      onDragStart={handleDragStart}
      onClick={onEdit}
    >
      {/* Botões de ação no topo */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleChatClick}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Abrir chat"
        >
          <MessageCircle size={14} />
        </button>
        <button
          onClick={handleHistoryClick}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Ver histórico"
        >
          <History size={14} />
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
