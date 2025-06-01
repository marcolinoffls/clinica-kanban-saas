
// src/components/kanban/LeadCard.tsx

import React from 'react';
import { History, MessageCircle, Tag } from 'lucide-react';
import { Lead } from './KanbanBoard';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenChat: () => void;
  columnId: string; // ESSENCIAL para drag and drop funcionar corretamente
}

/**
 * Componente visual de um card de lead no Kanban.
 * - Permite drag and drop entre colunas.
 * - Mostra informações do lead e botões de ação.
 */
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
   * Handler para início do drag.
   * Define todos os dados necessários no dataTransfer para máxima compatibilidade.
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('[LeadCard] 🚀 Iniciando drag do lead:', lead.nome, 'da coluna:', columnId);
    
    // Define a referência global (método primário)
    window.__DRAGGED_LEAD__ = {
      id: lead.id,
      fromColumnId: columnId
    };
  
    // Define dados no dataTransfer (método de fallback)
    const dragData = {
      type: 'leadCard',
      leadId: lead.id,
      fromColumnId: columnId
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', `leadCard:${lead.id}:${columnId}`);
  
    // Configurações de feedback visual
    e.currentTarget.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
  };
  
  /**
   * Handler para fim do drag.
   * Limpa referências globais e restaura feedback visual.
   */
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('[LeadCard] 🏁 Finalizando drag do lead:', lead.nome);
    
    // Limpa a referência global
    window.__DRAGGED_LEAD__ = null;
    
    // Restaura a opacidade
    e.currentTarget.style.opacity = '1';
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
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onEdit}
      data-lead-id={lead.id}
    >
      {/* Botões de ação (chat, histórico) aparecem no hover */}
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
