
/**
 * Componente para controlar acesso a recursos baseado no plano
 * 
 * Este componente:
 * - Verifica se o usuário tem acesso ao recurso
 * - Mostra conteúdo ou mensagem de upgrade
 * - Oferece modal contextual para upgrade
 * - Pode bloquear ou apenas alertar sobre limites
 * 
 * Usado em toda aplicação para controlar funcionalidades
 * premium e incentivar upgrades de plano.
 */

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap } from 'lucide-react';
import { useFeatureAccess, useTrialStatus } from '@/hooks/useSubscription';

interface FeatureGuardProps {
  feature: keyof Pick<typeof useFeatureAccess, 'ai_chat' | 'kanban' | 'basic_reports' | 'advanced_reports' | 'follow_up' | 'integrations' | 'priority_support'>;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  blockAccess?: boolean;
}

export const FeatureGuard = ({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true, 
  blockAccess = true 
}: FeatureGuardProps) => {
  const featureAccess = useFeatureAccess();
  const trialStatus = useTrialStatus();

  // Verificar se tem acesso ao recurso
  const hasAccess = featureAccess[feature];

  // Se tem acesso, mostrar conteúdo normalmente
  if (hasAccess) {
    return <>{children}</>;
  }

  // Se não deve bloquear acesso, mostrar conteúdo com aviso
  if (!blockAccess) {
    return (
      <div className="relative">
        {/* Banner de upgrade sobreposto */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-t-lg p-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-800">Recurso Premium</span>
            </div>
            {showUpgrade && (
              <Button size="sm" variant="outline" className="h-6 text-xs">
                Fazer Upgrade
              </Button>
            )}
          </div>
        </div>
        <div className="pt-12">
          {children}
        </div>
      </div>
    );
  }

  // Fallback customizado se fornecido
  if (fallback) {
    return <>{fallback}</>;
  }

  // Tela de bloqueio padrão
  return (
    <Card className="border-dashed border-2">
      <CardContent className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Recurso Premium</h3>
          <p className="text-gray-600 mb-4">
            Este recurso está disponível apenas nos planos pagos.
            {trialStatus.isInTrial && !trialStatus.hasExpired && (
              <span className="block mt-2 text-sm">
                Você ainda tem {trialStatus.daysRemaining} dias de trial restantes.
              </span>
            )}
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <Badge variant="outline" className="justify-center">
              <Crown className="w-4 h-4 mr-2" />
              Plano Básico ou Superior
            </Badge>
          </div>

          {showUpgrade && (
            <div className="space-y-2">
              <Button className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Fazer Upgrade Agora
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Ver Planos Disponíveis
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Hook de conveniência para verificar acesso rapidamente
export const useHasFeature = (feature: keyof ReturnType<typeof useFeatureAccess>) => {
  const featureAccess = useFeatureAccess();
  return featureAccess[feature];
};

// Componente para verificar limites numéricos
interface LimitGuardProps {
  limit: 'max_leads' | 'max_users' | 'max_mensagens_mes';
  currentUsage: number;
  children: ReactNode;
  warningThreshold?: number; // % do limite para mostrar aviso
}

export const LimitGuard = ({ 
  limit, 
  currentUsage, 
  children, 
  warningThreshold = 80 
}: LimitGuardProps) => {
  const featureAccess = useFeatureAccess();
  const maxAllowed = featureAccess[limit];

  // Se não há limite, liberar acesso
  if (!maxAllowed) {
    return <>{children}</>;
  }

  const usagePercentage = (currentUsage / maxAllowed) * 100;
  const isOverLimit = currentUsage >= maxAllowed;
  const isNearLimit = usagePercentage >= warningThreshold;

  // Se ultrapassou o limite, bloquear
  if (isOverLimit) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <Lock className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Limite Atingido</h3>
            <p>
              Você atingiu o limite de {maxAllowed.toLocaleString()} 
              {limit === 'max_leads' && ' leads'}
              {limit === 'max_users' && ' usuários'}
              {limit === 'max_mensagens_mes' && ' mensagens por mês'}
            </p>
          </div>
          <Button variant="destructive">
            Fazer Upgrade para Continuar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se próximo do limite, mostrar aviso
  if (isNearLimit) {
    return (
      <div className="space-y-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Próximo do limite: {currentUsage}/{maxAllowed} ({Math.round(usagePercentage)}%)
                </span>
              </div>
              <Button size="sm" variant="outline">
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
        {children}
      </div>
    );
  }

  // Uso normal
  return <>{children}</>;
};
