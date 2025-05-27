
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTagsData';

/**
 * Componente para gerenciamento de tags na barra lateral direita
 * 
 * Funcionalidades:
 * - Lista todas as tags criadas (persiste no Supabase)
 * - Permite criar novas tags com nome e cor
 * - Edição e exclusão de tags existentes
 * - Preview da cor da tag
 * - Sincronização com banco de dados
 * 
 * Este componente fica sempre visível na lateral direita da aplicação
 * para facilitar a gestão das categorias de leads.
 */

export const TagManager = () => {
  const { tags } = useSupabaseData();
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  
  // Estados para o formulário de criação/edição
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#3B82F6'
  });

  // Cores predefinidas para facilitar a seleção
  const presetColors = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#F97316', // Laranja
    '#06B6D4', // Ciano
    '#84CC16'  // Lima
  ];

  // Função para iniciar criação de nova tag
  const handleStartCreate = () => {
    setFormData({ nome: '', cor: '#3B82F6' });
    setIsCreating(true);
    setEditingTag(null);
  };

  // Função para iniciar edição de tag existente
  const handleStartEdit = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      setFormData({ nome: tag.nome, cor: tag.cor || '#3B82F6' });
      setEditingTag(tagId);
      setIsCreating(false);
    }
  };

  // Função para salvar tag (criar ou editar)
  const handleSave = async () => {
    if (!formData.nome.trim()) {
      alert('Nome da tag é obrigatório');
      return;
    }

    try {
      if (editingTag) {
        // Editando tag existente
        await updateTagMutation.mutateAsync({ id: editingTag, ...formData });
      } else {
        // Criando nova tag
        await createTagMutation.mutateAsync(formData);
      }

      // Reset do formulário
      setFormData({ nome: '', cor: '#3B82F6' });
      setIsCreating(false);
      setEditingTag(null);
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      alert('Erro ao salvar tag. Tente novamente.');
    }
  };

  // Função para cancelar edição/criação
  const handleCancel = () => {
    setFormData({ nome: '', cor: '#3B82F6' });
    setIsCreating(false);
    setEditingTag(null);
  };

  // Função para excluir tag
  const handleDelete = async (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;

    const confirmacao = confirm(`Tem certeza que deseja excluir a tag "${tag.nome}"?`);
    if (!confirmacao) return;

    try {
      await deleteTagMutation.mutateAsync(tagId);
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      alert('Erro ao excluir tag. Tente novamente.');
    }
  };

  return (
    <div className="h-full">
      {/* Header da seção de tags */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Categorias
        </h3>
        <button
          onClick={handleStartCreate}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Adicionar nova categoria"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Lista de tags existentes */}
      <div className="space-y-2 mb-6">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {/* Preview da cor da tag */}
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.cor }}
              />
              <span className="text-sm font-medium text-gray-900">
                {tag.nome}
              </span>
            </div>
            
            {/* Botões de ação */}
            <div className="flex gap-1">
              <button
                onClick={() => handleStartEdit(tag.id)}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="Editar categoria"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => handleDelete(tag.id)}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                title="Remover categoria"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulário de criação/edição */}
      {(isCreating || editingTag) && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {editingTag ? 'Editar Categoria' : 'Nova Categoria'}
          </h4>
          
          {/* Campo nome */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome da categoria"
            />
          </div>

          {/* Seletor de cor */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Cor
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, cor: color }))}
                  className={`w-8 h-8 rounded-md border-2 transition-all ${
                    formData.cor === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            
            {/* Input customizado para cor */}
            <div className="mt-2">
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                className="w-full h-8 rounded border border-gray-300"
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingTag ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </div>
      )}

      {/* Informações sobre o uso das tags */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Dica:</strong> Use categorias para organizar seus leads por tipo de procedimento, urgência ou origem.
        </p>
      </div>
    </div>
  );
};
