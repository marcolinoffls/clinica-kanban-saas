
import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Modal para mover leads ao deletar uma etapa
 * 
 * Quando uma etapa possui leads, este modal é exibido para
 * que o usuário escolha para qual etapa mover os leads
 * antes de confirmar a exclusão da etapa.
 */

interface MoveLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetEtapaId: string) => void;
  etapaToDelete: { id: string; nome: string } | null;
  leadsCount: number;
  etapasDisponiveis: { id: string; nome: string }[];
}

export const MoveLeadsModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  etapaToDelete, 
  leadsCount, 
  etapasDisponiveis 
}: MoveLeadsModalProps) => {
  const [selectedEtapaId, setSelectedEtapaId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  const handleConfirm = async () => {
    if (!selectedEtapaId) return;
    
    setIsMoving(true);
    try {
      await onConfirm(selectedEtapaId);
      onClose();
    } catch (error) {
      console.error('Erro ao mover leads:', error);
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen || !etapaToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mover Leads</h3>
              <p className="text-sm text-gray-500">Esta etapa possui leads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isMoving}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              A etapa <strong>"{etapaToDelete.nome}"</strong> possui{' '}
              <strong>{leadsCount} lead{leadsCount !== 1 ? 's' : ''}</strong>.
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Para excluir esta etapa, você precisa mover os leads para outra etapa.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mover leads para:
            </label>
            <Select value={selectedEtapaId} onValueChange={setSelectedEtapaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a etapa destino" />
              </SelectTrigger>
              <SelectContent>
                {etapasDisponiveis
                  .filter(etapa => etapa.id !== etapaToDelete.id)
                  .map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isMoving}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedEtapaId || isMoving}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700"
          >
            {isMoving ? 'Movendo...' : 'Mover e Excluir'}
          </Button>
        </div>
      </div>
    </div>
  );
};
