
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

/**
 * Modal para mover leads ao deletar uma etapa
 * 
 * Funcionalidades:
 * - Exibir leads que serão afetados pela exclusão
 * - Permitir seleção da etapa de destino
 * - Confirmar a movimentação dos leads
 */

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
}

interface Lead {
  id: string;
  nome: string;
}

interface MoveLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  etapaToDelete: Etapa | null;
  leads: Lead[];
  availableEtapas: Etapa[];
  onConfirm: (targetEtapaId: string) => Promise<void>;
}

export const MoveLeadsModal = ({
  isOpen,
  onClose,
  etapaToDelete,
  leads,
  availableEtapas,
  onConfirm
}: MoveLeadsModalProps) => {
  const [selectedEtapaId, setSelectedEtapaId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedEtapaId) return;

    try {
      setLoading(true);
      await onConfirm(selectedEtapaId);
      onClose();
    } catch (error) {
      console.error('Erro ao mover leads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!etapaToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Mover Leads
          </DialogTitle>
          <DialogDescription>
            A etapa "{etapaToDelete.nome}" possui {leads.length} lead(s). 
            Selecione para onde deseja movê-los antes de excluir a etapa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de leads */}
          <div>
            <h4 className="font-medium text-sm mb-2">Leads que serão movidos:</h4>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              {leads.map((lead) => (
                <div key={lead.id} className="text-sm py-1">
                  • {lead.nome}
                </div>
              ))}
            </div>
          </div>

          {/* Seleção da etapa de destino */}
          <div>
            <label className="font-medium text-sm mb-2 block">
              Etapa de destino:
            </label>
            <Select value={selectedEtapaId} onValueChange={setSelectedEtapaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma etapa" />
              </SelectTrigger>
              <SelectContent>
                {availableEtapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={etapa.id}>
                    {etapa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedEtapaId || loading}
          >
            {loading ? 'Movendo...' : 'Mover e Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
