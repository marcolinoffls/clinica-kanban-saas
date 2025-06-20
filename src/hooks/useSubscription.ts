import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plan, Subscription, SubscriptionStatus, FeatureAccess } from '@/types';
import { useClinicaData } from './useClinicaData';
import { useQuery } from '@tanstack/react-query';

export const useSubscription = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { clinica } = useClinicaData();

  // Buscar planos disponíveis
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price_monthly');

      if (error) throw error;

      // Converter features de Json para Record<string, any>
      const plansWithFeatures = data.map(plan => ({
        ...plan,
        features: typeof plan.features === 'string' 
          ? JSON.parse(plan.features) 
          : plan.features || {}
      })) as Plan[];

      setPlans(plansWithFeatures);
    } catch (err: any) {
      console.error('Erro ao buscar planos:', err);
      setError(err.message);
    }
  };

  // Buscar assinatura da clínica
  const fetchSubscription = async () => {
    if (!clinica?.id) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (*)
        `)
        .eq('clinica_id', clinica.id)
        .eq('status', 'active')
        .or('status.eq.trial')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Converter status para o tipo correto
        const subscriptionData: Subscription = {
          ...data,
          status: data.status as SubscriptionStatus,
          plans: {
            ...data.plans,
            features: typeof data.plans.features === 'string' 
              ? JSON.parse(data.plans.features) 
              : data.plans.features || {}
          }
        };
        setSubscription(subscriptionData);
      }
    } catch (err: any) {
      console.error('Erro ao buscar assinatura:', err);
      setError(err.message);
    }
  };

  // Verificar acesso a uma funcionalidade
  const checkFeatureAccess = async (feature: string): Promise<FeatureAccess> => {
    if (!clinica?.id) {
      return FeatureAccess.DENIED;
    }

    // Se a assinatura está em trial, conceder acesso
    if (subscription?.status === 'trial') {
      return FeatureAccess.TRIAL;
    }

    // Se não tem assinatura, negar acesso
    if (!subscription) {
      return FeatureAccess.DENIED;
    }

    // Se o plano não tem a funcionalidade, negar acesso
    if (!subscription.plans.features[feature]) {
      return FeatureAccess.DENIED;
    }

    // Se a funcionalidade está habilitada, conceder acesso
    return FeatureAccess.GRANTED;
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPlans(), fetchSubscription()])
      .finally(() => setLoading(false));
  }, [clinica?.id]);

  const hasFeatureAccess = async (feature: string): Promise<FeatureAccess> => {
    return checkFeatureAccess(feature);
  };

  const useFeatureAccess = (feature: string): FeatureAccess => {
    const { data: featureData } = useQuery({
      queryKey: ['feature-access', feature, clinica?.id],
      queryFn: () => checkFeatureAccess(feature),
      enabled: !!clinica?.id && !!feature,
    });

    return featureData || FeatureAccess.DENIED;
  };

  return {
    plans,
    subscription,
    loading,
    error,
    fetchSubscription,
    hasFeatureAccess,
    useFeatureAccess
  };
};
