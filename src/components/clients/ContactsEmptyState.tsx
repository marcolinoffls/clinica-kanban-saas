
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Users, UserX } from 'lucide-react';

/**
 * Componente de Estado Vazio para Contatos
 * 
 * Exibe mensagens apropriadas quando:
 * - Não há contatos cadastrados
 * - Nenhum contato foi encontrado com os filtros aplicados
 */

interface ContactsEmptyStateProps {
  hasFilters: boolean;
  searchQuery: string;
  onClearFilters: () => void;
  onAddLead: () => void;
}

export const ContactsEmptyState: React.FC<ContactsEmptyStateProps> = ({
  hasFilters,
  searchQuery,
  onClearFilters,
  onAddLead,
}) => {
  if (hasFilters || searchQuery) {
    // Estado quando há filtros aplicados mas nenhum resultado
    return (
      <div className="flex flex-col items-center space-y-3">
        <UserX className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Nenhum contato encontrado</p>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros ou termo de busca
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      </div>
    );
  }

  // Estado quando não há contatos cadastrados
  return (
    <div className="flex flex-col items-center space-y-3">
      <Users className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Nenhum contato cadastrado</p>
        <p className="text-sm text-muted-foreground">
          Comece adicionando seu primeiro lead
        </p>
      </div>
      <Button onClick={onAddLead}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Lead
      </Button>
    </div>
  );
};
