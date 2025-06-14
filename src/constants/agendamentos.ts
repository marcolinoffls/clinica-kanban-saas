
/**
 * src/constants/agendamentos.ts
 * 
 * Centraliza as constantes relacionadas a agendamentos.
 * 
 * O que faz:
 * - Define o enum `AgendamentoStatus` com os possíveis status de um agendamento.
 *   - OS VALORES FORAM PADRONIZADOS PARA MINÚSCULAS para consistência com o banco de dados e validações.
 * - Fornece `AGENDAMENTO_STATUS_OPTIONS`, uma lista de objetos para popular seletores de status na UI.
 * 
 * Onde é usado:
 * - `RegistroAgendamentoModal.tsx` para o seletor de status.
 * - `types.ts` para validação de formulário.
 * - `useAgendamentosData.ts` para tipagem de dados.
 */
export enum AgendamentoStatus {
  AGENDADO = 'agendado',
  CONFIRMADO = 'confirmado',
  REALIZADO = 'realizado',
  PAGO = 'pago',
  CANCELADO = 'cancelado',
  NAO_COMPARECEU = 'nao_compareceu',
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
