
import React from 'react';
import { MessageCircle, History, Edit } from 'lucide-react';
import { Lead } from '@/hooks/useLeadsData';

interface PipelineLeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenChat: () => void;
  columnId: string;
}

/**
 * Componente de card individual de lead no Pipeline
 * Similar ao LeadCard, mas com visual adaptado para pipeline
 */
export const PipelineLeadCard = ({ lead, onEdit, onOpenHistory, onOpenChat, columnId }: PipelineLeadCardProps) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    window.__DRAGGED_LEAD__ = {
      id: lead.id,
      fromColumnId: columnId
    };
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      leadId: lead.id,
      fromColumnId: columnId
    }));
    
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    window.__DRAGGED_LEAD__ = null;
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div
      className="bg-white rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-4 border-l-purple-500"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-lead-id={lead.id}
    >
      {/* Header com nome do lead */}
      <div className="mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">
          {lead.nome}
        </h4>
      </div>

      {/* Informações de contato */}
      <div className="space-y-1 mb-3">
        {lead.telefone && (
          <p className="text-xs text-gray-600 truncate">
            📱 {lead.telefone}
          </p>
        )}
        {lead.email && (
          <p className="text-xs text-gray-600 truncate">
            ✉️ {lead.email}
          </p>
        )}
        {lead.origem_lead && (
          <p className="text-xs text-purple-600 truncate">
            📍 {lead.origem_lead}
          </p>
        )}
        {lead.servico_interesse && (
          <p className="text-xs text-green-600 truncate">
            🎯 {lead.servico_interesse}
          </p>
        )}
      </div>

      {/* Anotações (se houver) */}
      {lead.anotacoes && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 line-clamp-2">
            {lead.anotacoes}
          </p>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
            title="Editar lead"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={onOpenHistory}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Ver histórico"
          >
            <History size={12} />
          </button>
          <button
            onClick={onOpenChat}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Abrir chat"
          >
            <MessageCircle size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
