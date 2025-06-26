
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionPricing } from '@/components/billing/SubscriptionPricing';
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';
import { CreditCard, Receipt, Settings } from 'lucide-react';

/**
 * Página de Gerenciamento de Assinaturas e Cobrança
 * 
 * O que faz:
 * - Permite visualizar e alterar planos de assinatura
 * - Mostra status atual da assinatura
 * - Exibe histórico de pagamentos
 * - Integra com Stripe para checkout e gerenciamento
 * 
 * Onde é usado:
 * - Menu principal do sistema
 * - Redirecionamento quando plano expira
 * 
 * Como se conecta:
 * - Usa componentes de billing específicos
 * - Integra com Edge Functions do Stripe
 * - Sincroniza com dados do Supabase
 */

export const BillingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Planos e Cobrança
        </h1>
        <p className="text-gray-600">
          Gerencie sua assinatura, pagamentos e acesse funcionalidades premium
        </p>
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <SubscriptionStatus />
          
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades por Plano</CardTitle>
              <CardDescription>
                Veja o que está incluído em cada plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Gratuito</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Até 50 leads/mês</li>
                    <li>• Chat básico</li>
                    <li>• Dashboard simples</li>
                    <li>• Suporte por email</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-600">Básico - R$ 97/mês</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Leads ilimitados</li>
                    <li>• Chat com IA</li>
                    <li>• Dashboard completo</li>
                    <li>• Follow-up automático</li>
                    <li>• WhatsApp integrado</li>
                    <li>• Suporte prioritário</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-yellow-600">Premium - R$ 197/mês</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Tudo do Básico +</li>
                    <li>• Instagram Direct</li>
                    <li>• Relatórios com IA</li>
                    <li>• Campanhas avançadas</li>
                    <li>• API personalizada</li>
                    <li>• Múltiplos usuários</li>
                    <li>• Suporte 24/7</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <SubscriptionPricing />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Acompanhe seus pagamentos e faturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Histórico em Desenvolvimento
                </h3>
                <p className="text-gray-600 mb-4">
                  O histórico detalhado de pagamentos estará disponível em breve.
                </p>
                <p className="text-sm text-gray-500">
                  Para acessar suas faturas agora, use o portal do cliente Stripe 
                  na aba "Status".
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
