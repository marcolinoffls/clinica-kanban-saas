
/**
 * Utilitários para a Visualização de Timeline da Agenda
 * 
 * O que faz:
 * - Fornece funções para gerar a grade de horários.
 * - Calcula o posicionamento e a altura dos cards de agendamento na timeline.
 * 
 * Onde é usado:
 * - Em `TimelineDayView.tsx` e `CalendarPage.tsx` para construir a interface da timeline.
 * 
 * Como se conecta:
 * - As funções exportadas são puras e recebem dados (como agendamentos) para retornar
 *   valores de layout (como posições em pixels).
 */
import { AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { differenceInMinutes } from 'date-fns';

// Define a altura de um slot de 30 minutos em pixels. Usado para o cálculo do layout.
export const SLOT_HEIGHT_PX = 40; // 40px por 30 minutos

// Define a hora de início da grade da timeline.
export const START_HOUR = 8;

/**
 * Gera uma lista de horários (slots) para um dia, em intervalos de 30 minutos.
 * @param startHour - A hora de início (ex: 8 para 08:00).
 * @param endHour - A hora de término (ex: 20 para 20:00).
 * @returns Um array de strings representando os horários, ex: ['08:00', '08:30', ...].
 */
export const generateTimeSlots = (startHour = START_HOUR, endHour = 20) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
    slots.push(`${String(hour).padStart(2, '0')}:30`);
  }
  slots.push(`${String(endHour).padStart(2, '0')}:00`); // Adiciona o horário final
  return slots;
};

/**
 * Calcula a posição e a altura de um card de agendamento na timeline.
 * @param agendamento - O objeto do agendamento.
 * @param startHour - A hora de início da timeline.
 * @returns Um objeto com `top` (posição vertical em px) e `height` (altura em px).
 */
export const calculateCardPosition = (agendamento: AgendamentoFromDatabase, startHour = START_HOUR) => {
  const dataInicio = new Date(agendamento.data_inicio);
  const dataFim = new Date(agendamento.data_fim);

  // Calcula a diferença em minutos desde o início do dia da timeline.
  const timelineStartMinutes = startHour * 60;
  const agendamentoStartMinutes = dataInicio.getHours() * 60 + dataInicio.getMinutes();
  
  // A posição 'top' é a diferença em minutos, convertida para pixels.
  // Cada minuto corresponde a SLOT_HEIGHT_PX / 30 pixels.
  const top = ((agendamentoStartMinutes - timelineStartMinutes) / 30) * SLOT_HEIGHT_PX;

  // Calcula a duração do agendamento em minutos.
  const duracaoEmMinutos = differenceInMinutes(dataFim, dataInicio);
  
  // A altura é a duração em minutos, convertida para pixels.
  const height = (duracaoEmMinutos / 30) * SLOT_HEIGHT_PX;

  return { top, height };
};
