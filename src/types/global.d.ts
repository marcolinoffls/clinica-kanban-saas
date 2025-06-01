
interface DraggedLead {
  type: 'LEAD_CARD';
  id: string;
  fromColumnId: string;
}

interface DraggedColumn {
  type: 'COLUMN';
  id: string;
}

declare global {
  interface Window {
    __DRAGGED_LEAD__: DraggedLead | null;
    __DRAGGED_COLUMN__: DraggedColumn | null;
  }
}

export {};
