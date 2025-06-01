
import { Etapa } from '@/hooks/useEtapasData';

/**
 * Interfaces específicas para o componente Pipeline
 * 
 * Estas interfaces estendem as tipagens existentes para
 * garantir compatibilidade com os hooks do Kanban.
 */

// Interface para colunas do Pipeline que é compatível com IKanbanColumn
export interface IPipelineColumn extends Etapa {
  title: string;
  leadIds: string[];
  leadsCount?: number;
  // created_at é obrigatório (herdado de Etapa)
}

// Interface para leads do Pipeline (reutiliza a interface existente)
export interface IPipelineLead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  anotacoes: string | null;
  etapa_kanban_id: string | null;
  tag_id: string | null;
  data_ultimo_contato: string | null;
  created_at: string;
  updated_at: string | null;
  clinica_id: string | null;
  origem_lead: string | null;
  servico_interesse: string | null;
}
