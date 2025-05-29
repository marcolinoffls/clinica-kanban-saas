
import { Edit2, Trash2 } from 'lucide-react';
import { KanbanColumn as IKanbanColumn, Lead } from './KanbanBoard';
import { LeadCard } from './LeadCard';

/**
 * Componente de coluna do Kanban com drag and drop corrigido
 * 
 * CORREÇÕES APLICADAS:
 * - Separação clara entre eventos de drag de leads e etapas
 * - Prevenção de propagação de eventos conflitantes
 * - Validação de tipos de dados no dataTransfer
 * - Bloqueio de interações durante reordenação de etapas
 */

interface KanbanColumnProps {
  column: IKanbanColumn;
  leads: Lead[];
  corEtapa: string;
  onEditLead: (lead: Lead) => void;
  onOpenHistory: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onEditEtapa: () => void;
  onDeleteEtapa: () => void;
  // Props específicas para drag de leads
  onLeadDragStart: (leadId: string, fromEtapaId: string) => void;
  onLeadDragEnd: () => void;
  onLeadDrop: (leadId: string, fromEtapa: string, toEtapa: string) => void;
  draggedLead: string | null;
  etapaReorderMode: boolean;
}

export const KanbanColumn = ({ 
  column, 
  leads, 
  corEtapa,
  onEditLead, 
  onOpenHistory,
  onOpenChat,
  onEditEtapa,
  onDeleteEtapa,
  onLeadDragStart,
  onLeadDragEnd,
  onLeadDrop,
  draggedLead,
  etapaReorderMode
}: KanbanColumnProps) => {

  // ========== EVENTOS DE DRAG PARA LEADS ==========
  
  const handleLeadDragOver = (e: React.DragEvent) => {
    // Só permitir drop de leads quando NÃO estiver em modo de reordenação
    if (etapaReorderMode) return;
    
    e.preventDefault();
    e.stopPropagation(); // Evitar propagação para elementos pai
    e.dataTransfer.dropEffect = 'move';
  };

  const handleLeadDrop = (e: React.DragEvent) => {
    // Só processar drops de leads quando NÃO estiver em modo de reordenação
    if (etapaReorderMode) return;
    
    e.preventDefault();
    e.stopPropagation(); // Evitar propagação para elementos pai
    
    // Verificar se é um drop de lead válido
    const leadId = e.dataTransfer.getData('lead/id');
    const fromColumn = e.dataTransfer.getData('lead/fromColumn');
    
    if (!leadId || !fromColumn) {
      console.log('⚠️ Drop inválido - dados de lead ausentes');
      return;
    }
    
    if (fromColumn !== column.id) {
      console.log('✅ Processando drop de lead:', leadId, 'para etapa:', column.id);
      onLeadDrop(leadId, fromColumn, column.id);
    }
    
    onLeadDragEnd();
  };

  return (
    <div 
      className={`bg-gray-50 rounded-xl p-4 min-w-80 h-fit border border-gray-200 shadow-sm transition-all ${
        draggedLead && !etapaReorderMode 
          ? 'ring-2 ring-blue-200 bg-blue-50' 
          : ''
      } ${
        etapaReorderMode 
          ? 'pointer-events-none opacity-75' 
          : ''
      }`}
      onDragOver={handleLeadDragOver}
      onDrop={handleLeadDrop}
    >
      {/* Header da coluna */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {/* Círculo colorido identificador da etapa */}
          <div className={`w-3 h-3 rounded-full ${corEtapa}`}></div>
          
          <h3 className="font-semibold text-gray-800 text-sm">{column.title}</h3>
          
          {/* Botões de ação da etapa - desabilitados durante reordenação */}
          <div className={`flex gap-1 ${etapaReorderMode ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              onClick={onEditEtapa}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar nome da etapa"
              disabled={etapaReorderMode}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDeleteEtapa}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir etapa"
              disabled={etapaReorderMode}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        
        {/* Badge com contagem */}
        <span className="bg-white text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
          {leads.length}
        </span>
      </div>

      {/* Lista de cards dos leads */}
      <div className="space-y-3 min-h-[120px]">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead(lead)}
            onOpenHistory={() => onOpenHistory(lead)}
            onOpenChat={() => onOpenChat(lead)}
            columnId={column.id}
            onDragStart={onLeadDragStart}
            onDragEnd={onLeadDragEnd}
            isDragged={draggedLead === lead.id}
            etapaReorderMode={etapaReorderMode}
          />
        ))}
        
        {/* Placeholder para colunas vazias */}
        {leads.length === 0 && (
          <div className={`text-center py-12 border-2 border-dashed border-gray-200 rounded-lg transition-colors ${
            draggedLead && !etapaReorderMode 
              ? 'border-blue-300 bg-blue-50' 
              : ''
          }`}>
            <div className="text-gray-400 text-sm">
              <p className="font-medium mb-1">Nenhum lead aqui</p>
              <p className="text-xs">
                {etapaReorderMode 
                  ? 'Modo de reordenação ativo' 
                  : 'Arraste leads para esta etapa'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Indicador visual durante drag de lead */}
      {draggedLead && !etapaReorderMode && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-400 rounded-xl bg-blue-50 bg-opacity-20"></div>
      )}
    </div>
  );
};
