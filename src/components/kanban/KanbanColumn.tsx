// src/components/kanban/KanbanColumn.tsx
import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Lead, IKanbanColumn } from './KanbanBoard'; // Assegure que KanbanBoard.tsx exporte estas interfaces
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
  column: IKanbanColumn;
  leads: Lead[];
  corEtapa: string;
  onEditLead: (lead: Lead) => void;
  onDropLeadInColumn: (leadId: string, fromColumnId: string, toColumnId: string) => void;
  onOpenHistory: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onEditEtapa: () => void;
  onDeleteEtapa: () => void;
  isColumnDragOverTarget?: boolean; // Para feedback visual de arraste de *outra coluna* sobre esta
}

export const KanbanColumn = ({
  column,
  leads,
  corEtapa,
  onEditLead,
  onDropLeadInColumn,
  onOpenHistory,
  onOpenChat,
  onEditEtapa,
  onDeleteEtapa,
  isColumnDragOverTarget, // Usado para feedback visual quando ESTA coluna é um alvo de drop para OUTRA COLUNA
}: KanbanColumnProps) => {
  // Estado local para feedback visual quando um CARD de lead está sendo arrastado SOBRE esta coluna
  const [isDragOverForLeadCard, setIsDragOverForLeadCard] = useState(false);

  /**
   * Manipulador para onDragOver na coluna.
   * Chamado continuamente enquanto um item arrastável está sobre esta coluna.
   * É crucial chamar e.preventDefault() para permitir que o evento onDrop seja disparado.
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // NECESSÁRIO para permitir o drop.

    // Lê o tipo de item diretamente da chave 'itemType' definida em LeadCard.tsx
    const itemType = e.dataTransfer.getData('itemType');
    
    // Log para depuração: o que está sendo detectado durante o dragOver?
    console.log(
      `[KanbanColumn] 🟡 DragOver na coluna: "${column.nome}". Tipos no dataTransfer: [${Array.from(e.dataTransfer.types).join(', ')}]. Lido itemType: "${itemType}"`
    );

    if (itemType === 'leadCard') {
      e.dataTransfer.dropEffect = 'move'; // Indica ao navegador que uma operação de "mover" é permitida.
      if (!isDragOverForLeadCard) {
        // console.log(`[KanbanColumn] DragOver ENTER para LeadCard na coluna "${column.nome}"`);
        setIsDragOverForLeadCard(true); // Ativa o feedback visual de drop válido para card.
      }
    } else {
      e.dataTransfer.dropEffect = 'none'; // Nenhum drop permitido se não for um 'leadCard'.
      if (isDragOverForLeadCard) {
        // console.log(`[KanbanColumn] DragOver LEAVE para LeadCard (itemType inválido) na coluna "${column.nome}"`);
        setIsDragOverForLeadCard(false);
      }
    }
  };

  /**
   * Manipulador para onDragLeave na coluna.
   * Chamado quando um item arrastável sai da área desta coluna.
   * Limpa o feedback visual de drop.
   */
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Verifica se o mouse realmente saiu da área da coluna (e não apenas para um elemento filho)
    // Esta verificação ajuda a manter o estado de 'drag over' se o mouse passar por cima de um card dentro da coluna.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      // console.log(`[KanbanColumn] DragLeave da coluna "${column.nome}"`);
      setIsDragOverForLeadCard(false);
    }
  };

  /**
   * Manipulador para onDrop na coluna.
   * Chamado quando um item arrastável é SOLTO sobre esta coluna.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Previne o comportamento padrão do navegador (ex: abrir link se o dado for uma URL).
    setIsDragOverForLeadCard(false); // Limpa o feedback visual de drop.

    // Lê os dados diretamente usando as chaves EXATAS definidas em LeadCard.tsx -> handleDragStart.
    // A consistência nas chaves (incluindo maiúsculas/minúsculas) é crucial.
    const leadId = e.dataTransfer.getData('leadId');
    const fromColumnId = e.dataTransfer.getData('fromColumnId');
    const itemType = e.dataTransfer.getData('itemType');

    // Log detalhado dos dados recebidos no drop. Crucial para depuração.
    console.log(`[KanbanColumn] 🟢 Drop na coluna "${column.nome}". Dados recebidos:`, {
      leadIdLido: leadId,
      fromColumnIdLido: fromColumnId,
      toColumnIdDestino: column.id, // ID da coluna atual onde o item foi solto
      itemTypeLido: itemType,
      todosOsTiposNoDataTransfer: Array.from(e.dataTransfer.types) // Lista todos os formatos/chaves presentes no dataTransfer
    });

    // Validações para garantir que os dados necessários para mover um lead foram recebidos.
    if (!leadId) {
      console.warn('[KanbanColumn] ⚠️ Drop cancelado: leadId não foi encontrado no dataTransfer. Verifique se "leadId" foi setado corretamente no dragStart.');
      return;
    }
    if (!fromColumnId) {
      console.warn('[KanbanColumn] ⚠️ Drop cancelado: fromColumnId não foi encontrado no dataTransfer. Verifique se "fromColumnId" foi setado corretamente no dragStart.');
      return;
    }
     if (itemType !== 'leadCard') {
      console.warn(`[KanbanColumn] ⚠️ Drop cancelado: itemType lido foi "${itemType}", mas era esperado "leadCard". Verifique se "itemType" foi setado corretamente no dragStart.`);
      return;
    }

    // Evita chamar a função de mover se o lead foi solto na mesma coluna de onde saiu.
    // Se fosse implementada a reordenação de cards DENTRO da mesma coluna, a lógica aqui seria diferente.
    if (fromColumnId === column.id) {
      console.log(`[KanbanColumn] ⚪️ Lead "${leadId}" solto na mesma coluna de origem ("${column.nome}"). Nenhuma mudança de etapa necessária.`);
      return;
    }

    // Se todas as validações passaram e é um 'leadCard' sendo movido para uma NOVA coluna,
    // chama a função onDropLeadInColumn (passada por props) para lidar com a lógica de negócio
    // (geralmente, atualizar o backend e depois o estado da UI).
    console.log(`[KanbanColumn] ✅ Processando drop do lead "${leadId}" da coluna "${fromColumnId}" para a coluna "${column.id}" ("${column.nome}").`);
    onDropLeadInColumn(leadId, fromColumnId, column.id);
  };

  return (
    <div
      className={`bg-gray-50 rounded-xl p-4 min-w-80 w-80 h-full border shadow-sm flex flex-col transition-all duration-150 
                  ${isColumnDragOverTarget ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'} 
                  ${isDragOverForLeadCard ? 'bg-blue-100 border-blue-400 border-dashed' : ''} 
                  `} // Feedback visual: isColumnDragOverTarget (para drop de OUTRA coluna), isDragOverForLeadCard (para drop de CARD de lead)
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-column-id={column.id} // Atributo de dados para identificar a coluna, útil para testes ou debugging no DOM.
    >
      {/* Header da coluna: Nome, contador de leads e botões de ação (editar/excluir etapa) */}
      <div className="flex justify-between items-center mb-4 group"> {/* Adicionado 'group' para o hover dos botões de ação */}
        <div className="flex items-center gap-3">
          <div 
            className={`w-3 h-3 rounded-full ${corEtapa}`} // Cor da etapa definida dinamicamente
            title={`Cor da etapa: ${column.nome}`}
          />
          <h3 className="font-semibold text-gray-900 text-sm">
            {column.title || column.nome} {/* Usa 'title' se disponível, senão 'nome' */}
          </h3>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
            {leads.length} {/* Contador de leads na coluna */}
          </span>
        </div>
        
        {/* Botões de editar/excluir etapa, aparecem no hover da div pai com a classe 'group' */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={onEditEtapa}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar etapa"
            aria-label={`Editar etapa ${column.title || column.nome}`}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDeleteEtapa}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir etapa"
            aria-label={`Excluir etapa ${column.title || column.nome}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Container da Lista de leads (cards) */}
      <div className="flex-1 space-y-3 overflow-y-auto"> {/* Permite rolagem vertical se a lista de cards for maior que a altura disponível */}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id} // Chave React obrigatória e única para elementos em uma lista
            lead={lead}
            onEdit={() => onEditLead(lead)}
            onOpenHistory={() => onOpenHistory(lead)}
            onOpenChat={() => onOpenChat(lead)}
            columnId={column.id} // Passa o ID da coluna atual para o LeadCard, usado no dragStart
          />
        ))}
        
        {/* Placeholder visual quando não há leads na coluna */}
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
};