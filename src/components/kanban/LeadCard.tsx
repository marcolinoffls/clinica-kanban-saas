// src/components/kanban/LeadCard.tsx
import React from 'react';
import { History, MessageCircle, Tag } from 'lucide-react';
import { Lead } from './KanbanBoard'; // Certifique-se que KanbanBoard.tsx EXPORTE esta interface
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface LeadCardProps {
  lead: Lead;
  // index: number; // O índice pode ser útil para reordenação interna da coluna, mas não é estritamente necessário para mover entre colunas.
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenChat: () => void;
  columnId: string; // ID da coluna atual do lead
}

export const LeadCard = ({
  lead,
  onEdit,
  onOpenHistory,
  onOpenChat,
  columnId,
}: LeadCardProps) => {
  const { tags = [] } = useSupabaseData();
  const tagDoLead = Array.isArray(tags) ? tags.find(tag => tag.id === lead.tag_id) : undefined;

  /**
   * Inicia o arraste de um card de lead.
   * Define os dados a serem transferidos: 'leadId', 'fromColumnId' e 'itemType'.
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.setData('fromColumnId', columnId);
    e.dataTransfer.setData('itemType', 'leadCard'); // Identifica o tipo de item sendo arrastado
    e.dataTransfer.effectAllowed = 'move';
    // Adiciona uma classe para feedback visual enquanto o card está sendo arrastado
    e.currentTarget.classList.add('dragging-card');
  };

  /**
   * Finaliza o arraste do card de lead.
   * Remove a classe de feedback visual.
   */
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging-card');
  };

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
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab hover:shadow-md hover:border-gray-200 transition-all duration-200 relative group"
      draggable // Torna o card arrastável
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd} // Limpa o estilo ao final do arraste
      onClick={onEdit}
      data-lead-id={lead.id}
    >
      {/* Estilo para o card sendo arrastado (opcional, mas melhora UX) */}
      <style>{`.dragging-card { opacity: 0.7; border: 2px dashed #3B82F6; }`}</style>
      
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
        <button
          onClick={handleChatClick}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Abrir chat"
          aria-label="Abrir chat"
        >
          <MessageCircle size={14} />
        </button>
        <button
          onClick={handleHistoryClick}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Ver histórico"
          aria-label="Ver histórico"
        >
          <History size={14} />
        </button>
      </div>

      <h4 className="font-semibold text-gray-900 mb-2 pr-16 text-sm leading-tight truncate">
        {lead.nome}
      </h4>
      
      {lead.telefone && (
        <p className="text-sm text-gray-600 mb-3">{lead.telefone}</p>
      )}
      
      {lead.email && (
        <p className="text-xs text-gray-500 mb-3 truncate">{lead.email}</p>
      )}
      
      <div className="space-y-2">
        {tagDoLead && (
          <div className="flex items-center gap-1">
            <Tag size={12} className="text-gray-400 flex-shrink-0" />
            <span 
              className="text-xs px-2 py-1 rounded-full text-white font-medium"
              style={{ backgroundColor: tagDoLead.cor || '#6B7280' }}
            >
              {tagDoLead.nome}
            </span>
          </div>
        )}

        {lead.origem_lead && (
          <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
            {lead.origem_lead}
          </span>
        )}

        {lead.servico_interesse && (
          <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
            {lead.servico_interesse}
          </span>
        )}
      </div>
      
      {lead.anotacoes && (
        <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">
          {lead.anotacoes}
        </p>
      )}
    </div>
  );
};