
import { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useUpdateTag, useDeleteTag } from '@/hooks/useTagsData';
import { useClinicaOperations } from '@/hooks/useClinicaOperations';

/**
 * Componente para gerenciar tags/categorias de leads
 * 
 * Funcionalidades:
 * - Criar novas tags com cores personalizadas
 * - Editar tags existentes
 * - Excluir tags
 * - Visualizar tags em uma grade organizada
 * - Integração completa com Supabase e RLS
 */

export const TagManager = () => {
  const { tags, loading } = useSupabaseData();
  const { createTag } = useClinicaOperations();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#3B82F6'
  });

  // Cores predefinidas para seleção
  const coresPredefinidas = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#F97316', // Laranja
    '#06B6D4', // Ciano
    '#84CC16', // Lima
    '#EC4899', // Rosa
    '#6B7280'  // Cinza
  ];

  // Função para iniciar criação de nova tag
  const handleNovaTag = () => {
    setFormData({ nome: '', cor: '#3B82F6' });
    setEditingTag(null);
    setIsCreating(true);
  };

  // Função para iniciar edição de tag
  const handleEditarTag = (tag: any) => {
    setFormData({ nome: tag.nome, cor: tag.cor });
    setEditingTag(tag);
    setIsCreating(true);
  };

  // Função para salvar tag (criar ou editar)
  const handleSalvarTag = async () => {
    try {
      if (!formData.nome.trim()) {
        alert('Nome da tag é obrigatório');
        return;
      }

      if (editingTag) {
        // Editando tag existente
        await updateTagMutation.mutateAsync({
          id: editingTag.id,
          nome: formData.nome,
          cor: formData.cor
        });
      } else {
        // Criando nova tag - usar hook de operações da clínica
        await createTag({
          nome: formData.nome,
          cor: formData.cor
        });
      }

      // Limpar formulário e fechar modal
      setFormData({ nome: '', cor: '#3B82F6' });
      setIsCreating(false);
      setEditingTag(null);
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      alert('Erro ao salvar tag. Tente novamente.');
    }
  };

  // Função para excluir tag
  const handleExcluirTag = async (tag: any) => {
    const confirmacao = confirm(`Tem certeza que deseja excluir a tag "${tag.nome}"?`);
    
    if (!confirmacao) return;

    try {
      await deleteTagMutation.mutateAsync(tag.id);
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      alert('Erro ao excluir tag. Tente novamente.');
    }
  };

  // Função para cancelar criação/edição
  const handleCancelar = () => {
    setFormData({ nome: '', cor: '#3B82F6' });
    setIsCreating(false);
    setEditingTag(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando tags...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Tags</h2>
          <p className="text-gray-600 mt-1">
            Organize seus leads com tags personalizadas
          </p>
        </div>
        <button
          onClick={handleNovaTag}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Tag
        </button>
      </div>

      {/* Formulário de criação/edição */}
      {isCreating && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingTag ? 'Editar Tag' : 'Nova Tag'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Tag
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome da tag"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor da Tag
              </label>
              <div className="flex gap-2 flex-wrap">
                {coresPredefinidas.map((cor) => (
                  <button
                    key={cor}
                    onClick={() => setFormData(prev => ({ ...prev, cor }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.cor === cor ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                className="mt-2 w-16 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancelar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvarTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingTag ? 'Salvar Alterações' : 'Criar Tag'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de tags */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tags Existentes</h3>
          
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <Tag size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma tag criada ainda</p>
              <p className="text-gray-400 text-sm">Crie sua primeira tag para organizar os leads</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.cor }}
                    />
                    <span className="font-medium">{tag.nome}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditarTag(tag)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar tag"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleExcluirTag(tag)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Excluir tag"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{tags.length}</div>
            <div className="text-sm text-gray-600">Total de Tags</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {coresPredefinidas.filter(cor => tags.some(tag => tag.cor === cor)).length}
            </div>
            <div className="text-sm text-gray-600">Cores Usadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {tags.filter(tag => !coresPredefinidas.includes(tag.cor)).length}
            </div>
            <div className="text-sm text-gray-600">Cores Personalizadas</div>
          </div>
        </div>
      </div>
    </div>
  );
};
