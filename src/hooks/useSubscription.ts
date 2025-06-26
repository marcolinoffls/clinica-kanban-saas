
/**
 * Hook useSubscription
 * 
 * DESCRIÇÃO:
 * Hook customizado para gerenciar o estado de assinatura do usuário.
 * Ele fornece funções para verificar status de assinatura, criar checkout
 * e acessar o portal do cliente.
 * 
 * FUNCIONALIDADES:
 * - Verificação automática de status de assinatura
 * - Criação de sessões de checkout
 * - Acesso ao portal do cliente do Stripe
 * - Cache de dados de assinatura
 * - Estados de loading para operações
 * 
 * INTEGRAÇÃO:
 * - Conecta com as Edge Functions do Stripe
 * - Usa contexto de autenticação
 * - Atualiza estado global de assinatura
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  error?: string;
}

interface UseSubscriptionReturn {
  // Estados de dados
  subscriptionData: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  
  // Funções de ação
  checkSubscription: () => Promise<void>;
  createCheckout: (priceId?: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  
  // Estados de operação
  isCreatingCheckout: boolean;
  isOpeningPortal: boolean;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user, session } = useAuth();
  
  // Estados principais
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de operações
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  /**
   * Verifica o status da assinatura do usuário
   * Chama a Edge Function check-subscription
   */
  const checkSubscription = async () => {
    if (!user || !session) {
      console.log('[useSubscription] Usuário não autenticado, pulando verificação');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[useSubscription] Verificando status da assinatura...');
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'check-subscription',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      console.log('[useSubscription] Status da assinatura recebido:', data);
      setSubscriptionData(data);
      
    } catch (err: any) {
      console.error('[useSubscription] Erro ao verificar assinatura:', err);
      setError(err.message || 'Erro ao verificar status da assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cria uma sessão de checkout do Stripe
   * @param priceId - ID do preço no Stripe (opcional)
   */
  const createCheckout = async (priceId?: string) => {
    if (!user || !session) {
      setError('Usuário deve estar logado para criar checkout');
      return;
    }

    try {
      setIsCreatingCheckout(true);
      setError(null);
      
      console.log('[useSubscription] Criando sessão de checkout...', { priceId });
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'create-checkout',
        {
          body: { priceId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.url) {
        console.log('[useSubscription] Redirecionando para checkout:', data.url);
        // Abrir checkout em nova aba
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de checkout não retornada');
      }
      
    } catch (err: any) {
      console.error('[useSubscription] Erro ao criar checkout:', err);
      setError(err.message || 'Erro ao criar sessão de checkout');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  /**
   * Abre o portal do cliente do Stripe
   */
  const openCustomerPortal = async () => {
    if (!user || !session) {
      setError('Usuário deve estar logado para acessar o portal');
      return;
    }

    try {
      setIsOpeningPortal(true);
      setError(null);
      
      console.log('[useSubscription] Abrindo portal do cliente...');
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'customer-portal',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.url) {
        console.log('[useSubscription] Redirecionando para portal:', data.url);
        // Abrir portal em nova aba
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL do portal não retornada');
      }
      
    } catch (err: any) {
      console.error('[useSubscription] Erro ao abrir portal:', err);
      setError(err.message || 'Erro ao abrir portal do cliente');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // Verificar status automaticamente quando o usuário logar
  useEffect(() => {
    if (user && session) {
      console.log('[useSubscription] Usuário logado, verificando assinatura automaticamente');
      checkSubscription();
    } else {
      // Limpar dados quando usuário deslogar
      setSubscriptionData(null);
      setError(null);
    }
  }, [user?.id, session?.access_token]);

  return {
    // Estados de dados
    subscriptionData,
    isLoading,
    error,
    
    // Funções de ação
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    
    // Estados de operação
    isCreatingCheckout,
    isOpeningPortal,
  };
};
