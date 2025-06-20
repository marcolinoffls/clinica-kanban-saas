
/**
 * Hook para gerenciar assinaturas e planos
 * 
 * Este hook centraliza toda a lógica relacionada a:
 * - Buscar dados da assinatura da clínica
 * - Verificar status do trial
 * - Controlar acesso a recursos por plano
 * - Gerenciar mudanças de plano
 * 
 * Usado em toda a aplicação para controlar funcionalidades
 * baseadas no plano contratado pela clínica.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClinicaData } from './useClinicaData';
import type { Plan, Subscription, TrialStatus, FeatureAccess } from '@/types';

// Hook para buscar todos os planos disponíveis
export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async (): Promise<Plan[]> => {
      console.log('🔍 Buscando planos disponíveis...');

      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price_monthly');

      if (error) {
        console.error('❌ Erro ao buscar planos:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} planos encontrados`);
      return data || [];
    },
    staleTime: 300000, // 5 minutos
  });
};

// Hook para buscar assinatura da clínica atual
export const useSubscription = () => {
  const { clinicaId } = useClinicaData();

  return useQuery({
    queryKey: ['subscription', clinicaId],
    queryFn: async (): Promise<Subscription | null> => {
      if (!clinicaId) {
        console.log('⚠️ Nenhuma clínica ID disponível para buscar assinatura');
        return null;
      }

      console.log('🔍 Buscando assinatura da clínica:', clinicaId);

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans!inner(*)
        `)
        .eq('clinica_id', clinicaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhuma assinatura encontrada - normal para clínicas sem trial/plano
          console.log('ℹ️ Nenhuma assinatura encontrada para clínica:', clinicaId);
          return null;
        }
        console.error('❌ Erro ao buscar assinatura:', error);
        throw error;
      }

      console.log('✅ Assinatura encontrada:', data?.status);
      return data;
    },
    enabled: !!clinicaId,
    staleTime: 30000, // 30 segundos
  });
};

// Hook para verificar status do trial
export const useTrialStatus = (): TrialStatus => {
  const { data: subscription } = useSubscription();

  if (!subscription || subscription.status !== 'trial') {
    return {
      isInTrial: false,
      daysRemaining: 0,
      trialEndDate: null,
      hasExpired: false,
    };
  }

  const now = new Date();
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;

  if (!trialEnd) {
    return {
      isInTrial: false,
      daysRemaining: 0,
      trialEndDate: null,
      hasExpired: false,
    };
  }

  const timeDiff = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  const hasExpired = timeDiff <= 0;

  return {
    isInTrial: true,
    daysRemaining,
    trialEndDate: trialEnd,
    hasExpired,
  };
};

// Hook para controlar acesso a recursos baseado no plano
export const useFeatureAccess = (): FeatureAccess => {
  const { data: subscription } = useSubscription();
  const trialStatus = useTrialStatus();

  // Se não tem assinatura ou trial expirado, acesso limitado
  if (!subscription || (trialStatus.isInTrial && trialStatus.hasExpired)) {
    return {
      ai_chat: false,
      kanban: true, // Funcionalidade básica sempre disponível
      basic_reports: false,
      advanced_reports: false,
      follow_up: false,
      integrations: false,
      priority_support: false,
      max_leads: 10, // Limite muito baixo para forçar upgrade
      max_users: 1,
      max_mensagens_mes: 100,
    };
  }

  // Buscar recursos do plano atual
  const planFeatures = (subscription as any).plans?.features || {};
  
  return {
    ai_chat: planFeatures.ai_chat || false,
    kanban: planFeatures.kanban || true,
    basic_reports: planFeatures.basic_reports || false,
    advanced_reports: planFeatures.advanced_reports || false,
    follow_up: planFeatures.follow_up || false,
    integrations: planFeatures.integrations || false,
    priority_support: planFeatures.priority_support || false,
    max_leads: (subscription as any).plans?.max_leads || null,
    max_users: (subscription as any).plans?.max_users || null,
    max_mensagens_mes: (subscription as any).plans?.max_mensagens_mes || null,
  };
};

// Hook para alterar plano (apenas Admin)
export const useChangePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clinicaId, 
      planId, 
      reason 
    }: { 
      clinicaId: string; 
      planId: string;
      reason?: string;
    }) => {
      console.log('🔄 Alterando plano da clínica:', clinicaId, 'para plano:', planId);

      // Buscar assinatura atual
      const { data: currentSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('clinica_id', clinicaId)
        .single();

      if (currentSubscription) {
        // Atualizar assinatura existente
        const { data, error } = await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            updated_at: new Date().toISOString(),
          })
          .eq('clinica_id', clinicaId)
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao atualizar assinatura:', error);
          throw new Error(`Erro ao alterar plano: ${error.message}`);
        }

        // Criar registro no histórico
        await supabase
          .from('subscription_history')
          .insert({
            subscription_id: data.id,
            old_plan_id: currentSubscription.plan_id,
            new_plan_id: planId,
            change_reason: reason || 'Alteração manual pelo admin',
          });

        return data;
      } else {
        // Criar nova assinatura
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            clinica_id: clinicaId,
            plan_id: planId,
            status: 'active',
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao criar assinatura:', error);
          throw new Error(`Erro ao criar assinatura: ${error.message}`);
        }

        // Criar registro no histórico
        await supabase
          .from('subscription_history')
          .insert({
            subscription_id: data.id,
            old_plan_id: null,
            new_plan_id: planId,
            change_reason: reason || 'Primeiro plano da clínica',
          });

        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Plano alterado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao alterar plano:', error);
      toast.error(`Erro ao alterar plano: ${error.message}`);
    },
  });
};

// Hook para verificar se ultrapassou limites do plano
export const usePlanLimits = () => {
  const { data: leads = [] } = useQuery(['leads']);
  const featureAccess = useFeatureAccess();

  const isOverLeadLimit = featureAccess.max_leads 
    ? leads.length > featureAccess.max_leads 
    : false;

  const isOverMessageLimit = false; // TODO: Implementar contagem de mensagens

  return {
    isOverLeadLimit,
    isOverMessageLimit,
    currentLeadCount: leads.length,
    maxLeads: featureAccess.max_leads,
    maxMessages: featureAccess.max_mensagens_mes,
  };
};
