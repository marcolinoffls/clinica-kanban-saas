
import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente de Botão de Logout
 * 
 * Botão que permite ao usuário fazer logout do sistema.
 * Chama a função signOut do contexto de autenticação e
 * lida com possíveis erros durante o processo.
 * 
 * Após o logout bem-sucedido, o contexto automaticamente
 * limpa o estado do usuário e redireciona para login.
 */

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const LogoutButton = ({ 
  variant = 'ghost', 
  size = 'sm',
  className = ''
}: LogoutButtonProps) => {
  const { signOut, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={loading}
      className={`flex items-center gap-2 ${className}`}
      title="Sair do sistema"
    >
      <LogOut size={16} />
      <span>Sair</span>
    </Button>
  );
};
