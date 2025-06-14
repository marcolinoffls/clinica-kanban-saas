
/**
 * Componente DateTimePicker
 *
 * O que faz:
 * Permite que o usuário selecione uma data de um calendário e um horário (hora e minuto)
 * de seletores, combinando ambos em um único valor de data e hora.
 *
 * Onde é usado no app:
 * - No modal de registro e edição de agendamentos (`RegistroAgendamentoModal`), para
 *   definir a data de início e fim do agendamento.
 *
 * Como se conecta com outras partes:
 * - Props:
 *   - `value` (Date | undefined): O valor de data e hora atual do componente.
 *   - `onChange` ((date: Date | undefined) => void): Uma função de callback que é chamada
 *     sempre que a data ou hora é alterada.
 * - Utiliza os componentes de UI da biblioteca shadcn/ui (Button, Popover, Calendar, Select).
 * - Usa a biblioteca `date-fns` para manipulação e formatação de datas.
 * - É projetado para ser usado com `react-hook-form` através do componente `FormField`.
 */
import * as React from 'react';
import { format, set, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Garante que o valor da data seja um objeto Date válido ou undefined.
  // Isso é importante porque o react-hook-form pode passar strings de data inicialmente.
  const dateValue = value && isValid(new Date(value)) ? new Date(value) : undefined;

  // Lida com a seleção de uma data no calendário.
  // Mantém o horário existente se já houver um.
  const handleDateSelect = (selectedDay: Date | undefined) => {
    if (!selectedDay) {
      onChange(undefined);
      return;
    }
    // Cria um novo objeto Date com a data selecionada e o horário do valor atual.
    // Se não houver valor atual, usa a data atual como base para o horário.
    const newDateTime = set(value || new Date(), {
      year: selectedDay.getFullYear(),
      month: selectedDay.getMonth(),
      date: selectedDay.getDate(),
    });

    onChange(newDateTime);
  };

  // Lida com a mudança da hora ou dos minutos nos seletores.
  const handleTimeChange = (timeValue: string, type: 'hours' | 'minutes') => {
    if (!value) return;
    // Atualiza a hora ou os minutos do valor de data atual.
    const newDateTime = set(value, { [type]: parseInt(timeValue, 10) });
    onChange(newDateTime);
  };
  
  // Gera as opções para as horas (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  // Gera as opções para os minutos (em intervalos de 5 minutos)
  const minutes = Array.from({ length: 60 / 5 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !dateValue && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, "dd/MM/yyyy HH:mm") : <span>Selecione a data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          locale={ptBR}
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-3 border-t border-border flex items-center justify-center gap-2">
            <Select
              onValueChange={(val) => handleTimeChange(val, 'hours')}
              value={dateValue ? String(dateValue.getHours()).padStart(2, '0') : undefined}
              disabled={!dateValue}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Hora" />
              </SelectTrigger>
              <SelectContent>
                {hours.map(hour => (
                  <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>:</span>
            <Select
              onValueChange={(val) => handleTimeChange(val, 'minutes')}
              // Arredonda os minutos para o intervalo de 5 minutos mais próximo para exibição.
              value={dateValue ? String(Math.floor(dateValue.getMinutes() / 5) * 5).padStart(2, '0') : undefined}
              disabled={!dateValue}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map(minute => (
                  <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <div className="px-3 pb-3 flex justify-end">
          <Button size="sm" onClick={() => setIsOpen(false)}>Confirmar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
