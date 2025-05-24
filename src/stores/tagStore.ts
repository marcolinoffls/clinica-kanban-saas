
import { create } from 'zustand';

/**
 * Store global para gerenciamento de tags
 * 
 * Este store utiliza Zustand para gerenciar o estado das tags.
 * As tags são usadas para categorizar leads e clientes.
 * 
 * Funcionalidades:
 * - Criar novas tags com cor personalizada
 * - Listar todas as tags
 * - Remover tags
 * - Editar tags existentes
 * 
 * Em produção, este store deve sincronizar com o Supabase.
 */

// Interface que define a estrutura de uma tag
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

// Interface que define o estado e ações do store
interface TagStore {
  tags: Tag[];
  addTag: (name: string, color: string) => void;
  removeTag: (id: string) => void;
  updateTag: (id: string, name: string, color: string) => void;
}

// Cria o store com Zustand
export const useTagStore = create<TagStore>((set) => ({
  // Estado inicial com algumas tags padrão
  tags: [
    {
      id: 'implante',
      name: 'Implante',
      color: '#3B82F6',
      createdAt: new Date()
    },
    {
      id: 'consulta',
      name: 'Consulta',
      color: '#10B981',
      createdAt: new Date()
    },
    {
      id: 'emergencia',
      name: 'Emergência',
      color: '#EF4444',
      createdAt: new Date()
    }
  ],

  // Ação para adicionar nova tag
  addTag: (name: string, color: string) =>
    set((state) => ({
      tags: [
        ...state.tags,
        {
          id: Date.now().toString(),
          name,
          color,
          createdAt: new Date()
        }
      ]
    })),

  // Ação para remover tag
  removeTag: (id: string) =>
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id)
    })),

  // Ação para atualizar tag existente
  updateTag: (id: string, name: string, color: string) =>
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === id ? { ...tag, name, color } : tag
      )
    }))
}));
