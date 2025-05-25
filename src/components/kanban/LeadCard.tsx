
import { History, MessageCircle } from 'lucide-react';
import { Lead } from './KanbanBoard';

/**
 * Componente que representa um card de lead no Kanban
 * 
 * Funcionalidades:
 * - Exibe informações do lead (nome, telefone, tag)
 * - Suporte a drag and drop
 * - Click para editar lead
 * - Botão para ver histórico de consultas
 * - Botão para abrir chat com o lead
 * - Tag colorida para categorização
 * 
 * Props:
 * - lead: dados do lead
 * - onEdit: função para editar o lead
 * - onOpenHistory: função para abrir histórico
 * - onOpenChat: função para abrir chat
 * - columnId: id da coluna atual (para drag and drop)
 */

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenChat: () => void;
  columnId: string;
}

export const LeadCard = ({ lead, onEdit, onOpenHistory, onOpenChat, columnId }: LeadCardProps) => {
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
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative"
      draggable
      onDragStart={handleDragStart}
      onClick={onEdit}
    >
      {/* Botões de ação no topo */}
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={handleChatClick}
          className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
          title="Abrir chat"
        >
          <MessageCircle size={14} />
        </button>
        <button
          onClick={handleHistoryClick}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Ver histórico de consultas"
        >
          <History size={14} />
        </button>
      </div>

      {/* Nome do lead */}
      <h4 className="font-medium text-gray-900 mb-2 pr-12">{lead.nome}</h4>
      
      {/* Telefone do lead */}
      <p className="text-sm text-gray-600 mb-3">{lead.telefone}</p>
      
      {/* Email do lead se existir */}
      {lead.email && (
        <p className="text-xs text-gray-500 mb-2">{lead.email}</p>
      )}
      
      {/* Notas do lead (preview) */}
      {lead.anotacoes && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {lead.anotacoes}
        </p>
      )}

      {/* LTV se existir */}
      {lead.ltv && lead.ltv > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-green-600">
            LTV: R$ {Number(lead.ltv).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};
