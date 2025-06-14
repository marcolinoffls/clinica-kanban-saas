
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from 'lucide-react';
import { FilterState } from './types';

/**
 * Componente de Filtros Avançados para Contatos
 * 
 * Permite filtrar contatos por tag, origem, serviço e período.
 * Utiliza um Popover para exibir as opções de filtro.
 */

interface ContactsFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  tags: any[];
  uniqueOrigens: string[];
  uniqueServicos: string[];
  onClearFilters: () => void;
}

export const ContactsFilters: React.FC<ContactsFiltersProps> = ({
  filters,
  setFilters,
  isFilterOpen,
  setIsFilterOpen,
  tags,
  uniqueOrigens,
  uniqueServicos,
  onClearFilters,
}) => {
  return (
    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {(filters.tag || filters.origem || filters.servico) && (
            <Badge variant="secondary" className="ml-1">
              {[filters.tag, filters.origem, filters.servico].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-4">
        <div className="space-y-4">
          <h4 className="font-medium">Filtrar contatos</h4>
          
          {/* Filtro por Tag */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tag</label>
            <Select 
              value={filters.tag} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, tag: value === 'all-tags' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tag" />
              </SelectTrigger>
              <SelectContent>
                {/* 
                  * O item para limpar o filtro não pode ter um valor vazio.
                  * Usamos 'all-tags' e o onValueChange trata isso para limpar o estado.
                  */}
                <SelectItem value="all-tags">Todas as tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.cor }}
                      />
                      {tag.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Origem */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Origem</label>
            <Select 
              value={filters.origem} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, origem: value === 'all-origens' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-origens">Todas as origens</SelectItem>
                {/* Filtramos com .filter(Boolean) para garantir que não haja valores vazios que quebrem o componente SelectItem */}
                {uniqueOrigens.filter(Boolean).map((origem) => (
                  <SelectItem key={origem} value={origem}>
                    {origem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Serviço */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Serviço de Interesse</label>
            <Select 
              value={filters.servico} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, servico: value === 'all-servicos' ? '' : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-servicos">Todos os serviços</SelectItem>
                {/* Filtramos com .filter(Boolean) para garantir que não haja valores vazios que quebrem o componente SelectItem */}
                {uniqueServicos.filter(Boolean).map((servico) => (
                  <SelectItem key={servico} value={servico}>
                    {servico}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Limpar Filtros
            </Button>
            <Button size="sm" onClick={() => setIsFilterOpen(false)}>
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
