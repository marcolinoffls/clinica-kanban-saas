
import React from 'react';
import { AgendamentoStatus } from '@/constants/agendamentos';
import { type AgendamentoFromDatabase } from '@/hooks/useAgendamentosData';
import { Button } from '@/components/ui/button';
import { Check, X, Ban, DollarSign, CalendarCheck } from 'lucide-react';

/**
 * Componente AgendamentoStatusActions
 *
 * O que faz:
 * - Renderiza botões de ação rápida para alterar o status de um agendamento.
 * - As ações exibidas dependem do status atual do agendamento, tornando a interface mais inteligente.
 *
 * Onde é usado:
 * - Dentro do card de agendamento na `CalendarPage.tsx`.
 *
 * Como se conecta com outras partes:
 * - Recebe o objeto `agendamento` para saber o status atual.
 * - Recebe a função `onStatusChange` que é chamada quando um botão de ação é clicado,
 *   informando qual o novo status desejado para o agendamento.
 */
interface AgendamentoStatusActionsProps {
  agendamento: AgendamentoFromDatabase;
  onStatusChange: (newStatus: AgendamentoStatus) => void;
}

export const AgendamentoStatusActions = ({ agendamento, onStatusChange }: AgendamentoStatusActionsProps) => {
  const { status } = agendamento;

  // Função para lidar com o clique na ação, evitando que o modal de edição seja aberto.
  const handleActionClick = (e: React.MouseEvent, newStatus: AgendamentoStatus) => {
    e.stopPropagation(); // Impede que o clique "vaze" para o card pai.
    onStatusChange(newStatus);
  };

  // Função que decide quais botões renderizar com base no status atual.
  const renderActions = () => {
    switch (status) {
      case AgendamentoStatus.AGENDADO:
        return (
          <>
            <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={(e) => handleActionClick(e, AgendamentoStatus.CONFIRMADO)}>
              <Check className="mr-2 h-4 w-4" /> Confirmar
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={(e) => handleActionClick(e, AgendamentoStatus.CANCELADO)}>
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
          </>
        );
      case AgendamentoStatus.CONFIRMADO:
        return (
          <>
            <Button variant="outline" size="sm" className="text-purple-600 border-purple-600 hover:bg-purple-50 hover:text-purple-700" onClick={(e) => handleActionClick(e, AgendamentoStatus.REALIZADO)}>
              <CalendarCheck className="mr-2 h-4 w-4" /> Realizar
            </Button>
            <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 hover:text-yellow-700" onClick={(e) => handleActionClick(e, AgendamentoStatus.NAO_COMPARECEU)}>
              <Ban className="mr-2 h-4 w-4" /> Não Compareceu
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={(e) => handleActionClick(e, AgendamentoStatus.CANCELADO)}>
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
          </>
        );
      case AgendamentoStatus.REALIZADO:
        return (
          <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={(e) => handleActionClick(e, AgendamentoStatus.PAGO)}>
            <DollarSign className="mr-2 h-4 w-4" /> Marcar como Pago
          </Button>
        );
      default:
        // Não renderiza ações para status finais como 'pago', 'cancelado', etc.
        return null;
    }
  };

  const actions = renderActions();

  // Só renderiza o contêiner de ações se houver botões a serem exibidos.
  if (!actions) {
    return null;
  }

  return <div className="flex gap-2 flex-wrap items-center">{actions}</div>;
};

