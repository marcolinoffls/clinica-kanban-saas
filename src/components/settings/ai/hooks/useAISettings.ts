import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from '@/contexts/ClinicaContext';
import { toast } from 'sonner';
import { AISettings, defaultAISettings } from '../types';

/**
 * Hook para Gerenciamento das Configurações de IA
 * 
 * Centraliza toda a lógica de busca, atualização e salvamento
 * das configurações de IA da clínica no Supabase.
 * Pode operar com a clínica do contexto atual ou com um ID de clínica explícito,
 * tornando-o reutilizável tanto na página de configurações do usuário quanto no painel de admin.
 * 
 * @param clinicaIdProp - (Opcional) ID da clínica para operar. Se não for fornecido, usa a clínica do AuthContext.
 */
export const useAISettings = (clinicaIdProp?: string) => {
  const { clinicaAtiva, isLoading: clinicaLoading, hasClinica } = useClinica();
  const queryClient = useQueryClient();
  
  // Determina qual ID de clínica usar: o explícito (prop) ou o do contexto.
  // Isso permite que o hook seja usado tanto na página de configurações da clínica quanto no painel de admin.
  const clinicaId = clinicaIdProp || clinicaAtiva?.id;
  
  // Estado local inicializado com configurações padrão para carregamento mais rápido
  const [settings, setSettings] = useState<AISettings>(defaultAISettings);

  // Buscar configurações atuais da clínica (apenas se um ID de clínica estiver disponível)
  const { data: currentSettings, isLoading, error } = useQuery({
    queryKey: ['clinica-ai-settings', clinicaId], // A chave de query agora depende do ID da clínica
    queryFn: async () => {
      // Validação para garantir que temos um ID antes de consultar o banco
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado');
      }

      console.log('[useAISettings] Buscando configurações da IA para clínica:', clinicaId);
      
      const { data, error } = await supabase
        .from('clinicas')
        .select(`
          ai_active_for_all_new_leads,
          ai_active_for_ad_leads_only,
          ai_chat_suggestions_active,
          ai_business_hours_start_weekday,
          ai_business_hours_end_weekday,
          ai_active_saturday,
          ai_saturday_hours_start,
          ai_saturday_hours_end,
          ai_active_sunday,
          ai_sunday_hours_start,
          ai_sunday_hours_end,
          ai_operating_mode,
          ai_name,
          ai_clinica_prompt,
          ai_restricted_topics_prompt,
          admin_prompt
        `)
        .eq('id', clinicaId) // Usa o ID determinado para a busca
        .single();

      if (error) {
        console.error('[useAISettings] Erro ao buscar configurações da IA:', error);
        throw error;
      }

      console.log('[useAISettings] Configurações da IA carregadas:', data);
      return data;
    },
    // A query só é executada se houver um ID de clínica
    enabled: !!clinicaId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 1
  });

  // Atualizar estado local quando os dados chegarem do Supabase
  useEffect(() => {
    if (currentSettings) {
      console.log('[useAISettings] Atualizando estado local com dados do Supabase');
      
      setSettings({
        ai_active_for_all_new_leads: currentSettings.ai_active_for_all_new_leads ?? false,
        ai_active_for_ad_leads_only: currentSettings.ai_active_for_ad_leads_only ?? false,
        ai_chat_suggestions_active: currentSettings.ai_chat_suggestions_active ?? false,
        ai_business_hours_start_weekday: currentSettings.ai_business_hours_start_weekday ?? '08:00',
        ai_business_hours_end_weekday: currentSettings.ai_business_hours_end_weekday ?? '18:00',
        ai_active_saturday: currentSettings.ai_active_saturday ?? false,
        ai_saturday_hours_start: currentSettings.ai_saturday_hours_start ?? '08:00',
        ai_saturday_hours_end: currentSettings.ai_saturday_hours_end ?? '12:00',
        ai_active_sunday: currentSettings.ai_active_sunday ?? false,
        ai_sunday_hours_start: currentSettings.ai_sunday_hours_start ?? '08:00',
        ai_sunday_hours_end: currentSettings.ai_sunday_hours_end ?? '12:00',
        ai_operating_mode: currentSettings.ai_operating_mode ?? '24/7',
        ai_name: currentSettings.ai_name ?? '',
        ai_clinica_prompt: currentSettings.ai_clinica_prompt ?? '',
        ai_restricted_topics_prompt: currentSettings.ai_restricted_topics_prompt ?? '',
        admin_prompt: currentSettings.admin_prompt ?? ''
      });
    }
  }, [currentSettings]);

  // Mutation para salvar as configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AISettings) => {
      if (!clinicaId) {
        throw new Error('ID da clínica não encontrado para salvamento');
      }

      console.log('[useAISettings] Salvando configurações da IA:', newSettings);
      console.log('[useAISettings] ID da clínica:', clinicaId);

      // Garantir que todas as propriedades da interface AISettings sejam incluídas
      const settingsToUpdate = {
        ai_active_for_all_new_leads: newSettings.ai_active_for_all_new_leads,
        ai_active_for_ad_leads_only: newSettings.ai_active_for_ad_leads_only,
        ai_chat_suggestions_active: newSettings.ai_chat_suggestions_active,
        ai_business_hours_start_weekday: newSettings.ai_business_hours_start_weekday,
        ai_business_hours_end_weekday: newSettings.ai_business_hours_end_weekday,
        ai_active_saturday: newSettings.ai_active_saturday,
        ai_saturday_hours_start: newSettings.ai_saturday_hours_start,
        ai_saturday_hours_end: newSettings.ai_saturday_hours_end,
        ai_active_sunday: newSettings.ai_active_sunday,
        ai_sunday_hours_start: newSettings.ai_sunday_hours_start,
        ai_sunday_hours_end: newSettings.ai_sunday_hours_end,
        ai_operating_mode: newSettings.ai_operating_mode,
        ai_name: newSettings.ai_name,
        ai_clinica_prompt: newSettings.ai_clinica_prompt,
        ai_restricted_topics_prompt: newSettings.ai_restricted_topics_prompt,
        admin_prompt: newSettings.admin_prompt,
        updated_at: new Date().toISOString() // Adicionar timestamp de atualização
      };

      console.log('[useAISettings] Objeto que será enviado ao Supabase:', settingsToUpdate);

      const { error } = await supabase
        .from('clinicas')
        .update(settingsToUpdate)
        .eq('id', clinicaId); // Usa o ID determinado para a atualização

      if (error) {
        console.error('[useAISettings] Erro ao salvar configurações da IA:', error);
        throw error;
      }

      console.log('[useAISettings] Configurações da IA salvas com sucesso');
    },
    onSuccess: () => {
      // Invalidar cache para a clínica específica para recarregar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['clinica-ai-settings', clinicaId] });
      toast.success('Configurações da IA salvas com sucesso!');
    },
    onError: (error: any) => {
      console.error('[useAISettings] Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações da IA');
    }
  });

  // Função para atualizar um campo específico no estado local
  const updateSetting = (key: keyof AISettings, value: any) => {
    console.log(`[useAISettings] Atualizando configuração ${key}:`, value);
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Função para salvar todas as configurações
  const handleSave = () => {
    if (!clinicaId) {
      toast.error('Erro: Clínica não encontrada');
      return;
    }
    console.log('[useAISettings] Iniciando salvamento das configurações');
    saveSettingsMutation.mutate(settings);
  };

  return {
    settings,
    updateSetting,
    handleSave,
    // O estado de carregamento considera o carregamento da query e, se não for modo admin, o carregamento do contexto da clínica.
    isLoading: isLoading || (clinicaLoading && !clinicaIdProp),
    error,
    isSaving: saveSettingsMutation.isPending,
    queryClient,
    hasClinica // Expor se a clínica está disponível
  };
};
