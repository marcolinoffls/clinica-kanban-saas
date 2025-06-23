
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  // Função para verificar permissão de admin diretamente
  const verificarPermissaoAdmin = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_type')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data?.profile_type === 'admin';
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  };

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
