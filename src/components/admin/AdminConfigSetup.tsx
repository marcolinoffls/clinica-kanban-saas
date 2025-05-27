
import { Shield, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Componente de Configuração de Administrador
 * 
 * Exibido quando o usuário ainda não tem permissões de administrador.
 * Permite configurar o usuário atual como administrador do sistema.
 * 
 * Props:
 * - currentUserId: ID do usuário atual (pode ser null se não logado)
 * - configuringAdmin: indica se está processando a configuração
 * - onConfigurarComoAdmin: função chamada para configurar como admin
 */

interface AdminConfigSetupProps {
  currentUserId: string | null;
  configuringAdmin: boolean;
  onConfigurarComoAdmin: () => void;
}

export const AdminConfigSetup = ({ 
  currentUserId, 
  configuringAdmin, 
  onConfigurarComoAdmin 
}: AdminConfigSetupProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <CardTitle className="text-blue-600">Configuração de Administrador</CardTitle>
          <CardDescription>
            Para acessar o painel administrativo, você precisa configurar suas permissões.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exibir User ID atual se disponível */}
          {currentUserId && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Seu User ID:</p>
              <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                {currentUserId}
              </p>
            </div>
          )}
          
          {/* Botão para configurar como administrador */}
          <Button 
            onClick={onConfigurarComoAdmin}
            disabled={configuringAdmin || !currentUserId}
            className="w-full flex items-center gap-2"
          >
            <UserCog className="w-4 h-4" />
            {configuringAdmin ? 'Configurando...' : 'Configurar como Administrador'}
          </Button>
          
          {/* Mensagem de erro se não estiver logado */}
          {!currentUserId && (
            <p className="text-sm text-red-600 text-center">
              Você precisa estar logado para configurar as permissões.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
