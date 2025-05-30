export enum AgendamentoStatus {
  AGENDADO = 'AGENDADO',
  CONFIRMADO = 'CONFIRMADO',
  REALIZADO = 'REALIZADO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
  NAO_COMPARECEU = 'NAO_COMPARECEU',
}

export const AGENDAMENTO_STATUS_OPTIONS = [
  { value: AgendamentoStatus.AGENDADO, label: 'Agendado' },
  { value: AgendamentoStatus.CONFIRMADO, label: 'Confirmado' },
  { value: AgendamentoStatus.REALIZADO, label: 'Realizado' },
  { value: AgendamentoStatus.PAGO, label: 'Pago' },
  { value: AgendamentoStatus.CANCELADO, label: 'Cancelado' },
  { value: AgendamentoStatus.NAO_COMPARECEU, label: 'Não Compareceu' },
];

// Tipagem para os dados do formulário que será usada pelo react-hook-form
// Esta tipagem já inclui os campos condicionais para novo cliente
export interface AgendamentoFormData {
  cliente_id: string; // ID do lead/cliente existente OU string vazia se novo_cliente
  titulo: string;
  data_inicio: Date;
  hora_inicio: string; // formato HH:mm
  data_fim: Date;
  hora_fim: string;   // formato HH:mm
  valor?: number;
  status: AgendamentoStatus;
  descricao?: string;
  // Campos preenchidos automaticamente, mas parte do schema para consistência
  clinica_id: string;
  usuario_id: string;
  // Campos para novo cliente
  novo_cliente_nome?: string;
  novo_cliente_telefone?: string;
}
