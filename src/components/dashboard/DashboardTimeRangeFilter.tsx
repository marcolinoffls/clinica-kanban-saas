
import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Componente de Filtro de Tempo para o Dashboard
 * 
 * Permite selecionar períodos pré-definidos ou um intervalo personalizado.
 * Usado especificamente para filtrar dados do dashboard principal.
 * 
 * Props:
 * - onFilterChange: callback quando o filtro é alterado
 * - currentFilter: nome do filtro ativo atual
 */

interface DashboardTimeRangeFilterProps {
  onFilterChange: (startDate: Date, endDate: Date, filterName: string) => void;
  currentFilter: string;
}

export const DashboardTimeRangeFilter = ({ onFilterChange, currentFilter }: DashboardTimeRangeFilterProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Opções de filtro pré-definidas para o dashboard
  const filterOptions = [
    {
      key: 'hoje',
      label: 'Hoje',
      getDates: () => {
        const today = new Date();
        return {
          start: startOfDay(today),
          end: endOfDay(today)
        };
      }
    },
    {
      key: 'ontem',
      label: 'Ontem',
      getDates: () => {
        const yesterday = subDays(new Date(), 1);
        return {
          start: startOfDay(yesterday),
          end: endOfDay(yesterday)
        };
      }
    },
    {
      key: 'esta-semana',
      label: 'Esta Semana',
      getDates: () => {
        const today = new Date();
        return {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 })
        };
      }
    },
    {
      key: 'este-mes',
      label: 'Este Mês',
      getDates: () => {
        const today = new Date();
        return {
          start: startOfMonth(today),
          end: endOfMonth(today)
        };
      }
    },
    {
      key: 'mes-passado',
      label: 'Mês Passado',
      getDates: () => {
        const lastMonth = subDays(startOfMonth(new Date()), 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      }
    },
    {
      key: 'ultimos-7-dias',
      label: 'Últimos 7 Dias',
      getDates: () => {
        const today = new Date();
        return {
          start: startOfDay(subDays(today, 6)),
          end: endOfDay(today)
        };
      }
    },
    {
      key: 'ultimos-30-dias',
      label: 'Últimos 30 Dias',
      getDates: () => {
        const today = new Date();
        return {
          start: startOfDay(subDays(today, 29)),
          end: endOfDay(today)
        };
      }
    }
  ];

  // Aplicar filtro pré-definido
  const handlePresetFilter = (option: typeof filterOptions[0]) => {
    const { start, end } = option.getDates();
    onFilterChange(start, end, option.label);
  };

  // Aplicar filtro customizado
  const handleCustomFilter = () => {
    if (customStartDate && customEndDate) {
      onFilterChange(
        startOfDay(customStartDate),
        endOfDay(customEndDate),
        `${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`
      );
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-gray-900">Período de Análise</h3>
        </div>

        {/* Filtros pré-definidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.key}
              variant={currentFilter === option.label ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetFilter(option)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Filtro customizado */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Período personalizado:</span>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {customStartDate && customEndDate
                  ? `${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`
                  : 'Selecionar datas'
                }
                <ChevronDown className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Data inicial:</label>
                  <CalendarComponent
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={ptBR}
                    className="rounded-md border mt-1 pointer-events-auto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Data final:</label>
                  <CalendarComponent
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={ptBR}
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                    className="rounded-md border mt-1 pointer-events-auto"
                  />
                </div>
                <Button
                  onClick={handleCustomFilter}
                  disabled={!customStartDate || !customEndDate}
                  className="w-full"
                >
                  Aplicar Filtro
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Indicador do filtro ativo */}
        <div className="text-xs text-gray-500">
          Período ativo: <span className="font-medium text-blue-600">{currentFilter}</span>
        </div>
      </div>
    </div>
  );
};
