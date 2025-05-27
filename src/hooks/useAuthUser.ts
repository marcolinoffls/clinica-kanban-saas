
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook customizado para gerenciar dados do usuário autenticado
 * 
 * Combina o contexto de autenticação com dados do perfil do usuário
 * da tabela user_profiles. Facilita o acesso a informações completas
 * do usuário em qualquer componente.
 * 
 * Retorna:
 * - user: dados básicos do usuário do Supabase Auth
 * - userProfile: dados completos do perfil da tabela user_profiles
 * - loading: estado de carregamento
 * - isAuthenticated: boolean indicando se está autenticado
 * - signOut: função para fazer logout
 */

interface UserProfile {
  id: string;
  user_id: string;
  nome_completo: string | null;
  profile_type: 'admin' | 'clinica' | 'usuario'; // Incluindo o tipo 'clinica'
  status_usuario: string;
  clinica_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useAuthUser = () => {
  const { user, session, loading: authLoading, signOut } = useAuth();

  // Buscar dados do perfil do usuário na tabela user_profiles
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;

      console.log('Buscando perfil do usuário:', user.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return null;
      }

      console.log('Perfil do usuário encontrado:', data);
      return data;
    },
    enabled: !!user?.id && !!session,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  // Função para obter nome de exibição do usuário
  const getDisplayName = () => {
    if (userProfile?.nome_completo) {
      return userProfile.nome_completo;
    }
    
    if (user?.user_metadata?.nome_completo) {
      return user.user_metadata.nome_completo;
    }
    
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return 'Usuário';
  };

  // Função para verificar se é administrador do sistema
  const isAdmin = () => {
    return userProfile?.profile_type === 'admin';
  };

  // Função para verificar se é administrador de clínica
  const isClinicAdmin = () => {
    return userProfile?.profile_type === 'clinica';
  };

  // Função para obter iniciais do nome
  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return {
    // Dados básicos do usuário
    user,
    session,
    userProfile,
    
    // Estados de carregamento
    loading: authLoading || profileLoading,
    isAuthenticated: !!user && !!session,
    
    // Funções utilitárias
    getDisplayName,
    getInitials,
    isAdmin,
    isClinicAdmin,
    signOut
  };
};
