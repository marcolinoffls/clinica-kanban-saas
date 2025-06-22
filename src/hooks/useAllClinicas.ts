
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthUser } from './useAuthUser';
import type { ClinicaBasica } from '@/types';

/**
 * Hook para buscar todas as clínicas (usado pelo Admin)
 * 
 * Retorna lista completa de clínicas apenas para usuários admin.
 * Para usuários normais, retorna array vazio.
 */
export const useAllClinicas = () => {
  const { user } = useAuthUser();
  
  const isAdmin = user?.user_metadata?.profile_type === 'admin';

  return useQuery({
    queryKey: ['all-clinicas'],
    queryFn: async (): Promise<ClinicaBasica[]> => {
      if (!isAdmin) {
        return [];
      }

      const { data, error } = await supabase
        .from('clinicas')
        .select('id, nome, status')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar clínicas:', error);
        throw error;
      }

      return data || [];
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
