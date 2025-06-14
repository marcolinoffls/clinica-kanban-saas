
/**
 * AgendamentoTimelineCard
 * 
 * O que faz:
 * - Renderiza um card de agendamento dentro da visualização de timeline.
 * - É posicionado de forma absoluta com base no horário e duração.
 * - Exibe informações essenciais como nome do cliente, título e horário.
 * 
 * Onde é usado:
 * - Usado dentro do componente `TimelineDayView`.
 * 
 * Como se conecta:
 * - `agendamento`: Recebe os dados do agendamento a ser exibido.
 * - `position`: Objeto com `top` e `height` para o posicionamento CSS.
 * - `statusClasses`: Classes de CSS para estilizar o card com base no status.
 * - `clienteNome`: Nome do cliente para exibição.
 * - `onEdit`: Função para abrir o modal de edição ao clicar no card.
 */
import { AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { format } from 'date-fns';

interface AgendamentoTimelineCardProps {
  agendamento: AgendamentoFromDatabase;
  position: { top: number; height: number };
  statusClasses: { border: string; tagBg: string; tagText: string };
  clienteNome: string;
  onEdit: (agendamento: AgendamentoFromDatabase) => void;
}

export const AgendamentoTimelineCard = ({
  agendamento,
  position,
  statusClasses,
  clienteNome,
  onEdit,
}: AgendamentoTimelineCardProps) => {
  // Se o card for muito curto, esconde o título para não poluir a UI.
  const isShort = position.height < 40;

  return (
    <div
      className={`absolute w-full p-2 rounded-lg text-white cursor-pointer overflow-hidden flex flex-col ${statusClasses.border.replace('border-', 'bg-').replace('-500', '-600')} hover:opacity-90 transition-opacity`}
      style={{
        top: `${position.top}px`,
        height: `${position.height}px`,
      }}
      onClick={() => onEdit(agendamento)}
      title={`${agendamento.titulo} com ${clienteNome}`}
    >
      <p className="text-xs font-bold truncate">
        {format(new Date(agendamento.data_inicio), "HH:mm")} - {clienteNome}
      </p>
      {!isShort && (
        <p className="text-xs truncate">{agendamento.titulo}</p>
      )}
    </div>
  );
};
