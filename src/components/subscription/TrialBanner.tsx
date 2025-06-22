
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Banner de status do trial
 * 
 * Exibe informações sobre o período de trial do usuário,
 * incluindo dias restantes e call-to-action para upgrade.
 */
export const TrialBanner: React.FC = () => {
  // CORRIGIDO: usar useSubscription unificado
  const { subscription } = useSubscription();

  // Verificar se está em trial
  const isInTrial = subscription?.status === 'trial';
  
  if (!isInTrial || !subscription?.trial_end) {
    return null;
  }

  const trialEndDate = new Date(subscription.trial_end);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const hasExpired = trialEndDate < now;

  if (hasExpired) {
    return (
      <Card className="border-red-200 bg-red-50 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Trial Expirado</h3>
                <p className="text-sm text-red-700">
                  Seu período de trial expirou em {format(trialEndDate, 'dd/MM/yyyy', { locale: ptBR })}.
                  Faça upgrade para continuar usando todas as funcionalidades.
                </p>
              </div>
            </div>
            <Button className="bg-red-600 hover:bg-red-700">
              Fazer Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgentWarning = daysRemaining <= 3;

  return (
    <Card className={`mb-6 ${urgentWarning ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${urgentWarning ? 'text-orange-600' : 'text-blue-600'}`} />
            <div>
              <h3 className={`font-semibold ${urgentWarning ? 'text-orange-800' : 'text-blue-800'}`}>
                Trial Ativo
              </h3>
              <p className={`text-sm ${urgentWarning ? 'text-orange-700' : 'text-blue-700'}`}>
                {daysRemaining === 0 
                  ? 'Último dia do seu trial!'
                  : daysRemaining === 1
                  ? '1 dia restante no seu trial.'
                  : `${daysRemaining} dias restantes no seu trial.`
                }
                {' '}Expira em {format(trialEndDate, 'dd/MM/yyyy', { locale: ptBR })}.
              </p>
            </div>
          </div>
          <Button className={urgentWarning ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}>
            {urgentWarning ? 'Upgrade Agora' : 'Ver Planos'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
