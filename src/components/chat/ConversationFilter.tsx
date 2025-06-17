
import React from 'react';
import { Filter } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Componente de filtro para conversas no chat
 * 
 * Permite filtrar conversas por origem:
 * - Todas as conversas
 * - Apenas dos anúncios
 * - WhatsApp
 * - Direct Instagram
 */

export interface ConversationFilterProps {
  /** Filtros ativos */
  activeFilters: {
    showAll: boolean;
    showAds: boolean;
    showWhatsApp: boolean;
    showInstagram: boolean;
  };
  /** Função chamada quando um filtro é alterado */
  onFilterChange: (filters: {
    showAll: boolean;
    showAds: boolean;
    showWhatsApp: boolean;
    showInstagram: boolean;
  }) => void;
}

export const ConversationFilter: React.FC<ConversationFilterProps> = ({
  activeFilters,
  onFilterChange
}) => {
  const handleFilterChange = (filterKey: keyof typeof activeFilters, checked: boolean) => {
    const newFilters = { ...activeFilters };
    
    // Se "Mostrar todas" for selecionado, desmarcar os outros
    if (filterKey === 'showAll' && checked) {
      newFilters.showAll = true;
      newFilters.showAds = false;
      newFilters.showWhatsApp = false;
      newFilters.showInstagram = false;
    } else if (filterKey !== 'showAll') {
      // Se outro filtro for selecionado, desmarcar "Mostrar todas"
      newFilters.showAll = false;
      newFilters[filterKey] = checked;
      
      // Se nenhum filtro específico estiver ativo, ativar "Mostrar todas"
      if (!newFilters.showAds && !newFilters.showWhatsApp && !newFilters.showInstagram) {
        newFilters.showAll = true;
      }
    } else {
      newFilters[filterKey] = checked;
    }
    
    onFilterChange(newFilters);
  };

  // Contar quantos filtros estão ativos (exceto "Mostrar todas")
  const activeFiltersCount = [
    activeFilters.showAds,
    activeFilters.showWhatsApp,
    activeFilters.showInstagram
  ].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-8"
        >
          <Filter size={14} />
          Filtrar
          {activeFiltersCount > 0 && !activeFilters.showAll && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-900 mb-3">
            Filtrar conversas por origem
          </h4>
          
          <div className="space-y-3">
            {/* Mostrar todas as conversas */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-all"
                checked={activeFilters.showAll}
                onCheckedChange={(checked) => 
                  handleFilterChange('showAll', checked as boolean)
                }
              />
              <label
                htmlFor="filter-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mostrar todas as conversas
              </label>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-3"></div>

            {/* Apenas dos anúncios */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-ads"
                checked={activeFilters.showAds}
                onCheckedChange={(checked) => 
                  handleFilterChange('showAds', checked as boolean)
                }
              />
              <label
                htmlFor="filter-ads"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Apenas dos anúncios
              </label>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-whatsapp"
                checked={activeFilters.showWhatsApp}
                onCheckedChange={(checked) => 
                  handleFilterChange('showWhatsApp', checked as boolean)
                }
              />
              <label
                htmlFor="filter-whatsapp"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mostrar do WhatsApp
              </label>
            </div>

            {/* Direct Instagram */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-instagram"
                checked={activeFilters.showInstagram}
                onCheckedChange={(checked) => 
                  handleFilterChange('showInstagram', checked as boolean)
                }
              />
              <label
                htmlFor="filter-instagram"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mostrar do Direct Instagram
              </label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
