
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Tag } from 'lucide-react';

/**
 * Barra de ações em massa para contatos selecionados
 * 
 * Permite executar ações em lote como:
 * - Exportar contatos selecionados
 * - Deletar contatos em massa
 * - Atualizar status/etapa em massa
 * 
 * ONDE É USADO:
 * - ClientsPage quando há contatos selecionados
 */
interface ClientsActionsBarProps {
  selectedCount: number;
  onExport: () => Promise<void>;
  onDelete: () => Promise<void>;
  onStatusUpdate: (etapaId: string) => Promise<void>;
  isExporting: boolean;
}

export const ClientsActionsBar: React.FC<ClientsActionsBarProps> = ({
  selectedCount,
  onExport,
  onDelete,
  onStatusUpdate,
  isExporting,
}) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {selectedCount} contatos selecionados
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusUpdate('')}
            className="flex items-center gap-1"
          >
            <Tag className="h-4 w-4" />
            Alterar Status
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Deletar
          </Button>
        </div>
      </div>
    </div>
  );
};
