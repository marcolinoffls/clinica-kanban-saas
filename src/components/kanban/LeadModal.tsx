
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Lead } from './KanbanBoard';
import { useTagStore } from '@/stores/tagStore';

/**
 * Modal para criação e edição de leads
 * 
 * Funcionalidades:
 * - Formulário completo para dados do lead
 * - Seleção de tags
 * - Validação de campos obrigatórios
 * - Suporte a criação e edição
 * 
 * Props:
 * - isOpen: controla se o modal está visível
 * - onClose: função para fechar o modal
 * - lead: lead para edição (null para criação)
 * - onSave: função para salvar os dados
 */

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (leadData: Partial<Lead>) => void;
}

export const LeadModal = ({ isOpen, onClose, lead, onSave }: LeadModalProps) => {
  const { tags } = useTagStore();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    tagId: ''
  });

  // Preenche o formulário quando um lead é selecionado para edição
  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        notes: lead.notes || '',
        tagId: lead.tagId || ''
      });
    } else {
      // Limpa o formulário para criação
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
        tagId: ''
      });
    }
  }, [lead]);

  // Função para atualizar campos do formulário
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para salvar o lead
  const handleSave = () => {
    // Validação básica - nome e telefone são obrigatórios
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Nome e telefone são obrigatórios');
      return;
    }

    onSave(formData);
  };

  // Não renderiza nada se o modal estiver fechado
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header do modal */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </h3>
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
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo"
            />
          </div>

          {/* Campo Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Seleção de Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={formData.tagId}
              onChange={(e) => handleInputChange('tagId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma categoria</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
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
