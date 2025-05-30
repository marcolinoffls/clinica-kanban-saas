
/**
 * Constantes para o sistema de agendamentos
 * 
 * Define os status possíveis para agendamentos e suas representações visuais
 */

export const AGENDAMENTO_STATUS_OPTIONS = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'NAO_COMPARECEU', label: 'Não Compareceu' }
] as const;

// Tipo TypeScript baseado nos valores dos status
export type AgendamentoStatus = typeof AGENDAMENTO_STATUS_OPTIONS[number]['value'];

// Interface para dados do agendamento
export interface AgendamentoFormData {
  cliente_id: string;
  titulo: string;
  data_inicio: Date;
  data_fim: Date;
  valor?: number;
  status: AgendamentoStatus;
  descricao?: string;
  clinica_id: string;
  usuario_id: string;
}
