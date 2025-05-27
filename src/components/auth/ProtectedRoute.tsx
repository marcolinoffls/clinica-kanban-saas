
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Componente de Proteção de Rotas
 * 
 * Protege rotas que requerem autenticação. Se o usuário não estiver
 * logado, redireciona para a página de login preservando a URL
 * de origem para redirecionamento após o login.
 * 
 * Props:
 * - children: componentes filhos que serão renderizados se autenticado
 * 
 * Durante o carregamento do estado de autenticação, exibe um
 * indicador de carregamento para melhor experiência do usuário.
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Verificando autenticação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderizar o conteúdo
  return <>{children}</>;
};
