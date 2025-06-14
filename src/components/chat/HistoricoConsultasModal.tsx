
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFetchAgendamentosByLeadId } from "@/hooks/useAgendamentosData";
import { AgendamentoFromDatabase } from "@/hooks/useAgendamentosData";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Loader2 } from "lucide-react";

/**
 * Modal para exibir o histórico de consultas (agendamentos) de um lead.
 *
 * Funcionalidades:
 * - Busca os agendamentos do lead usando o hook useFetchAgendamentosByLeadId.
 * - Exibe uma lista de agendamentos com status e data.
 * - Mostra estados de carregamento e de quando não há histórico.
 *
 * Onde é usado:
 * - Em ChatPage.tsx, acionado a partir do LeadInfoSidebar.
 *
 * Conecta-se com:
 * - hook useFetchAgendamentosByLeadId para buscar dados do Supabase.
 * - Recebe o leadId para saber de qual lead buscar o histórico.
 */

interface HistoricoConsultasModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | undefined;
  leadName: string;
}

const formatarData = (dataString: string) => {
  return new Date(dataString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
  switch (status?.toLowerCase()) {
    case 'realizado':
      return 'secondary';
    case 'cancelado':
      return 'destructive';
    case 'agendado':
      return 'default';
    default:
      return 'outline';
  }
};


export const HistoricoConsultasModal = ({ isOpen, onClose, leadId, leadName }: HistoricoConsultasModalProps) => {
  const { data: agendamentos, isLoading, error } = useFetchAgendamentosByLeadId(leadId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Histórico de Consultas</DialogTitle>
          <DialogDescription>
            Agendamentos para {leadName}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-72">
            <div className="pr-4">
              {isLoading && (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Carregando histórico...</span>
                </div>
              )}
              {error && (
                <div className="text-red-500 text-center">
                  <p>Ocorreu um erro ao buscar o histórico.</p>
                </div>
              )}
              {!isLoading && !error && agendamentos?.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sem histórico</h3>
                  <p className="mt-1 text-sm text-gray-500">Nenhum agendamento encontrado para este lead.</p>
                </div>
              )}
              {!isLoading && !error && agendamentos && agendamentos.length > 0 && (
                <ul className="space-y-4">
                  {agendamentos.map((agendamento: AgendamentoFromDatabase) => (
                    <li key={agendamento.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800">{agendamento.titulo}</h4>
                        <Badge variant={getStatusVariant(agendamento.status)}>{agendamento.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{agendamento.descricao}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <Calendar size={12} className="mr-1.5" />
                        <span>{formatarData(agendamento.data_inicio)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
