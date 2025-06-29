
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Filter, Search } from 'lucide-react';

/**
 * Componente de Filtros e Busca para Contatos
 * 
 * Combina a busca por texto com filtros avançados em um único componente.
 * Permite filtrar contatos por tag, origem, serviço e fazer busca por texto.
 */

interface FilterState {
  status: string;
  tag: string;
  origem: string;
  servico: string;
  hasActiveFilters: boolean;
}

interface ContactsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  onFilterChange: (key: string, value: string) => void;
  tags: any[];
  etapas: any[];
  totalContacts: number;
  isOpen: boolean;
  onToggle: () => void;
}

export const ContactsFilters: React.FC<ContactsFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  tags,
  etapas,
  totalContacts,
  isOpen,
  onToggle,
}) => {
  // Valores únicos para filtros (simulados - em produção viriam dos dados)
  const uniqueOrigens = ['Instagram', 'Facebook', 'Google Ads', 'Site', 'Indicação'];
  const uniqueServicos = ['Consulta', 'Avaliação', 'Tratamento', 'Retorno'];

  return (
    <div className="flex items-center gap-4">
      {/* Campo de busca */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Badge com total de contatos */}
      <Badge variant="outline" className="text-sm">
        {totalContacts} contatos
      </Badge>

      {/* Filtros avançados */}
      <Popover open={isOpen} onOpenChange={onToggle}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {filters.hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {[filters.tag, filters.origem, filters.servico, filters.status].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium">Filtrar contatos</h4>
            
            {/* Filtro por Status/Etapa */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => onFilterChange('status', value === 'all-status' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">Todos os status</SelectItem>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Tag */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tag</label>
              <Select 
                value={filters.tag} 
                onValueChange={(value) => onFilterChange('tag', value === 'all-tags' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma tag" />
                </SelectTrigger>
                <SelectContent>
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
                onValueChange={(value) => onFilterChange('origem', value === 'all-origens' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-origens">Todas as origens</SelectItem>
                  {uniqueOrigens.map((origem) => (
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
                onValueChange={(value) => onFilterChange('servico', value === 'all-servicos' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-servicos">Todos os serviços</SelectItem>
                  {uniqueServicos.map((servico) => (
                    <SelectItem key={servico} value={servico}>
                      {servico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  onFilterChange('tag', '');
                  onFilterChange('origem', '');
                  onFilterChange('servico', '');
                  onFilterChange('status', '');
                }}
              >
                Limpar Filtros
              </Button>
              <Button size="sm" onClick={onToggle}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
