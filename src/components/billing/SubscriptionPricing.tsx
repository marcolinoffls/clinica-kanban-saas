
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicaData } from '@/hooks/useClinicaData';
import { toast } from 'sonner';

/**
 * Componente de seleção de planos de assinatura
 * 
 * O que faz:
 * - Exibe os planos disponíveis (Free, Básico R$ 97, Premium R$ 197)
 * - Cria sessões de checkout do Stripe para assinaturas
 * - Mostra período de teste gratuito de 14 dias
 * - Redireciona para o checkout do Stripe
 * 
 * Onde é usado:
 * - Página de configurações/billing
 * - Dashboard quando plano expira
 * 
 * Como se conecta:
 * - Usa Edge Function create-stripe-checkout
 * - Integra com sistema de autenticação
 * - Atualiza dados no Supabase via webhooks
 */

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Perfeito para começar',
    price: 0,
    priceId: '',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Até 50 leads por mês',
      'Chat básico',
      'Dashboard simples',
      'Suporte por email',
    ],
  },
  {
    id: 'basic',
    name: 'Básico',
    description: 'Para clínicas em crescimento',
    price: 97,
    priceId: 'price_basic', // Substitua pelo ID real do Stripe
    icon: <Crown className="w-6 h-6" />,
    popular: true,
    features: [
      'Leads ilimitados',
      'Chat com IA integrada',
      'Dashboard completo',
      'Follow-up automatizado',
      'Integração WhatsApp',
      'Suporte prioritário',
      '14 dias grátis',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Para clínicas estabelecidas',
    price: 197,
    priceId: 'price_premium', // Substitua pelo ID real do Stripe
    icon: <Crown className="w-6 h-6 text-yellow-500" />,
    features: [
      'Tudo do plano Básico',
      'Integração Instagram Direct',
      'Relatórios avançados com IA',
      'Campanhas de follow-up',
      'API personalizada',
      'Múltiplos usuários',
      'Suporte 24/7',
      '14 dias grátis',
    ],
  },
];

export const SubscriptionPricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { clinicaId } = useClinicaData();

  /**
   * Cria uma sessão de checkout do Stripe e redireciona o usuário
   */
  const handleSubscribe = async (plan: Plan) => {
    if (!clinicaId) {
      toast.error('ID da clínica não encontrado');
      return;
    }

    if (plan.id === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }

    setLoading(plan.id);

    try {
      console.log(`🛒 [SubscriptionPricing] Iniciando checkout para plano: ${plan.name}`);

      // Chamar Edge Function para criar sessão de checkout
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          clinicaId,
          priceId: plan.priceId,
        },
      });

      if (error) {
        console.error('❌ [SubscriptionPricing] Erro ao criar checkout:', error);
        toast.error(`Erro ao processar pagamento: ${error.message}`);
        return;
      }

      if (!data?.checkoutUrl) {
        console.error('❌ [SubscriptionPricing] URL de checkout não retornada:', data);
        toast.error('Erro ao gerar link de pagamento');
        return;
      }

      console.log(`✅ [SubscriptionPricing] Redirecionando para checkout: ${data.checkoutUrl}`);

      // Redirecionar para o checkout do Stripe
      window.location.href = data.checkoutUrl;

    } catch (error: any) {
      console.error('❌ [SubscriptionPricing] Erro inesperado:', error);
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha o plano ideal para sua clínica
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comece com 14 dias grátis em qualquer plano pago. 
          Cancele a qualquer momento, sem taxas de cancelamento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.popular 
                ? 'border-blue-500 shadow-lg scale-105' 
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1 text-sm font-medium">
                  Mais Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${
                  plan.id === 'free' 
                    ? 'bg-gray-100 text-gray-600'
                    : plan.id === 'basic'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {plan.icon}
                </div>
              </div>
              
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-sm text-gray-600 mb-4">
                {plan.description}
              </CardDescription>
              
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    R$ {plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-gray-500">/mês</span>
                  )}
                </div>
                {plan.price > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    14 dias grátis para testar
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id}
                className={`w-full ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : plan.id === 'free'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
                variant={plan.id === 'free' ? 'outline' : 'default'}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : plan.id === 'free' ? (
                  'Plano Atual'
                ) : (
                  `Começar com ${plan.name}`
                )}
              </Button>

              {plan.price > 0 && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Cobrança recorrente mensal. Cancele a qualquer momento.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-gray-600 mb-4">
          Precisa de um plano personalizado? Entre em contato conosco.
        </p>
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          <span>✓ Sem taxa de setup</span>
          <span>✓ Sem contrato de fidelidade</span>
          <span>✓ Suporte especializado</span>
        </div>
      </div>
    </div>
  );
};
