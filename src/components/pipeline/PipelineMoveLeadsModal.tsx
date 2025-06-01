
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EtapaPipeline } from './types';

/**
 * Modal para mover leads ao deletar uma etapa no Pipeline
 * 
 * Quando o usuário tenta deletar uma etapa que contém leads,
 * este modal permite escolher para qual etapa os leads devem ser movidos.
 */

interface PipelineMoveLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetEtapaId: string) => void;
  etapaToDelete?: EtapaPipeline | null;
  leadsCount: number;
  etapasDisponiveis: EtapaPipeline[];
}

export const PipelineMoveLeadsModal = ({
  isOpen,
  onClose,
  onConfirm,
  etapaToDelete,
  leadsCount,
  etapasDisponiveis
}: PipelineMoveLeadsModalProps) => {
  const [selectedEtapaId, setSelectedEtapaId] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!selectedEtapaId) {
      setError('Selecione uma etapa de destino');
      return;
    }

    onConfirm(selectedEtapaId);
    setSelectedEtapaId('');
    setError('');
  };

  const handleClose = () => {
    setSelectedEtapaId('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Mover Leads
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Atenção!
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    A etapa "<strong>{etapaToDelete?.nome}</strong>" possui{' '}
                    <strong>{leadsCount}</strong> lead{leadsCount !== 1 ? 's' : ''}.
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    Escolha para qual etapa {leadsCount === 1 ? 'ele' : 'eles'} deve{leadsCount === 1 ? '' : 'm'} ser movido{leadsCount === 1 ? '' : 's'}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="etapa-destino" className="block text-sm font-medium text-gray-700 mb-2">
              Etapa de Destino
            </label>
            <select
              id="etapa-destino"
              value={selectedEtapaId}
              onChange={(e) => {
                setSelectedEtapaId(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecione uma etapa</option>
              {etapasDisponiveis.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.nome}
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Mover e Deletar Etapa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
