
/**
 * Componente para controlar acesso a funcionalidades baseado no plano
 * 
 * Este componente:
 * - Verifica se o usuário tem acesso a uma funcionalidade específica
 * - Exibe um fallback quando o acesso é negado
 * - Permite override para Admin
 * - Integra com o sistema de planos e trial
 * 
 * Usado para proteger funcionalidades premium em toda a aplicação
 */

import { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { AlertTriangle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureGuardProps {
  feature: keyof FeatureAccess;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGuard = ({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true 
}: FeatureGuardProps) => {
  const featureAccess = useFeatureAccess();
  
  // Se ainda está carregando dados do plano
  if (!featureAccess) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Verificar se tem acesso à funcionalidade
  const hasAccess = featureAccess[feature];

  // Se tem acesso, mostrar o conteúdo
  if (hasAccess) {
    return <>{children}</>;
  }

  // Se foi fornecido um fallback customizado
  if (fallback) {
    return <>{fallback}</>;
  }

  // Fallback padrão com opção de upgrade
  if (showUpgrade) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-amber-800">
            <Crown className="w-5 h-5 mr-2" />
            Funcionalidade Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-amber-800">
              Esta funcionalidade está disponível apenas nos planos pagos. 
              Faça upgrade para acessar todos os recursos.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              Ver Planos
            </Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Crown className="w-4 h-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback minimalista sem botão de upgrade
  return (
    <Alert variant="default" className="border-gray-300">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Esta funcionalidade não está disponível no seu plano atual.
      </AlertDescription>
    </Alert>
  );
};
