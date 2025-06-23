
import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContactsFilters, FilterState } from './types';

interface ContactsFiltersProps {
  filters: ContactsFilters;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  totalResults: number;
}

/**
 * 🔍 Componente de Filtros para Contatos
 * 
 * O que faz:
 * - Filtro de busca por nome/telefone/email
 * - Filtros por tags, etapas e origem do lead
 * - Contador de filtros ativos
 * - Botão para limpar todos os filtros
 * 
 * Onde é usado:
 * - ClientsPage.tsx - para filtrar lista de contatos
 * 
 * Como se conecta:
 * - Recebe estado dos filtros via props
 * - Notifica mudanças através de onFiltersChange
 * - Permite limpar filtros via onClearFilters
 */
export const ContactsFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  totalResults 
}: ContactsFiltersProps) => {
  const activeFiltersCount = [
    filters.searchTerm,
    ...filters.tags,
    ...filters.etapas,
    ...filters.origemLead
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Barra de Busca Principal */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={filters.searchTerm}
          onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Indicadores de Filtro Ativo */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Badge variant="secondary">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      {/* Contador de Resultados */}
      <div className="text-sm text-gray-600">
        {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
