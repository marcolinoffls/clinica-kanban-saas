
/**
 * Hook para buscar todas as clínicas do sistema (apenas para Admin)
 * 
 * Este hook:
 * - Busca todas as clínicas cadastradas no sistema
 * - É restrito apenas para usuários Admin
 * - Inclui cache para otimizar performance
 * - Retorna loading e error states
 * 
 * Usado no ChatPage para permitir que Admin visualize conversas de qualquer clínica
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthUser } from './useAuthUser';

// Interface para dados básicos da clínica
export interface ClinicaBasica {
  id: string;
  nome: string;
  status: string;
}

export const useAllClinicas = () => {
  const { isAdmin } = useAuthUser();
  const [clinicas, setClinicas] = useState<ClinicaBasica[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Só busca clínicas se o usuário for Admin
    if (!isAdmin()) {
      console.log('[useAllClinicas] Usuário não é Admin, não buscando clínicas');
      return;
    }

    const buscarClinicas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[useAllClinicas] Buscando todas as clínicas para Admin...');
        
        const { data, error: dbError } = await supabase
          .from('clinicas')
          .select('id, nome, status')
          .eq('status', 'ativo') // Apenas clínicas ativas
          .order('nome'); // Ordenar por nome

        if (dbError) {
          console.error('[useAllClinicas] Erro ao buscar clínicas:', dbError);
          setError('Erro ao carregar clínicas');
          return;
        }

        setClinicas(data || []);
        console.log(`[useAllClinicas] ✅ ${data?.length || 0} clínicas carregadas`);
        
      } catch (err: any) {
        console.error('[useAllClinicas] Erro na busca de clínicas:', err);
        setError('Erro ao carregar clínicas');
      } finally {
        setLoading(false);
      }
    };

    buscarClinicas();
  }, [isAdmin]);

  return {
    clinicas,
    loading,
    error,
    isAdmin: isAdmin() // Retorna se o usuário é Admin para uso no componente
  };
};
