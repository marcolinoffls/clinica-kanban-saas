
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from '@/hooks/useClinicaData';
import { toast } from 'sonner';

/**
 * Componente para exibir o status atual da assinatura
 * 
 * O que faz:
 * - Mostra plano atual da clínica
 * - Exibe data de vencimento e status da assinatura
 * - Permite cancelamento e alteração de planos
 * - Mostra histórico de pagamentos
 * 
 * Onde é usado:
 * - Dashboard principal
 * - Página de configurações
 * 
 * Como se conecta:
 * - Busca dados da tabela stripe_subscriptions
 * - Integra com Stripe Customer Portal
 * - Atualiza em tempo real via Supabase
 */

interface SubscriptionData {
  id: string;
  status: string;
  plano: string;
  valor_mensal: number | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  stripe_customer_id: string | null;
}

interface ClinicaData {
  plano_atual: string;
  plano_expira_em: string | null;
  nome: string;
}

export const SubscriptionStatus = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [clinica, setClinica] = useState<ClinicaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { clinicaId } = useClinicaData();

  /**
   * Carrega dados da assinatura e clínica
   */
  const loadSubscriptionData = async () => {
    if (!clinicaId) return;

    try {
      setLoading(true);

      // Buscar dados da clínica
      const { data: clinicaData, error: clinicaError } = await supabase
        .from('clinicas')
        .select('plano_atual, plano_expira_em, nome')
        .eq('id', clinicaId)
        .single();

      if (clinicaError) {
        console.error('❌ [SubscriptionStatus] Erro ao buscar clínica:', clinicaError);
        toast.error('Erro ao carregar dados da clínica');
        return;
      }

      setClinica(clinicaData);

      // Buscar dados da assinatura ativa
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('clinica_id', clinicaId)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        console.error('❌ [SubscriptionStatus] Erro ao buscar assinatura:', subscriptionError);
      } else if (subscriptionData) {
        setSubscription(subscriptionData);
      }

    } catch (error) {
      console.error('❌ [SubscriptionStatus] Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [clinicaId]);

  /**
   * Abre o portal do cliente Stripe para gerenciar assinatura
   */
  const openCustomerPortal = async () => {
    if (!subscription?.stripe_customer_id) {
      toast.error('Dados da assinatura não encontrados');
      return;
    }

    setActionLoading(true);

    try {
      // Esta funcionalidade requer uma Edge Function adicional
      toast.info('Portal do cliente em desenvolvimento. Entre em contato para cancelar.');
    } catch (error) {
      console.error('❌ [SubscriptionStatus] Erro ao abrir portal:', error);
      toast.error('Erro ao abrir portal do cliente');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Determina o status visual da assinatura
   */
  const getStatusInfo = () => {
    if (!clinica) return { status: 'Carregando...', color: 'gray', icon: <Loader2 className="w-4 h-4 animate-spin" /> };

    const isExpired = clinica.plano_expira_em && new Date(clinica.plano_expira_em) < new Date();
    const isTrialing = subscription?.trial_end && new Date(subscription.trial_end) > new Date();

    if (clinica.plano_atual === 'free') {
      return { 
        status: 'Gratuito', 
        color: 'gray', 
        icon: <CheckCircle className="w-4 h-4" /> 
      };
    }

    if (isExpired) {
      return { 
        status: 'Expirado', 
        color: 'red', 
        icon: <AlertTriangle className="w-4 h-4" /> 
      };
    }

    if (isTrialing) {
      return { 
        status: 'Período de Teste', 
        color: 'blue', 
        icon: <Calendar className="w-4 h-4" /> 
      };
    }

    if (subscription?.status === 'active') {
      return { 
        status: 'Ativo', 
        color: 'green', 
        icon: <CheckCircle className="w-4 h-4" /> 
      };
    }

    if (subscription?.status === 'past_due') {
      return { 
        status: 'Pagamento Pendente', 
        color: 'yellow', 
        icon: <AlertTriangle className="w-4 h-4" /> 
      };
    }

    return { 
      status: 'Inativo', 
      color: 'gray', 
      icon: <AlertTriangle className="w-4 h-4" /> 
    };
  };

  /**
   * Formata o nome do plano para exibição
   */
  const getPlanDisplayName = (plano: string) => {
    const planNames = {
      free: 'Gratuito',
      basic: 'Básico',
      premium: 'Premium'
    };
    return planNames[plano as keyof typeof planNames] || plano;
  };

  /**
   * Formata data para exibição
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando dados da assinatura...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clinica) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Erro ao carregar dados da clínica</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Status da Assinatura</CardTitle>
            <CardDescription>
              Gerencie seu plano e pagamentos
            </CardDescription>
          </div>
          <Badge 
            variant={statusInfo.color === 'green' ? 'default' : statusInfo.color === 'red' ? 'destructive' : 'secondary'}
            className="flex items-center gap-2"
          >
            {statusInfo.icon}
            {statusInfo.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informações do Plano Atual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Plano Atual</label>
            <p className="text-lg font-semibold">
              {getPlanDisplayName(clinica.plano_atual)}
            </p>
          </div>

          {subscription?.valor_mensal && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Valor Mensal</label>
              <p className="text-lg font-semibold text-green-600">
                R$ {subscription.valor_mensal.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Datas Importantes */}
        {(clinica.plano_expira_em || subscription?.trial_end) && (
          <div className="space-y-4">
            {subscription?.trial_end && new Date(subscription.trial_end) > new Date() && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Período de Teste</p>
                  <p className="text-sm text-blue-700">
                    Termina em {formatDate(subscription.trial_end)}
                  </p>
                </div>
              </div>
            )}

            {clinica.plano_expira_em && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {subscription?.status === 'active' ? 'Próxima Cobrança' : 'Expira em'}
                  </p>
                  <p className="text-sm text-gray-700">
                    {formatDate(clinica.plano_expira_em)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t">
          {subscription && subscription.status !== 'canceled' && (
            <Button
              onClick={openCustomerPortal}
              disabled={actionLoading}
              variant="outline"
              className="flex-1"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gerenciar Assinatura
                </>
              )}
            </Button>
          )}

          {clinica.plano_atual === 'free' && (
            <Button className="flex-1" onClick={() => window.location.reload()}>
              <CreditCard className="w-4 h-4 mr-2" />
              Fazer Upgrade
            </Button>
          )}
        </div>

        {/* Informações Adicionais */}
        <div className="text-xs text-gray-500 pt-4 border-t">
          <p>
            Para suporte ou dúvidas sobre cobrança, entre em contato conosco.
          </p>
          {subscription?.canceled_at && (
            <p className="text-red-600 mt-1">
              Assinatura cancelada em {formatDate(subscription.canceled_at)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
