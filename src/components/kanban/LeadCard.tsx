
import { History, MessageCircle, Tag } from 'lucide-react';
import { Lead } from './KanbanBoard';
import { useSupabaseData } from '@/hooks/useSupabaseData';

/**
 * Card de lead com drag and drop isolado e corrigido
 * 
 * CORREÇÕES APLICADAS:
 * - Eventos de drag específicos para leads
 * - Dados únicos no dataTransfer para evitar conflitos
 * - Prevenção de drag durante reordenação de etapas
 * - Feedback visual melhorado durante drag
 */

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onOpenHistory: () => void;
  onOpenChat: () => void;
  columnId: string;
  onDragStart: (leadId: string, fromEtapaId: string) => void;
  onDragEnd: () => void;
  isDragged: boolean;
  etapaReorderMode: boolean;
}

export const LeadCard = ({ 
  lead, 
  onEdit, 
  onOpenHistory, 
  onOpenChat, 
  columnId,
  onDragStart,
  onDragEnd,
  isDragged,
  etapaReorderMode
}: LeadCardProps) => {
  // Buscar dados das tags para exibir cor
  const { tags } = useSupabaseData();
  const tagDoLead = tags.find(tag => tag.id === lead.tag_id);

  // ========== EVENTOS DE DRAG ESPECÍFICOS PARA LEADS ==========
  
  const handleDragStart = (e: React.DragEvent) => {
    // Prevenir drag durante reordenação de etapas
    if (etapaReorderMode) {
      e.preventDefault();
      return;
    }
    
    console.log('🔄 Iniciando drag de lead:', lead.id, 'da coluna:', columnId);
    
    // Usar prefixos específicos para evitar conflitos
    e.dataTransfer.setData('lead/id', lead.id);
    e.dataTransfer.setData('lead/fromColumn', columnId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Informar ao componente pai
    onDragStart(lead.id, columnId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('✅ Finalizando drag de lead:', lead.id);
    onDragEnd();
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
      className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 relative group ${
        etapaReorderMode 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:shadow-md hover:border-gray-200'
      } ${
        isDragged 
          ? 'opacity-60 scale-95 rotate-2 shadow-lg z-10' 
          : ''
      }`}
      draggable={!etapaReorderMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={etapaReorderMode ? undefined : onEdit}
      title={etapaReorderMode ? 'Modo de reordenação ativo - edição de leads desabilitada' : 'Clique para editar lead'}
    >
      {/* Botões de ação no topo - desabilitados durante reordenação */}
      <div className={`absolute top-3 right-3 flex gap-1 transition-opacity ${
        etapaReorderMode 
          ? 'opacity-0 pointer-events-none' 
          : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          onClick={handleChatClick}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Abrir chat"
          disabled={etapaReorderMode}
        >
          <MessageCircle size={14} />
        </button>
        <button
          onClick={handleHistoryClick}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Ver histórico"
          disabled={etapaReorderMode}
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

      {/* Indicador visual durante drag */}
      {isDragged && (
        <div className="absolute inset-0 bg-blue-100 border-2 border-blue-400 border-dashed rounded-xl opacity-50 pointer-events-none"></div>
      )}

      {/* Overlay durante modo de reordenação */}
      {etapaReorderMode && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-xl flex items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-600 font-medium">Reordenação ativa</span>
        </div>
      )}
    </div>
  );
};
