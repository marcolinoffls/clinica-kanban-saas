
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthUser } from './useAuthUser';

/**
 * Hook para buscar dados da clínica do usuário autenticado
 * 
 * Este hook utiliza o userProfile do usuário logado para buscar
 * informações completas da clínica à qual ele pertence.
 * 
 * Retorna:
 * - clinica: dados completos da clínica
 * - loading: estado de carregamento
 * - error: erro se houver
 */

interface Clinica {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  endereco_completo: string | null;
  cnpj: string | null;
  razao_social: string | null;
  status: string | null;
  plano_contratado: string | null;
  webhook_usuario: string | null;
  integracao_instance_id: string | null;
  evolution_instance_name: string | null;
  admin_prompt: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useClinicaData = () => {
  const { userProfile, loading: authLoading } = useAuthUser();

  const { data: clinica, isLoading: clinicaLoading, error } = useQuery({
    queryKey: ['clinica', userProfile?.clinica_id],
    queryFn: async (): Promise<Clinica | null> => {
      if (!userProfile?.clinica_id) {
        console.log('Usuário não possui clinica_id associada');
        return null;
      }

      console.log('Buscando dados da clínica:', userProfile.clinica_id);

      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', userProfile.clinica_id)
        .single();

      if (error) {
        console.error('Erro ao buscar dados da clínica:', error);
        throw new Error(`Erro ao buscar clínica: ${error.message}`);
      }

      console.log('Dados da clínica encontrados:', data.nome);
      return data;
    },
    enabled: !!userProfile?.clinica_id && !authLoading,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 1
  });

  return {
    clinica,
    loading: authLoading || clinicaLoading,
    error,
    // Funções utilitárias
    hasClinica: !!clinica,
    clinicaId: clinica?.id || null,
    clinicaNome: clinica?.nome || 'Clínica',
  };
};
