
/**
 * Tipos específicos para o Pipeline de Vendas
 * 
 * Define as interfaces para leads e etapas no contexto do pipeline.
 */

export interface LeadPipeline {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  anotacoes: string | null;
  etapa_kanban_id: string | null; // ID da EtapaPipeline
  tag_id: string | null;
  data_ultimo_contato: string | null;
  created_at: string;
  updated_at: string | null;
  clinica_id: string | null;
  origem_lead: string | null;
  servico_interesse: string | null;
  ordem_na_etapa?: number; // Para ordenação dentro da coluna, se desejado
}

export interface EtapaPipeline {
  id: string;
  nome: string;
  ordem: number; // Para ordenação das colunas
  clinica_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  // Potencialmente, outros campos como `cor_header` se quiser personalizar
}

export interface IPipelineColumn extends EtapaPipeline {
  title: string;
  leadIds: string[];
  leadsCount?: number;
}
