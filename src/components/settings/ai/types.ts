
/**
 * Tipos e Interfaces para Configurações de IA
 * 
 * Define a estrutura de dados das configurações de IA
 * e tipos auxiliares utilizados pelos componentes de configuração
 */

export interface AISettings {
  ai_active_for_all_new_leads: boolean;
  ai_active_for_ad_leads_only: boolean;
  ai_chat_suggestions_active: boolean;
  ai_business_hours_start_weekday: string;
  ai_business_hours_end_weekday: string;
  ai_active_saturday: boolean;
  ai_saturday_hours_start: string;
  ai_saturday_hours_end: string;
  ai_active_sunday: boolean;
  ai_sunday_hours_start: string;
  ai_sunday_hours_end: string;
  ai_operating_mode: string;
  ai_name: string;
  ai_clinica_prompt: string;
  ai_restricted_topics_prompt: string;
  admin_prompt: string;
}

/**
 * Configurações padrão da IA
 * Define valores iniciais para exibir o formulário rapidamente,
 * antes mesmo dos dados chegarem do Supabase
 */
export const defaultAISettings: AISettings = {
  ai_active_for_all_new_leads: false,
  ai_active_for_ad_leads_only: false,
  ai_chat_suggestions_active: false,
  ai_business_hours_start_weekday: '08:00',
  ai_business_hours_end_weekday: '18:00',
  ai_active_saturday: false,
  ai_saturday_hours_start: '08:00',
  ai_saturday_hours_end: '12:00',
  ai_active_sunday: false,
  ai_sunday_hours_start: '08:00',
  ai_sunday_hours_end: '12:00',
  ai_operating_mode: '24/7',
  ai_name: '',
  ai_clinica_prompt: '',
  ai_restricted_topics_prompt: '',
  admin_prompt: ''
};

export type UpdateSettingFunction = (key: keyof AISettings, value: any) => void;
