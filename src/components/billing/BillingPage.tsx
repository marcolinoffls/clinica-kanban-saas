
/**
 * Componente BillingPage
 * 
 * DESCRIÇÃO:
 * Página principal de cobrança e gerenciamento de assinaturas.
 * Exibe o status atual da assinatura, opções de planos disponíveis
 * e permite acesso ao portal do cliente para gerenciamento.
 * Agora com Price IDs dinâmicos baseados no ambiente.
 * 
 * FUNCIONALIDADES:
 * - Exibição do status atual da assinatura
 * - Cards com opções de planos (Basic, Premium)
 * - Price IDs dinâmicos (teste/produção)
 * - Botões de ação para checkout e portal do cliente
 * - Indicador visual do plano atual e ambiente
 * - Estados de loading para operações
 * 
 * INTEGRAÇÃO:
 * - Usa hook useSubscription para gerenciar estado
 * - Conecta com Edge Functions do Stripe
 * - Price IDs sincronizados com as Edge Functions
 * - Atualiza dados em tempo real
 */

import React, { useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentEnvironment, getPriceId, isTestEnvironment } from '@/utils/stripeEnvironment';

// Definição dos planos disponíveis com IDs dinâmicos do Stripe
const getPlansForEnvironment = () => {
  const currentEnvironment = getCurrentEnvironment();
  
  return [
    {
      id: 'basic',
      name: 'Básico',
      price: 'R$ 97',
      period: '/mês',
      description: 'Ideal para clínicas pequenas',
      features: ['Até 100 leads por mês', 'Chat básico', 'Relatórios simples', 'Suporte por email'],
      priceId: getPriceId('basic', currentEnvironment),
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'R$ 147',
      period: '/mês',
      description: 'Para clínicas em crescimento',
      features: ['Leads ilimitados', 'IA avançada', 'Relatórios completos', 'Integrações avançadas', 'Suporte prioritário'],
      priceId: getPriceId('premium', currentEnvironment),
      popular: true
    }
  ];
};

const BillingPage = () => {
  // Hook para gerenciar todas as operações de assinatura
  const {
    subscriptionData,
    isLoading,
    error,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    isCreatingCheckout,
    isOpeningPortal
  } = useSubscription();

  // Obter planos com Price IDs dinâmicos
  const PLANS = getPlansForEnvironment();
  const currentEnvironment = getCurrentEnvironment();
  const isTestMode = isTestEnvironment();

  // Verificar status ao carregar a página
  useEffect(() => {
    checkSubscription();
  }, []);

  // Exibir mensagens de sucesso/erro vindas da URL (após checkout)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success('Assinatura ativada com sucesso!');
      // Verificar status após sucesso
      setTimeout(() => checkSubscription(), 2000);
    } else if (urlParams.get('canceled') === 'true') {
      toast.info('Checkout cancelado.');
    }
  }, []);

  // Função para selecionar um plano e iniciar checkout
  const handleSelectPlan = async (plan: typeof PLANS[0]) => {
    console.log(`[BillingPage] Iniciando checkout para plano ${plan.name} com Price ID: ${plan.priceId} (ambiente: ${currentEnvironment})`);
    await createCheckout(plan.priceId);
  };

  // Função para abrir o portal do cliente
  const handleManageSubscription = async () => {
    await openCustomerPortal();
  };

  // Função para obter o plano atual do usuário
  const getCurrentPlan = () => {
    if (!subscriptionData?.subscription_tier) return null;
    return PLANS.find(plan => plan.id === subscriptionData.subscription_tier);
  };

  // Função para formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Estado de loading inicial
  if (isLoading && !subscriptionData) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-500">Carregando informações de cobrança...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Cabeçalho da página */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Planos e Cobrança</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gerencie sua assinatura e escolha o plano ideal para sua clínica.
        </p>
        
        {/* Indicador de ambiente */}
        {isTestMode && (
          <div className="flex items-center justify-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-200 max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Modo de Teste - Stripe Test Environment</span>
          </div>
        )}
      </div>

      {/* Status Atual da Assinatura */}
      {subscriptionData && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Plano Atual: {getCurrentPlan()?.name || 'Gratuito'}
                </p>
                {subscriptionData.subscribed && subscriptionData.subscription_end && (
                  <p className="text-sm text-gray-600">
                    Renova em: {formatDate(subscriptionData.subscription_end)}
                  </p>
                )}
              </div>
              <Badge variant={subscriptionData.subscribed ? 'default' : 'secondary'}>
                {subscriptionData.subscribed ? 'Ativo' : 'Gratuito'}
              </Badge>
            </div>
            
            {subscriptionData.subscribed && (
              <Button
                onClick={handleManageSubscription}
                disabled={isOpeningPortal}
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                {isOpeningPortal ? 'Abrindo Portal...' : 'Gerenciar Assinatura'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cards de Planos */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {PLANS.map((plan) => {
          const currentPlan = getCurrentPlan();
          const isCurrentPlan = currentPlan?.id === plan.id;
          
          return (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''} ${
                isCurrentPlan ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Mais Popular</Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Atual
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                {/* Indicador do Price ID em modo teste */}
                {isTestMode && (
                  <div className="text-xs text-gray-500 font-mono bg-gray-50 p-1 rounded">
                    Price ID: {plan.priceId}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCreatingCheckout || isCurrentPlan}
                  variant={isCurrentPlan ? 'secondary' : 'default'}
                  className="w-full rounded-xl"
                >
                  {isCurrentPlan
                    ? 'Plano Atual'
                    : isCreatingCheckout
                    ? 'Processando...'
                    : 'Escolher Plano'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Botão de Atualizar Status */}
      <div className="text-center">
        <Button variant="outline" onClick={checkSubscription} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Status
        </Button>
      </div>

      {/* Informações de Debug em Ambiente de Teste */}
      {isTestMode && (
        <Card className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">Informações de Debug (Modo Teste)</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-blue-700 space-y-1">
            <p><strong>Ambiente:</strong> {currentEnvironment}</p>
            <p><strong>Price ID Básico:</strong> {getPriceId('basic')}</p>
            <p><strong>Price ID Premium:</strong> {getPriceId('premium')}</p>
            <p><strong>Status da Assinatura:</strong> {subscriptionData?.subscribed ? 'Ativa' : 'Inativa'}</p>
          </CardContent>
        </Card>
      )}

      {/* Exibir erros */}
      {error && (
        <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 text-center">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingPage;
