
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClinicaData } from './useClinicaData';
import type { Plan, Subscription, FeatureAccess } from '@/types';

/**
 * Hook para buscar todos os planos disponíveis
 */
export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        throw error;
      }

      return data as Plan[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para buscar assinatura da clínica
 */
export const useSubscription = () => {
  const { clinicaId } = useClinicaData();

  return useQuery({
    queryKey: ['subscription', clinicaId],
    queryFn: async () => {
      if (!clinicaId) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (*)
        `)
        .eq('clinica_id', clinicaId)
        .single();

      if (error) {
        console.error('Erro ao buscar assinatura:', error);
        throw error;
      }

      return data as Subscription;
    },
    enabled: !!clinicaId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para alterar plano
 */
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
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          plan_id: planId,
          updated_at: new Date().toISOString()
        })
        .eq('clinica_id', clinicaId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao alterar plano:', error);
        throw error;
      }

      // Registrar no histórico
      if (reason) {
        await supabase
          .from('subscription_history')
          .insert({
            subscription_id: data.id,
            new_plan_id: planId,
            change_reason: reason
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Plano alterado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar plano: ${error.message}`);
    },
  });
};

/**
 * Hook para verificar status do trial
 */
export const useTrialStatus = () => {
  const { data: subscription } = useSubscription();

  const isInTrial = subscription?.status === 'trial';
  const trialEndDate = subscription?.trial_end ? new Date(subscription.trial_end) : null;
  const hasExpired = trialEndDate ? trialEndDate < new Date() : false;
  const daysRemaining = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return {
    isInTrial,
    trialEndDate,
    hasExpired,
    daysRemaining
  };
};

/**
 * Hook para verificar acesso a funcionalidades
 */
export const useFeatureAccess = (): Record<string, boolean> | null => {
  const { data: subscription } = useSubscription();

  if (!subscription) return null;

  const features = subscription.plans?.features || {};
  
  // Converter features do plano em um mapa de acesso
  const featureAccess: Record<string, boolean> = {};
  
  Object.keys(features).forEach(feature => {
    featureAccess[feature] = !!features[feature];
  });

  return featureAccess;
};
