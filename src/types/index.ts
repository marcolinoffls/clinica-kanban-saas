
/**
 * Tipos centralizados da aplicação
 * 
 * Este arquivo centraliza todas as interfaces e tipos utilizados
 * em toda a aplicação, evitando duplicação e erros de importação.
 */

// Interface principal do Lead (usada em toda aplicação)
export interface Lead {
  id: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  etapa_kanban_id: string | null;
  tag_id: string | null;
  anotacoes: string | null;
  origem_lead: string | null;
  servico_interesse: string | null;
  status_conversao: string | null;
  convertido: boolean | null;
  ltv: number | null;
  data_ultimo_contato: string | null;
  clinica_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  follow_up_pausado: boolean | null;
  data_ultimo_followup: string | null;
  ai_conversation_enabled: boolean | null;
  // Campos adicionais para compatibilidade
  etapa_id: string | null;
  avatar_url: string | null;
  nome_clinica: string | null;
  ad_name: string | null;
  // Campos do Instagram/Direct
  name: string | null;
  phone: string | null;
  notes: string | null;
  anuncio: string | null;
  id_direct: string | null;
  meu_id_direct: string | null;
  ad_ink: string | null;
  tag_id_alias: string | null;
}

// Interface para criação de Lead
export interface CreateLeadData {
  nome?: string;
  telefone?: string;
  email?: string;
  etapa_kanban_id?: string;
  tag_id?: string;
  anotacoes?: string;
  origem_lead?: string;
  servico_interesse?: string;
  clinica_id: string;
  follow_up_pausado?: boolean;
  ai_conversation_enabled?: boolean;
  ad_name?: string;
}

// Interface para atualização de Lead
export interface UpdateLeadData extends Partial<CreateLeadData> {
  id: string;
  data_ultimo_followup?: string;
}

// Interface da Etapa Kanban
export interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  clinica_id: string | null;
  created_at: string | null;
}

// Interface para criação de Etapa
export interface CreateEtapaData {
  nome: string;
  ordem: number;
  clinica_id: string;
}

// Interface para atualização de Etapa
export interface UpdateEtapaData extends Partial<CreateEtapaData> {
  id: string;
}

// Interfaces do Sistema de Planos
export interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_leads: number | null;
  max_users: number | null;
  max_mensagens_mes: number | null;
  features: Record<string, any>;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  active: boolean;
  trial_days: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  clinica_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'canceled' | 'past_due' | 'unpaid';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  old_plan_id: string | null;
  new_plan_id: string;
  change_reason: string | null;
  changed_by: string | null;
  created_at: string;
}

// Interface para controle de recursos por plano
export interface FeatureAccess {
  ai_chat: boolean;
  kanban: boolean;
  basic_reports: boolean;
  advanced_reports: boolean;
  follow_up: boolean;
  integrations: boolean;
  priority_support: boolean;
  // Limites numéricos
  max_leads: number | null;
  max_users: number | null;
  max_mensagens_mes: number | null;
}

// Status do trial
export interface TrialStatus {
  isInTrial: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  hasExpired: boolean;
}
