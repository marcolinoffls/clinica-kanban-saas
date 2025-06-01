
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { EtapaPipeline } from './types';

/**
 * Modal para criar/editar etapas no Pipeline
 * 
 * Permite ao usuário criar uma nova etapa ou editar uma existente.
 * Valida se o nome já existe em outras etapas.
 */

interface PipelineEtapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nome: string) => void;
  etapa?: EtapaPipeline | null;
  etapasExistentes: EtapaPipeline[];
}

export const PipelineEtapaModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  etapa, 
  etapasExistentes 
}: PipelineEtapaModalProps) => {
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNome(etapa?.nome || '');
      setError('');
    }
  }, [isOpen, etapa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      setError('Nome da etapa é obrigatório');
      return;
    }

    // Verificar se já existe uma etapa com o mesmo nome (exceto a que está sendo editada)
    const nomeExiste = etapasExistentes.some(
      e => e.nome.toLowerCase() === nome.trim().toLowerCase() && e.id !== etapa?.id
    );

    if (nomeExiste) {
      setError('Já existe uma etapa com este nome');
      return;
    }

    onSave(nome.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {etapa ? 'Editar Etapa' : 'Nova Etapa'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Etapa
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Digite o nome da etapa"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              {etapa ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
