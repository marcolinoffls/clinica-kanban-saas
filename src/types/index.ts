// Tipos centralizados do sistema

// Interface para planos de assinatura
export interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_leads: number;
  max_mensagens_mes: number;
  features: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Status de assinatura
export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'past_due' | 'unpaid';

// Interface para assinaturas
export interface Subscription {
  id: string;
  clinica_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_end: string;
  canceled_at: string | null;
  ended_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  plans: Plan;
}

// Enum para acesso a funcionalidades
export enum FeatureAccess {
  GRANTED = 'granted',
  DENIED = 'denied',
  TRIAL = 'trial'
}

// Interface para leads - CORRIGIDA para ser consistente
export interface Lead {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  origem_lead?: string | null;
  servico_interesse?: string | null;
  anotacoes?: string | null;
  data_ultimo_contato?: string | null;
  convertido: boolean;
  clinica_id: string;
  etapa_id: string; // Campo obrigatório principal
  etapa_kanban_id?: string; // Campo alternativo para compatibilidade
  tag_ids?: string[] | null;
  tag_id?: string | null; // Campo individual para compatibilidade
  avatar_url?: string | null;
  anuncio?: string | null;
  ad_name?: string | null;
  ad_ink?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  ai_conversation_enabled: boolean;
  ltv?: number | null; // ADICIONADO campo LTV
  created_at: string;
  updated_at: string;
  nome_clinica?: string; // Para exibição Admin
  etapas_kanban?: {
    id: string;
    nome: string;
    cor: string;
    ordem: number;
  };
}

// Interface para etapas
export interface Etapa {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  clinica_id: string;
  created_at: string;
  updated_at: string;
}

// Interface para tags
export interface Tag {
  id: string;
  nome: string;
  cor: string;
  clinica_id: string;
  created_at: string;
  updated_at: string;
}

// Interface para mensagens de chat
export interface ChatMessage {
  id: string;
  lead_id: string;
  clinica_id: string;
  conteudo: string;
  enviado_por: 'usuario' | 'lead' | 'ia';
  tipo: 'texto' | 'imagem' | 'audio' | 'arquivo';
  anexo_url?: string | null;
  lida: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para respostas prontas
export interface RespostaPronta {
  id: string;
  titulo: string;
  conteudo: string;
  categoria?: string | null;
  ativo: boolean;
  clinica_id: string;
  created_at: string;
  updated_at: string;
}

// Interface para dados de mensagem no chat
export interface MessageData {
  type: string;
  content: string;
  anexoUrl?: string;
  aiEnabled?: boolean;
}

// Interface para clínica básica (usado no seletor de Admin)
export interface ClinicaBasica {
  id: string;
  nome: string;
  status: string;
}
