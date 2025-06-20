
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LeadPipeline, EtapaPipeline } from './types';

/**
 * Modal para criar/editar leads no Pipeline
 * 
 * Permite ao usuário criar um novo lead ou editar um existente,
 * incluindo a seleção da etapa inicial/atual.
 */

interface PipelineLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: any) => void;
  lead?: LeadPipeline | null;
  etapas: EtapaPipeline[];
  onOpenHistory?: () => void;
}

export const PipelineLeadModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  lead, 
  etapas,
  onOpenHistory 
}: PipelineLeadModalProps) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    origem_lead: '',
    servico_interesse: '',
    anotacoes: '',
    etapa_kanban_id: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (lead) {
        // Edição - preencher com dados do lead
        setFormData({
          nome: lead.nome || '',
          telefone: lead.telefone || '',
          email: lead.email || '',
          origem_lead: lead.origem_lead || '',
          servico_interesse: lead.servico_interesse || '',
          anotacoes: lead.anotacoes || '',
          etapa_kanban_id: lead.etapa_kanban_id || '',
        });
      } else {
        // Criação - usar primeira etapa como padrão
        setFormData({
          nome: '',
          telefone: '',
          email: '',
          origem_lead: '',
          servico_interesse: '',
          anotacoes: '',
          etapa_kanban_id: etapas.length > 0 ? etapas[0].id : '',
        });
      }
      setErrors({});
    }
  }, [isOpen, lead, etapas]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email deve ter formato válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <div className="flex items-center gap-3">
            {lead && onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="px-3 py-1 text-sm border border-green-300 text-green-700 rounded hover:bg-green-50 transition-colors"
              >
                Histórico
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Nome completo"
                autoFocus
              />
              {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
              {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="email@exemplo.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Etapa */}
            <div>
              <label htmlFor="etapa" className="block text-sm font-medium text-gray-700 mb-2">
                Etapa
              </label>
              <select
                id="etapa"
                value={formData.etapa_kanban_id}
                onChange={(e) => handleInputChange('etapa_kanban_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecione uma etapa</option>
                {etapas.map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Origem do Lead */}
            <div>
              <label htmlFor="origem" className="block text-sm font-medium text-gray-700 mb-2">
                Origem do Lead
              </label>
              <input
                type="text"
                id="origem"
                value={formData.origem_lead}
                onChange={(e) => handleInputChange('origem_lead', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Facebook Ads, Indicação, etc."
              />
            </div>

            {/* Serviço de Interesse */}
            <div>
              <label htmlFor="servico" className="block text-sm font-medium text-gray-700 mb-2">
                Serviço de Interesse
              </label>
              <input
                type="text"
                id="servico"
                value={formData.servico_interesse}
                onChange={(e) => handleInputChange('servico_interesse', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Limpeza, Implante, etc."
              />
            </div>
          </div>

          {/* Anotações */}
          <div className="mb-6">
            <label htmlFor="anotacoes" className="block text-sm font-medium text-gray-700 mb-2">
              Anotações
            </label>
            <textarea
              id="anotacoes"
              value={formData.anotacoes}
              onChange={(e) => handleInputChange('anotacoes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Observações sobre o lead..."
            />
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
              {lead ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
