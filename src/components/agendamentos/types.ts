import * as z from 'zod';
import { AgendamentoStatus } from '@/constants/agendamentos';

/**
 * Tipos e schemas relacionados aos agendamentos
 * 
 * Este arquivo centraliza as definições de tipos para agendamentos,
 * incluindo validações com Zod e enums de status.
 * 
 * O enum `AgendamentoStatus` é importado de `@/constants/agendamentos`
 * para manter uma única fonte da verdade no sistema.
 */

// Schema de validação com Zod para formulário de agendamento
export const agendamentoFormSchema = z.object({
  cliente_id: z.string().min(1, { message: "Selecione um cliente ou cadastre um novo." }),
  titulo: z.string().min(1, { message: "Título ou serviço é obrigatório." }),
  data_inicio: z.date({ required_error: "Data de início é obrigatória." }),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Hora de início inválida." }),
  data_fim: z.date({ required_error: "Data de fim é obrigatória." }),
  hora_fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Hora de fim inválida." }),
  valor: z.number().min(0, { message: "Valor não pode ser negativo." }).optional(),
  status: z.nativeEnum(AgendamentoStatus, { required_error: "Status é obrigatório." }),
  descricao: z.string().optional(),
  clinica_id: z.string(),
  usuario_id: z.string(),
  novo_cliente_nome: z.string().optional(),
  novo_cliente_telefone: z.string().optional(),
}).refine(data => data.data_fim >= data.data_inicio, {
  message: "Data/hora de fim deve ser após a data/hora de início.",
  path: ["data_fim"],
});

export type AgendamentoFormData = z.infer<typeof agendamentoFormSchema>;

// Função utilitária para converter data para ISO string
export const formatarDataParaISO = (data: Date): string => {
  return data.toISOString();
};
