
/**
 * Tipos específicos para o Pipeline de Vendas
 * 
 * Define as interfaces para leads e etapas no contexto do pipeline,
 * mantendo independência do Kanban existente.
 */

export interface LeadPipeline {
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
  ordem_na_etapa?: number;
}

export interface EtapaPipeline {
  id: string;
  nome: string;
  ordem: number;
  clinica_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PipelineColumnData extends EtapaPipeline {
  title: string;
  leadIds: string[];
  leadsCount: number;
}
