
import React, { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { PipelineLeadCard } from './PipelineLeadCard';
import { LeadPipeline, EtapaPipeline } from './types';

/**
 * Componente de coluna do Pipeline de Vendas
 * 
 * Representa uma etapa do funil de vendas, contendo
 * leads e permitindo operações de drag and drop.
 */

interface PipelineColumnProps {
  etapa: EtapaPipeline;
  leads: LeadPipeline[];
  corEtapa: string;
  onEditLead: (lead: LeadPipeline) => void;
  onDropLeadInColumn: (leadId: string, fromColumnId: string, toColumnId: string) => void;
  onOpenHistory: (lead: LeadPipeline) => void;
  onOpenChat: (lead: LeadPipeline) => void;
  onEditEtapa: () => void;
  onDeleteEtapa: () => void;
  onCreateLead: (etapaId: string) => void;
  isDraggedColumn?: boolean;
}

export const PipelineColumn = ({
  etapa,
  leads,
  corEtapa,
  onEditLead,
  onDropLeadInColumn,
  onOpenHistory,
  onOpenChat,
  onEditEtapa,
  onDeleteEtapa,
  onCreateLead,
  isDraggedColumn = false,
}: PipelineColumnProps) => {
  const [isDragOverForLeadCard, setIsDragOverForLeadCard] = useState(false);

  // Verificação de segurança para props obrigatórias
  if (!etapa?.id || !etapa?.nome) {
    console.warn('PipelineColumn: etapa inválida recebida', etapa);
    return null;
  }

  // Garantir que leads seja sempre um array
  const validLeads = React.useMemo(() => {
    return Array.isArray(leads) ? leads.filter(lead => lead?.id) : [];
  }, [leads]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Verificar se é um lead sendo arrastado (não uma coluna)
    const draggedLead = window.__DRAGGED_LEAD__;
    const draggedColumn = window.__DRAGGED_COLUMN__;
    
    if (draggedLead && draggedLead.type === 'LEAD_CARD') {
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOverForLeadCard) {
        setIsDragOverForLeadCard(true);
      }
    } else if (draggedColumn && draggedColumn.type === 'COLUMN') {
      // Não fazer nada - o drag de coluna é gerenciado pelo PipelineBoard
      e.dataTransfer.dropEffect = 'none';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Só remove o highlight se realmente saiu da coluna
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverForLeadCard(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Importante: parar propagação
    setIsDragOverForLeadCard(false);
    
    console.log('📦 Drop na coluna:', etapa.id);
    
    // Verificar se é um lead sendo solto (não uma coluna)
    const draggedLeadData = window.__DRAGGED_LEAD__;
    
    if (!draggedLeadData || draggedLeadData.type !== 'LEAD_CARD') {
      console.warn('⚠️ Drop inválido - não é um lead ou dados ausentes');
      return;
    }
    
    const { id: leadId, fromColumnId } = draggedLeadData;
    
    if (!leadId || !fromColumnId) {
      console.warn('⚠️ Dados incompletos do lead arrastado');
      return;
    }
    
    // Não fazer nada se for a mesma coluna
    if (fromColumnId === etapa.id) {
      console.log('ℹ️ Lead dropped na mesma coluna');
      return;
    }
    
    // Executar ação de mover lead
    if (onDropLeadInColumn) {
      onDropLeadInColumn(leadId, fromColumnId, etapa.id);
    }
  };

  const handleColumnMouseDown = (e: React.MouseEvent) => {
    // Só iniciar drag da coluna se o clique for na área do header
    const target = e.target as HTMLElement;
    const isHeaderArea = target.closest('[data-column-header]');
    
    if (!isHeaderArea) {
      e.stopPropagation();
    }
  };

  const handleEditEtapa = () => {
    if (onEditEtapa) {
      onEditEtapa();
    }
  };

  const handleDeleteEtapa = () => {
    if (onDeleteEtapa) {
      onDeleteEtapa();
    }
  };

  const handleCreateLead = () => {
    if (onCreateLead && etapa.id) {
      onCreateLead(etapa.id);
    }
  };

  return (
    <div
      className={`
        bg-gray-50 rounded-xl p-4 min-w-[22rem] w-80 h-full border shadow-sm 
        flex flex-col transition-all duration-150
        ${isDragOverForLeadCard ? 'bg-purple-100 border-purple-400 border-dashed border-2' : 'border-gray-200'} 
        ${isDraggedColumn ? 'opacity-40 scale-95' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleColumnMouseDown}
      data-column-id={etapa.id}
      data-drag-type="column"
    >
      {/* Header da coluna */}
      <div 
        className="flex justify-between items-center mb-4 group cursor-grab active:cursor-grabbing"
        data-column-header
      >
        <div className="flex items-center gap-3">
          {/* Indicador de cor da etapa */}
          <div 
            className={`w-4 h-4 rounded-full ${corEtapa || 'bg-gray-400'}`}
            title={`Etapa: ${etapa.nome}`}
          />
          <h3 className="font-bold text-gray-900 text-sm">
            {etapa.nome}
          </h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            {validLeads.length}
          </span>
        </div>
        
        {/* Botões de ação da etapa */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCreateLead();
            }}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Adicionar lead nesta etapa"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditEtapa();
            }}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Editar etapa"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteEtapa();
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir etapa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Lista de leads */}
      <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
        {validLeads.map((lead) => (
          <PipelineLeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead && onEditLead(lead)}
            onOpenHistory={() => onOpenHistory && onOpenHistory(lead)}
            onOpenChat={() => onOpenChat && onOpenChat(lead)}
            columnId={etapa.id}
          />
        ))}
        
        {/* Placeholder quando não há leads */}
        {validLeads.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-300 mb-2">
              <Plus size={32} className="mx-auto" />
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Nenhum lead nesta etapa
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateLead();
              }}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Adicionar primeiro lead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
