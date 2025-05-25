
import { useState, useEffect } from 'react';
import { X, History } from 'lucide-react';
import { Lead } from './KanbanBoard';

/**
 * Modal para criação e edição de leads
 * 
 * Funcionalidades:
 * - Formulário completo para dados do lead
 * - Validação de campos obrigatórios
 * - Suporte a criação e edição
 * - Botão para visualizar histórico
 * 
 * Props:
 * - isOpen: controla se o modal está visível
 * - onClose: função para fechar o modal
 * - lead: lead para edição (null para criação)
 * - onSave: função para salvar os dados
 * - onOpenHistory: função para abrir histórico (opcional)
 */

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (leadData: Partial<Lead>) => void;
  onOpenHistory?: () => void;
}

export const LeadModal = ({ isOpen, onClose, lead, onSave, onOpenHistory }: LeadModalProps) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    anotacoes: '',
    tag_id: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Preenche o formulário quando um lead é selecionado para edição
  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        anotacoes: lead.anotacoes || '',
        tag_id: lead.tag_id || ''
      });
    } else {
      // Limpa o formulário para criação
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        anotacoes: '',
        tag_id: ''
      });
    }
    setErrors({});
  }, [lead, isOpen]);

  // Função para atualizar campos do formulário
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validação local do formulário
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter formato válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para salvar o lead
  const handleSave = () => {
    if (!validateForm()) return;
    
    onSave(formData);
  };

  // Não renderiza nada se o modal estiver fechado
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header do modal */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {lead ? 'Editar Lead' : 'Novo Lead'}
            </h3>
            {lead && onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <History size={14} />
                Histórico
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          {/* Campo Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.nome ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Nome completo"
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          {/* Campo Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.telefone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="(11) 99999-9999"
            />
            {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
          </div>

          {/* Campo Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="email@exemplo.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Campo Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.anotacoes}
              onChange={(e) => handleInputChange('anotacoes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Anotações sobre o lead..."
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {lead ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
};
