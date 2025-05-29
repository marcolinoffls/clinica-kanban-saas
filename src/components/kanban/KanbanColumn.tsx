// src/components/kanban/KanbanColumn.tsx
import React from 'react'; // Importa React para usar JSX e tipos de eventos
import { Edit2, Trash2 } from 'lucide-react';
// Importa as interfaces Lead e IKanbanColumn do KanbanBoard para consistência de tipos
// É crucial que KanbanBoard.tsx EXPORTE essas interfaces.
import { Lead, IKanbanColumn } from './KanbanBoard';
import { LeadCard } from './LeadCard';

/**
 * Componente de coluna do Kanban.
 * Exibe uma etapa do funil e os leads pertencentes a ela.
 * Permite arrastar leads para esta coluna.
 */

// Define as props esperadas pelo componente KanbanColumn
interface KanbanColumnProps {
  column: IKanbanColumn; // Dados da coluna (id, título, ids dos leads)
  leads: Lead[]; // Array de objetos Lead que pertencem a esta coluna
  corEtapa: string; // Classe CSS para a cor da etapa (ex: 'bg-blue-500')
  onEditLead: (lead: Lead) => void; // Função para chamar ao editar um lead
  onMoveCard: (leadId: string, fromColumnId: string, toColumnId: string) => void; // Função para mover um card de lead
  onOpenHistory: (lead: Lead) => void; // Função para abrir o histórico do lead
  onOpenChat: (lead: Lead) => void; // Função para abrir o chat com o lead
  onEditEtapa: () => void; // Função para editar a etapa/coluna
  onDeleteEtapa: () => void; // Função para deletar a etapa/coluna
}

export const KanbanColumn = ({
  column,
  leads,
  corEtapa,
  onEditLead,
  onMoveCard,
  onOpenHistory,
  onOpenChat,
  onEditEtapa,
  onDeleteEtapa,
}: KanbanColumnProps) => {
  /**
   * Manipulador para o evento onDragOver.
   * Previne o comportamento padrão do navegador para permitir que um drop ocorra.
   * @param e - O evento de drag.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessário para permitir que o evento onDrop seja disparado
    // Opcionalmente, pode-se adicionar feedback visual aqui (ex: mudar a borda da coluna)
    // e.dataTransfer.dropEffect = "move"; // Indica o tipo de operação permitida
  };

  /**
   * Manipulador para o evento onDrop.
   * Chamado quando um item arrastável (um LeadCard) é solto sobre esta coluna.
   * Extrai os dados do lead (leadId e coluna de origem) e chama a função onMoveCard.
   * @param e - O evento de drag.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Previne o comportamento padrão (ex: abrir como link)
    
    // Extrai os dados que foram definidos no onDragStart do LeadCard
    const leadId = e.dataTransfer.getData('leadId');
    const fromColumnId = e.dataTransfer.getData('fromColumnId'); // Certifique-se que 'fromColumnId' é o nome correto usado no setData

    // Verifica se os dados necessários estão presentes e se a coluna de origem é diferente da atual
    if (leadId && fromColumnId && fromColumnId !== column.id) {
      // Chama a função passada por props para efetivamente mover o card/lead
      onMoveCard(leadId, fromColumnId, column.id);
    } else if (leadId && fromColumnId === column.id) {
      // Opcional: Lidar com o caso de soltar o card na mesma coluna (ex: reordenar dentro da coluna, se implementado)
      console.log(`Lead ${leadId} solto na mesma coluna ${column.id}. Nenhuma ação de movimentação entre colunas.`);
    }
  };

  return (
    // O div principal da coluna.
    // - onDragOver e onDrop são para receber os LeadCards arrastados.
    // - Não é mais 'draggable' por si só para evitar conflito com o drag dos cards.
    <div
      className="bg-gray-50 rounded-xl p-4 min-w-80 h-fit border border-gray-200 shadow-sm flex flex-col" // Adicionado flex flex-col para melhor controle da altura
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      // Adiciona um data attribute para facilitar testes ou estilizações específicas
      data-column-id={column.id}
    >
      {/* Header da coluna: título, cor, contagem de leads e botões de ação da etapa */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {/* Círculo colorido para identificar visualmente a etapa */}
          <div className={`w-3 h-3 rounded-full ${corEtapa}`}></div>
          {/* Título da coluna/etapa */}
          <h3 className="font-semibold text-gray-800 text-sm">{column.title}</h3>
          {/* Botões para editar e deletar a etapa */}
          <div className="flex gap-1">
            <button
              onClick={onEditEtapa} // Chama a função de editar etapa passada via props
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar nome da etapa"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDeleteEtapa} // Chama a função de deletar etapa passada via props
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir etapa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {/* Badge com a contagem de leads na coluna */}
        <span className="bg-white text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
          {leads.length}
        </span>
      </div>

      {/* Container para os cards de leads */}
      {/* min-h-[120px] para dar uma área mínima de drop mesmo se vazia */}
      {/* Adicionado flex-grow e overflow-y-auto para permitir scroll interno se muitos cards */}
      <div className="space-y-3 min-h-[120px] flex-grow overflow-y-auto">
        {/* Mapeia e renderiza cada LeadCard */}
        {/* Verifica se 'leads' é um array antes de mapear para evitar erros */}
        {Array.isArray(leads) && leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={() => onEditLead(lead)}
            onOpenHistory={() => onOpenHistory(lead)}
            onOpenChat={() => onOpenChat(lead)}
            columnId={column.id} // Passa o ID da coluna atual para o LeadCard, útil para onDragStart
          />
        ))}

        {/* Placeholder visual para colunas vazias, indicando que é uma área de drop */}
        {(!Array.isArray(leads) || leads.length === 0) && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg h-full flex flex-col justify-center">
            <div className="text-gray-400 text-sm">
              <p className="font-medium mb-1">Nenhum lead aqui</p>
              <p className="text-xs">Arraste leads para esta etapa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};