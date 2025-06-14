
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

/**
 * Componente de Filtro de Tempo para o Painel Administrativo
 * 
 * Funcionalidades:
 * - Botão único que abre um Popover para seleção de período.
 * - Lista de períodos pré-definidos (Hoje, Últimos 7 dias, etc.).
 * - Calendário duplo para seleção de um intervalo de datas personalizado.
 * - Opção "Máximo" para visualizar dados de todo o período.
 * - O Popover permanece aberto ao selecionar um filtro pré-definido para melhor UX.
 */

interface TimeRangeFilterProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null, filterName: string) => void;
  currentFilter: string;
}

export const TimeRangeFilter = ({ onFilterChange, currentFilter }: TimeRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();

  // Opções de filtro pré-definidas com as novas opções solicitadas.
  const filterOptions = [
    { key: 'hoje', label: 'Hoje', getDates: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
    { key: 'ontem', label: 'Ontem', getDates: () => { const d = subDays(new Date(), 1); return { start: startOfDay(d), end: endOfDay(d) }}},
    { key: 'ultimos-7-dias', label: 'Últimos 7 dias', getDates: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) })},
    { key: 'ultimos-14-dias', label: 'Últimos 14 dias', getDates: () => ({ start: startOfDay(subDays(new Date(), 13)), end: endOfDay(new Date()) })},
    { key: 'ultimos-30-dias', label: 'Últimos 30 dias', getDates: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) })},
    { key: 'esta-semana', label: 'Esta semana', getDates: () => { const d = new Date(); return { start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) }}},
    { key: 'semana-passada', label: 'Semana passada', getDates: () => { const d = subDays(new Date(), 7); return { start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) }}},
    { key: 'este-mes', label: 'Este mês', getDates: () => { const d = new Date(); return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }}},
    { key: 'mes-passado', label: 'Mês passado', getDates: () => { const d = subDays(startOfMonth(new Date()), 1); return { start: startOfMonth(d), end: endOfMonth(d) }}},
    { key: 'maximo', label: 'Máximo', getDates: () => ({ start: null, end: null })},
  ];

  // Identifica se o filtro atual é personalizado (não está na lista de pré-definidos)
  const isCustom = !filterOptions.some(o => o.label === currentFilter);

  // Efeito para sincronizar o calendário com o filtro ativo
  useEffect(() => {
    if(currentFilter) {
      const option = filterOptions.find(o => o.label === currentFilter);
      if(option) {
        const {start, end} = option.getDates();
        if(start && end) {
          setRange({from: start, to: end});
        } else {
          setRange(undefined);
        }
      } else if(isCustom && currentFilter.includes(' - ')) {
        // Lógica para preencher o calendário se for um filtro personalizado
        // Esta parte pode ser melhorada se o formato da data for sempre o mesmo
      }
    }
  }, [currentFilter]);
  
  // Função para aplicar um filtro pré-definido
  const handlePresetFilter = (option: typeof filterOptions[0]) => {
    const { start, end } = option.getDates();
    onFilterChange(start, end, option.label);
    // Não fecha o popover para permitir que o usuário veja a mudança no calendário
  };

  // Função para aplicar o filtro personalizado e fechar o popover
  const handleCustomFilterApply = () => {
    if (range?.from && range?.to) {
      onFilterChange(
        startOfDay(range.from),
        endOfDay(range.to),
        `${format(range.from, 'dd/MM/yy', { locale: ptBR })} - ${format(range.to, 'dd/MM/yy', { locale: ptBR })}`
      );
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{currentFilter}</span>
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Coluna da esquerda com filtros pré-definidos */}
          <div className="flex flex-col space-y-1 p-2 border-r min-w-[180px]">
            {filterOptions.map((option) => (
              <Button
                key={option.key}
                variant={currentFilter === option.label ? 'default' : 'ghost'}
                onClick={() => handlePresetFilter(option)}
                className="justify-start"
              >
                {option.label}
              </Button>
            ))}
            <Button
              variant={isCustom ? 'default' : 'ghost'}
              className="justify-start cursor-default"
            >
              Personalizado
            </Button>
          </div>
          {/* Coluna da direita com o calendário */}
          <div className="p-2">
            <Calendar
              initialFocus
              mode="range"
              numberOfMonths={2}
              defaultMonth={range?.from}
              selected={range}
              onSelect={setRange}
              locale={ptBR}
              className="pointer-events-auto"
            />
            <div className="flex justify-end space-x-2 pt-2 border-t mt-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleCustomFilterApply} disabled={!range?.from || !range?.to}>Atualizar</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
