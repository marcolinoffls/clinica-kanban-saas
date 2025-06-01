
/**
 * Tipagens globais para funcionalidades customizadas do projeto
 */

declare global {
  interface Window {
    /**
     * Dados temporários do lead sendo arrastado no Kanban
     * Usado para comunicação entre LeadCard e KanbanColumn durante drag and drop
     */
    __DRAGGED_LEAD__: {
      id: string;
      fromColumnId: string;
    } | null;
  }
}

export {};
