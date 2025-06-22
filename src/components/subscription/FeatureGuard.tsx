
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureAccess } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Clock, CheckCircle } from 'lucide-react';

interface FeatureGuardProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Componente de proteção de funcionalidades baseado no plano
 * 
 * Verifica se o usuário tem acesso a uma funcionalidade específica
 * baseado no seu plano atual e status da assinatura.
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  fallback,
  children,
}) => {
  // CORRIGIDO: usar useSubscription unificado
  const { useFeatureAccess } = useSubscription();
  const featureAccess = useFeatureAccess(feature);

  // Se tem acesso concedido, renderizar normalmente
  if (featureAccess === FeatureAccess.GRANTED) {
    return <>{children}</>;
  }

  // Se tem acesso trial, renderizar com aviso
  if (featureAccess === FeatureAccess.TRIAL) {
    return (
      <div className="space-y-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="w-5 h-5" />
              Funcionalidade em Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700 mb-3">
              Você está usando esta funcionalidade durante o período de trial. 
              Para continuar usando após o trial, faça upgrade do seu plano.
            </p>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              Fazer Upgrade
            </Button>
          </CardContent>
        </Card>
        {children}
      </div>
    );
  }

  // Se não tem acesso, renderizar fallback ou mensagem padrão
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <Lock className="w-5 h-5" />
          Funcionalidade Bloqueada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-4">
          Esta funcionalidade não está disponível no seu plano atual. 
          Faça upgrade para acessar recursos avançados.
        </p>
        <Button size="sm" className="bg-red-600 hover:bg-red-700">
          Ver Planos
        </Button>
      </CardContent>
    </Card>
  );
};
