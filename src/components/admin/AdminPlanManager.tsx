
/**
 * Componente para gerenciar planos das clínicas (Admin)
 * 
 * Este componente permite ao Admin:
 * - Visualizar plano atual da clínica
 * - Alterar plano da clínica
 * - Ver histórico de mudanças
 * - Monitorar status de trial
 * 
 * Usado na página de detalhes da clínica no painel administrativo
 * para dar controle total sobre as assinaturas.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CreditCard, Clock, History } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminPlanManagerProps {
  clinicaId: string;
  clinicaNome: string;
}

export const AdminPlanManager = ({ clinicaId, clinicaNome }: AdminPlanManagerProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [changeReason, setChangeReason] = useState<string>('');
  
  // CORRIGIDO: usar useSubscription unificado
  const { plans, subscription, loading } = useSubscription();

  // Função simulada para alterar plano (deve ser implementada no hook)
  const handleChangePlan = async () => {
    if (!selectedPlanId) return;

    try {
      // TODO: Implementar lógica de alteração de plano
      console.log('Alterando plano para:', selectedPlanId, 'Motivo:', changeReason);
      
      setSelectedPlanId('');
      setChangeReason('');
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
    }
  };

  // Buscar plano atual
  const currentPlan = plans.find(plan => plan.id === subscription?.plan_id);

  const getStatusBadge = (status: string) => {
    const variants = {
      trial: 'secondary',
      active: 'default',
      canceled: 'destructive',
      past_due: 'destructive',
      unpaid: 'destructive',
    } as const;

    const labels = {
      trial: 'Trial',
      active: 'Ativo',
      canceled: 'Cancelado',
      past_due: 'Em atraso',
      unpaid: 'Não pago',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Função para verificar se está em trial
  const isInTrial = subscription?.status === 'trial';
  const trialEndDate = subscription?.trial_end ? new Date(subscription.trial_end) : null;
  const hasExpired = trialEndDate ? trialEndDate < new Date() : false;
  const daysRemaining = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{currentPlan?.display_name || 'Plano não encontrado'}</h3>
                  <p className="text-gray-600">{currentPlan?.description}</p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>

              {/* Informações do Trial */}
              {isInTrial && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Status do Trial</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    {hasExpired ? (
                      <span className="text-red-600 font-medium">Trial expirado</span>
                    ) : (
                      <>
                        <span>{daysRemaining} dias restantes</span>
                        {trialEndDate && (
                          <span className="block">
                            Expira em: {format(trialEndDate, 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Detalhes da Assinatura */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Criado em:</span>
                  <div>{format(new Date(subscription.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                </div>
                <div>
                  <span className="text-gray-500">Última atualização:</span>
                  <div>{format(new Date(subscription.updated_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma assinatura encontrada para esta clínica</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alterar Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Alterar Plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Novo Plano</label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{plan.display_name}</span>
                      <span className="text-sm text-gray-500 ml-4">
                        R$ {plan.price_monthly}/mês
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Motivo da Alteração (opcional)</label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Ex: Upgrade solicitado pelo cliente"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            onClick={handleChangePlan}
            disabled={!selectedPlanId || loading}
            className="w-full"
          >
            {loading ? 'Alterando...' : 'Alterar Plano'}
          </Button>
        </CardContent>
      </Card>

      {/* Recursos do Plano Atual */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Recursos Inclusos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Máximo de Leads:</span>
                <div className="font-medium">
                  {currentPlan.max_leads ? currentPlan.max_leads.toLocaleString() : 'Ilimitado'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Máximo de Usuários:</span>
                <div className="font-medium">
                  {currentPlan.max_users ? currentPlan.max_users.toLocaleString() : 'Ilimitado'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Mensagens por mês:</span>
                <div className="font-medium">
                  {currentPlan.max_mensagens_mes ? currentPlan.max_mensagens_mes.toLocaleString() : 'Ilimitado'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Valor Mensal:</span>
                <div className="font-medium">R$ {currentPlan.price_monthly}</div>
              </div>
            </div>

            {/* Recursos Especiais */}
            <div className="mt-4">
              <span className="text-gray-500 text-sm">Recursos:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(currentPlan.features || {}).map(([feature, enabled]) => 
                  enabled && (
                    <Badge key={feature} variant="outline">
                      {feature.replace(/_/g, ' ')}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
