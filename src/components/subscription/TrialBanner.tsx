
/**
 * Componente para exibir banner de trial
 * 
 * Este componente:
 * - Mostra quantos dias restam do trial
 * - Alerta quando o trial está prestes a expirar
 * - Oferece botão para fazer upgrade
 * - É exibido apenas durante o período de trial
 * 
 * Usado no layout principal para manter o usuário informado
 * sobre o status do trial e incentivar a conversão.
 */

import { useState } from 'react';
import { X, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTrialStatus } from '@/hooks/useSubscription';

export const TrialBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const trialStatus = useTrialStatus();

  // Não mostrar se não está em trial ou foi dispensado
  if (!trialStatus.isInTrial || dismissed) {
    return null;
  }

  const { daysRemaining, hasExpired } = trialStatus;

  // Determinar cor e mensagem baseado nos dias restantes
  const getAlertVariant = () => {
    if (hasExpired) return 'destructive';
    if (daysRemaining <= 3) return 'destructive';
    if (daysRemaining <= 7) return 'default';
    return 'default';
  };

  const getMessage = () => {
    if (hasExpired) {
      return 'Seu período de teste expirou. Faça upgrade para continuar usando todas as funcionalidades.';
    }
    
    if (daysRemaining === 1) {
      return 'Último dia do seu período de teste! Não perca suas configurações.';
    }
    
    if (daysRemaining <= 3) {
      return `Apenas ${daysRemaining} dias restantes no seu período de teste.`;
    }
    
    if (daysRemaining <= 7) {
      return `${daysRemaining} dias restantes no seu período de teste.`;
    }
    
    return `Você tem ${daysRemaining} dias de teste gratuito restantes.`;
  };

  const handleUpgrade = () => {
    // TODO: Implementar navegação para página de upgrade
    console.log('🎯 Usuário clicou em fazer upgrade');
  };

  return (
    <Alert variant={getAlertVariant()} className="relative mb-4">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>{getMessage()}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {!hasExpired && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpgrade}
              className="ml-4"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Fazer Upgrade
            </Button>
          )}
          
          {hasExpired && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUpgrade}
              className="ml-4"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Ativar Plano
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
