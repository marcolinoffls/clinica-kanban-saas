
import { useState, useEffect } from 'react';
import { useSupabaseAdmin } from './useSupabaseAdmin';

/**
 * Hook para verificar se o usuário atual é administrador
 * 
 * O que faz:
 * - Verifica se o usuário logado tem privilégios de administrador
 * - Gerencia estado de loading durante a verificação
 * - Retorna resultado da verificação de forma reativa
 * 
 * Onde é usado:
 * - Componentes que precisam verificar privilégios admin
 * - Páginas que têm funcionalidades específicas para admins
 * - Renderização condicional baseada em permissões
 */

interface AdminCheckResult {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export const useAdminCheck = (): AdminCheckResult => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { verificarPermissaoAdmin } = useSupabaseAdmin();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔐 [useAdminCheck] Verificando status de administrador...');
        
        const adminStatus = await verificarPermissaoAdmin();
        setIsAdmin(adminStatus);
        
        console.log(`✅ [useAdminCheck] Status de admin: ${adminStatus}`);
      } catch (err: any) {
        const errorMessage = err.message || 'Erro ao verificar permissões de administrador';
        console.error('❌ [useAdminCheck] Erro:', errorMessage);
        setError(errorMessage);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return {
    isAdmin,
    loading,
    error
  };
};
