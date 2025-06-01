
// Extensão dos tipos globais para suportar drag and drop de leads
declare global {
  interface Window {
    __DRAGGED_LEAD__: {
      id: string;
      fromColumnId: string;
    } | null;
  }
}

export {};
