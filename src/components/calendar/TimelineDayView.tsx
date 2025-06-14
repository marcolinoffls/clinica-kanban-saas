
/**
 * TimelineDayView
 * 
 * O que faz:
 * - Renderiza a visualização de timeline para um único dia.
 * - Exibe uma grade de horários e os agendamentos posicionados cronologicamente.
 * 
 * Onde é usado:
 * - Em `CalendarPage`, para a visualização de "Dia" e para cada dia na visualização de "Semana".
 * 
 * Como se conecta:
 * - `agendamentosDoDia`: Array de agendamentos para o dia específico.
 * - `showTimeColumn`: Prop opcional para ocultar a coluna de horários, útil na visão de semana.
 * - `...outras props`: Funções e dados necessários para os cards, como `getClienteNome`, `onEditAgendamento`, etc.
 */
import { AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { generateTimeSlots, calculateCardPosition, SLOT_HEIGHT_PX, START_HOUR } from '@/utils/timelineUtils';
import { AgendamentoTimelineCard } from './AgendamentoTimelineCard';

interface TimelineDayViewProps {
  agendamentosDoDia: AgendamentoFromDatabase[];
  getClienteNome: (clienteId: string) => string;
  getStatusClasses: (status: string) => { border: string; tagBg: string; tagText: string };
  onEditAgendamento: (agendamento: AgendamentoFromDatabase) => void;
  showTimeColumn?: boolean;
}

export const TimelineDayView = ({
  agendamentosDoDia,
  getClienteNome,
  getStatusClasses,
  onEditAgendamento,
  showTimeColumn = true, // Por padrão, a coluna de tempo é exibida.
}: TimelineDayViewProps) => {
  const timeSlots = generateTimeSlots(START_HOUR);

  return (
    <div className="relative flex h-full">
      {/* Coluna de Horários (renderizada condicionalmente) */}
      {showTimeColumn && (
        <div className="w-16 flex-shrink-0 text-right pr-2">
          {timeSlots.map((slot) => {
            // Exibe apenas as horas cheias para uma UI mais limpa.
            if (slot.endsWith(':00')) {
              return (
                <div
                  key={slot}
                  className="relative text-xs text-gray-500"
                  style={{ height: `${SLOT_HEIGHT_PX * 2}px` }}
                >
                  <span className="absolute -top-1.5">{slot}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Área Principal da Timeline */}
      <div className={`relative flex-1 ${showTimeColumn ? 'border-l' : ''} border-gray-200`}>
        {/* Camada para as Linhas da Grade de Horários */}
        <div className="absolute inset-0">
          {timeSlots.map((slot) => (
            <div
              key={`line-${slot}`}
              className={`border-t ${slot.endsWith(':00') ? 'border-gray-200' : 'border-gray-100'}`}
              style={{ height: `${SLOT_HEIGHT_PX}px` }}
            ></div>
          ))}
        </div>
        
        {/* Camada para os Cards de Agendamento */}
        <div className="absolute top-0 left-2 right-2 bottom-0">
          {agendamentosDoDia.map(agendamento => {
            const position = calculateCardPosition(agendamento, START_HOUR);
            const statusClasses = getStatusClasses(agendamento.status);
            const clienteNome = getClienteNome(agendamento.cliente_id);

            return (
              <AgendamentoTimelineCard
                key={agendamento.id}
                agendamento={agendamento}
                position={position}
                statusClasses={statusClasses}
                clienteNome={clienteNome}
                onEdit={onEditAgendamento}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
