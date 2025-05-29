
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from './useClinicaData';
import { toast } from 'sonner';

/**
 * Hook para gerenciar configurações de IA da clínica
 * 
 * Funcionalidades:
 * - Busca configurações de IA da clínica atual
 * - Atualiza configurações de IA no Supabase
 * - Gerencia estado de loading e erro
 * 
 * Utiliza o hook useClinicaData para obter o clinica_id
 * e garante que apenas configurações da clínica do usuário sejam acessadas
 */

interface AISettings {
  ai_active_for_all_new_leads: boolean;
  ai_active_for_ad_leads_only: boolean;
  ai_chat_suggestions_active: boolean;
  ai_name: string | null;
  ai_restricted_topics_prompt: string | null;
  ai_operating_mode: string;
  ai_business_hours_start_weekday: string | null;
  ai_business_hours_end_weekday: string | null;
  ai_active_saturday: boolean;
  ai_saturday_hours_start: string | null;
  ai_saturday_hours_end: string | null;
  ai_active_sunday: boolean;
  ai_sunday_hours_start: string | null;
  ai_sunday_hours_end: string | null;
  ai_clinica_prompt: string | null;
}

export const useClinicAISettings = () => {
  const { clinicaId, loading: clinicaLoading } = useClinicaData();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Buscar configurações de IA da clínica
  const fetchAISettings = async () => {
    if (!clinicaId || clinicaLoading) return;

    try {
      setLoading(true);
      console.log('🤖 Buscando configurações de IA para clínica:', clinicaId);

      const { data, error } = await supabase
        .from('clinicas')
        .select(`
          ai_active_for_all_new_leads,
          ai_active_for_ad_leads_only,
          ai_chat_suggestions_active,
          ai_name,
          ai_restricted_topics_prompt,
          ai_operating_mode,
          ai_business_hours_start_weekday,
          ai_business_hours_end_weekday,
          ai_active_saturday,
          ai_saturday_hours_start,
          ai_saturday_hours_end,
          ai_active_sunday,
          ai_sunday_hours_start,
          ai_sunday_hours_end,
          ai_clinica_prompt
        `)
        .eq('id', clinicaId)
        .single();

      if (error) {
        console.error('Erro ao buscar configurações de IA:', error);
        throw error;
      }

      console.log('✅ Configurações de IA carregadas:', data);
      setSettings(data as AISettings);
    } catch (error) {
      console.error('Erro ao carregar configurações de IA:', error);
      toast.error('Erro ao carregar configurações de IA');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações de IA
  const saveAISettings = async (newSettings: Partial<AISettings>) => {
    if (!clinicaId) {
      toast.error('ID da clínica não encontrado');
      return false;
    }

    try {
      setSaving(true);
      console.log('💾 Salvando configurações de IA:', newSettings);

      const { error } = await supabase
        .from('clinicas')
        .update(newSettings)
        .eq('id', clinicaId);

      if (error) {
        console.error('Erro ao salvar configurações de IA:', error);
        throw error;
      }

      console.log('✅ Configurações de IA salvas com sucesso');
      
      // Atualizar estado local
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      
      toast.success('Configurações de IA salvas com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações de IA:', error);
      toast.error('Erro ao salvar configurações de IA');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading: loading || clinicaLoading,
    saving,
    fetchAISettings,
    saveAISettings,
    // Indicador se as configurações estão prontas para uso
    isReady: !!clinicaId && !clinicaLoading && !!settings
  };
};
