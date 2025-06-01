
import React from 'react';
import { MessageCircle, History, Edit } from 'lucide-react';

/**
 * Interface local para Lead no componente LeadCard
 * Usa propriedades básicas necessárias para renderização do card
 */
interface LeadCardProps {
  lead: {
    id: string;
    nome: string;
    telefone?: string | null;
    email?: string | null;
    anotacoes?: string | null;
    origem_lead?: string | null;
    servico_interesse?: string | null;
  };
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenChat: () => void;
  columnId: string;
}

/**
 * Componente de card individual de lead no Kanban
 * - Renderiza informações básicas do lead
 * - Permite drag and drop entre colunas
 * - Botões de ação: editar, histórico, chat
 */
export const LeadCard = ({ lead, onEdit, onOpenHistory, onOpenChat, columnId }: LeadCardProps) => {
  /**
   * Handler para início do drag
   * Define os dados necessários para o drop na variável global
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🟢 [LeadCard] DRAG START - Lead:', lead.nome, 'ID:', lead.id);
    
    // Define dados na variável global para comunicação entre componentes
    window.__DRAGGED_LEAD__ = {
      id: lead.id,
      fromColumnId: columnId
    };
    
    // Configura o dataTransfer para fallback
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      leadId: lead.id,
      fromColumnId: columnId
    }));
    
    // Aplica feedback visual durante o drag
    e.currentTarget.style.opacity = '0.5';
    
    console.log('🟢 [LeadCard] Dados definidos:', window.__DRAGGED_LEAD__);
  };

  /**
   * Handler para fim do drag
   * Limpa os dados globais e restaura a aparência
   */
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🔴 [LeadCard] DRAG END - Lead:', lead.nome);
    
    // Limpa dados globais
    window.__DRAGGED_LEAD__ = null;
    
    // Restaura aparência
    e.currentTarget.style.opacity = '1';
    
    console.log('🔴 [LeadCard] Dados limpos');
  };

  return (
    <div
      className="bg-white rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
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
          <p className="text-xs text-blue-600 truncate">
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
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Editar lead"
            aria-label={`Editar lead ${lead.nome}`}
          >
            <Edit size={12} />
          </button>
          <button
            onClick={onOpenHistory}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Ver histórico"
            aria-label={`Ver histórico de ${lead.nome}`}
          >
            <History size={12} />
          </button>
          <button
            onClick={onOpenChat}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
            title="Abrir chat"
            aria-label={`Abrir chat com ${lead.nome}`}
          >
            <MessageCircle size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
