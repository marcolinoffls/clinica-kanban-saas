
import React from 'react';
import { MessageCircle, History, Edit } from 'lucide-react';
import { LeadPipeline } from './types';

/**
 * Componente de card individual de lead no Pipeline
 * 
 * Representa um lead dentro de uma coluna do pipeline.
 * Permite arrastar o lead para outras colunas e oferece
 * ações para editar, ver histórico e abrir chat.
 */

interface PipelineLeadCardProps {
  lead: LeadPipeline;
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenChat: () => void;
  columnId: string;
}

export const PipelineLeadCard = ({ 
  lead, 
  onEdit, 
  onOpenHistory, 
  onOpenChat, 
  columnId 
}: PipelineLeadCardProps) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🎯 Iniciando drag do lead:', lead.id);
    
    // Armazenar dados do drag globalmente
    window.__DRAGGED_LEAD__ = {
      id: lead.id,
      fromColumnId: columnId
    };
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      leadId: lead.id,
      fromColumnId: columnId
    }));
    
    // Feedback visual durante o drag
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🏁 Finalizando drag do lead');
    
    // Limpar dados globais
    window.__DRAGGED_LEAD__ = null;
    
    // Restaurar opacidade
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div
      className="bg-white rounded-lg border shadow-sm p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-500"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-lead-id={lead.id}
    >
      {/* Header com nome do lead */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 text-sm leading-tight">
          {lead.nome}
        </h4>
      </div>

      {/* Informações de contato */}
      <div className="space-y-1 mb-4">
        {lead.telefone && (
          <p className="text-xs text-gray-600 truncate flex items-center gap-1">
            <span>📱</span> {lead.telefone}
          </p>
        )}
        {lead.email && (
          <p className="text-xs text-gray-600 truncate flex items-center gap-1">
            <span>✉️</span> {lead.email}
          </p>
        )}
        {lead.origem_lead && (
          <p className="text-xs text-purple-600 truncate flex items-center gap-1">
            <span>📍</span> {lead.origem_lead}
          </p>
        )}
        {lead.servico_interesse && (
          <p className="text-xs text-green-600 truncate flex items-center gap-1">
            <span>🎯</span> {lead.servico_interesse}
          </p>
        )}
      </div>

      {/* Anotações (se houver) */}
      {lead.anotacoes && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 p-2 rounded">
            {lead.anotacoes}
          </p>
        </div>
      )}

      {/* Data do último contato */}
      {lead.data_ultimo_contato && (
        <div className="mb-4">
          <p className="text-xs text-gray-400">
            Último contato: {new Date(lead.data_ultimo_contato).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
            title="Editar lead"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistory();
            }}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Ver histórico"
          >
            <History size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat();
            }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Abrir chat"
          >
            <MessageCircle size={14} />
          </button>
        </div>
        
        {/* Indicador de drag */}
        <div className="text-gray-300">
          <span className="text-xs">⋮⋮</span>
        </div>
      </div>
    </div>
  );
};
