// src/components/kanban/LeadCard.tsx
import React from 'react'; // Importa React para usar JSX e tipos de eventos
import { History, MessageCircle, Tag } from 'lucide-react';
// Importa a interface Lead do KanbanBoard para consistência de tipos
// É crucial que KanbanBoard.tsx EXPORTE essa interface.
import { Lead } from './KanbanBoard';
import { useSupabaseData } from '@/hooks/useSupabaseData';

/**
 * Card de lead aprimorado com design moderno.
 * Este componente representa um lead individual no quadro Kanban.
 * Ele é arrastável e exibe informações resumidas do lead.
 */

interface LeadCardProps {
  lead: Lead; // Objeto contendo os dados do lead
  onEdit: () => void; // Função chamada quando o card é clicado para edição
  onOpenHistory: () => void; // Função para abrir o modal de histórico do lead
  onOpenChat: () => void; // Função para abrir o chat com o lead
  columnId: string; // ID da coluna (etapa) em que o card está atualmente
}

export const LeadCard = ({ lead, onEdit, onOpenHistory, onOpenChat, columnId }: LeadCardProps) => {
  // Hook para buscar dados globais, incluindo a lista de tags.
  // Garante que 'tags' seja um array, mesmo que vazio, para evitar erros.
  const { tags = [] } = useSupabaseData();
  
  // Encontra o objeto da tag associada a este lead, se houver.
  // Garante que 'tags' seja um array antes de usar 'find'.
  const tagDoLead = Array.isArray(tags) ? tags.find(tag => tag.id === lead.tag_id) : undefined;

  /**
   * Manipulador para o evento onDragStart.
   * Chamado quando o usuário começa a arrastar o card.
   * Define os dados que serão transferidos durante a operação de drag and drop.
   * - 'leadId': O ID do lead que está sendo arrastado.
   * - 'fromColumnId': O ID da coluna de onde o lead está sendo arrastado.
   * @param e - O evento de drag.
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('leadId', lead.id);
    // Nome da chave corrigido para 'fromColumnId' para consistência com KanbanColumn.tsx
    e.dataTransfer.setData('fromColumnId', columnId); 
    // Define o efeito visual permitido para a operação de drag (ex: "move")
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * Manipulador de clique para o botão de histórico.
   * Previne a propagação do evento de clique para o div pai (que chamaria onEdit).
   * @param e - O evento de clique do mouse.
   */
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão acione o onClick do card (onEdit)
    onOpenHistory();
  };

  /**
   * Manipulador de clique para o botão de chat.
   * Previne a propagação do evento de clique para o div pai.
   * @param e - O evento de clique do mouse.
   */
  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão acione o onClick do card (onEdit)
    onOpenChat();
  };

  return (
    // Div principal do card, configurado para ser arrastável.
    // O evento onClick (para edição) é aplicado a todo o card.
    <div
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab hover:shadow-md hover:border-gray-200 transition-all duration-200 relative group" // cursor-grab para indicar que é arrastável
      draggable // Habilita a funcionalidade de drag and drop para este elemento
      onDragStart={handleDragStart} // Define o que acontece quando o arraste começa
      onClick={onEdit} // Define o que acontece ao clicar no card
      // Adiciona um data attribute para facilitar testes ou estilizações específicas
      data-lead-id={lead.id}
    >
      {/* Botões de ação flutuantes (chat, histórico) que aparecem no hover */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
        <button
          onClick={handleChatClick}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Abrir chat"
          aria-label="Abrir chat" // Para acessibilidade
        >
          <MessageCircle size={14} />
        </button>
        <button
          onClick={handleHistoryClick}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Ver histórico"
          aria-label="Ver histórico" // Para acessibilidade
        >
          <History size={14} />
        </button>
      </div>

      {/* Nome do lead */}
      <h4 className="font-semibold text-gray-900 mb-2 pr-16 text-sm leading-tight truncate"> 
        {/* pr-16 para dar espaço aos botões flutuantes; truncate para nomes longos */}
        {lead.nome}
      </h4>

      {/* Telefone do lead, se disponível */}
      {lead.telefone && (
        <p className="text-sm text-gray-600 mb-3">{lead.telefone}</p>
      )}

      {/* Email do lead, se disponível */}
      {lead.email && (
        <p className="text-xs text-gray-500 mb-3 truncate">{lead.email}</p>
      )}

      {/* Container para tags e outras informações do lead */}
      <div className="space-y-2">
        {/* Exibição da tag do lead, se existir e for encontrada */}
        {tagDoLead && (
          <div className="flex items-center gap-1">
            <Tag size={12} className="text-gray-400 flex-shrink-0" /> {/* flex-shrink-0 para não encolher o ícone */}
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: tagDoLead.cor || '#6B7280' }} // Fallback de cor se não definida
            >
              {tagDoLead.nome}
            </span>
          </div>
        )}

        {/* Exibição da origem do lead, se disponível */}
        {lead.origem_lead && (
          <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
            {lead.origem_lead}
          </span>
        )}

        {/* Exibição do serviço de interesse, se disponível */}
        {lead.servico_interesse && (
          <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
            {lead.servico_interesse}
          </span>
        )}
      </div>

      {/* Preview das anotações do lead, se existirem */}
      {lead.anotacoes && (
        <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">
          {/* line-clamp-2 limita a exibição a duas linhas */}
          {lead.anotacoes}
        </p>
      )}
    </div>
  );
};