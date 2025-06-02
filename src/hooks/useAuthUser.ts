
// src/hooks/useAuthUser.ts

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para os dados do perfil do usuário.
 * Corresponde à tabela `user_profiles` e à enum `user_profile_type`.
 */
export interface UserProfile {
  id: string; // UUID da tabela user_profiles
  user_id: string; // UUID da tabela auth.users (chave estrangeira)
  nome_completo: string | null;
  profile_type: 'admin' | 'clinica' | 'usuario'; // Tipos de perfil possíveis
  status_usuario: string; // ex: 'ativo', 'inativo'
  clinica_id: string | null; // UUID da clínica associada, se houver
  created_at: string;
  updated_at: string;
}

/**
 * Hook customizado para gerenciar dados do usuário autenticado.
 * 
 * Combina o contexto de autenticação (que fornece o usuário e sessão do Supabase Auth)
 * com dados do perfil do usuário da tabela `public.user_profiles`.
 * Facilita o acesso a informações completas e combinadas do usuário.
 * 
 * Após a correção do trigger handle_new_user, este hook deve sempre retornar
 * um userProfile válido para usuários autenticados.
 */
export const useAuthUser = () => {
  // Obter dados brutos de autenticação (user, session, loading) e função signOut do AuthContext
  const { user, session, loading: authContextLoading, signOut: contextSignOut } = useAuth();

  // Log detalhado para debugging do estado de autenticação
  console.log('[useAuthUser] Estado de autenticação:', {
    user: user ? { id: user.id, email: user.email } : null,
    session: session ? 'presente' : 'ausente',
    authContextLoading
  });

  // Determinar se a query para buscar o perfil do usuário deve ser habilitada
  const queryProfileEnabled = !!user?.id && !!session && !authContextLoading;
  console.log('[useAuthUser] Query userProfile habilitada:', queryProfileEnabled);

  // Usar @tanstack/react-query para buscar os dados do perfil da tabela `user_profiles`
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile
  } = useQuery<UserProfile | null, Error>({
    queryKey: ['userProfile', user?.id], 
    
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) {
        console.warn('[useAuthUser - queryFn] user.id é nulo/indefinido. Retornando null.');
        return null;
      }

      console.log(`[useAuthUser - queryFn] Buscando perfil para user_id: ${user.id}`);

      const { data, error: dbError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (dbError) {
        console.error('[useAuthUser - queryFn] Erro ao buscar user_profile:', {
          error: dbError,
          user_id: user.id,
          code: dbError.code,
          message: dbError.message
        });

        // Se for erro de "não encontrado", pode ser que o perfil não exista
        if (dbError.code === 'PGRST116') {
          console.warn(`[useAuthUser - queryFn] Perfil não encontrado para user_id: ${user.id}. O trigger handle_new_user pode ter falhado.`);
        }
        
        throw new Error(`Erro ao buscar perfil do usuário: ${dbError.message}`);
      }

      if (data) {
        console.log('[useAuthUser - queryFn] ✅ Perfil encontrado:', {
          id: data.id,
          user_id: data.user_id,
          nome_completo: data.nome_completo,
          profile_type: data.profile_type,
          clinica_id: data.clinica_id
        });
      } else {
        console.warn(`[useAuthUser - queryFn] ⚠️ Nenhum perfil encontrado para user_id: ${user.id}`);
      }
      
      return data as UserProfile | null;
    },
    enabled: queryProfileEnabled, 
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos
    retry: (failureCount, error) => {
      // Tentar novamente apenas para erros de rede, não para perfil não encontrado
      if (error.message.includes('PGRST116')) {
        return false; // Não tentar novamente se perfil não existe
      }
      return failureCount < 2; // Máximo 2 tentativas para outros erros
    }
  });

  // Log do estado final do userProfile
  console.log('[useAuthUser] Estado do userProfile:', {
    userProfile: userProfile ? { 
      id: userProfile.id, 
      nome_completo: userProfile.nome_completo,
      profile_type: userProfile.profile_type,
      clinica_id: userProfile.clinica_id 
    } : null,
    profileLoading,
    profileError: profileError?.message
  });

  // Função para obter nome de exibição do usuário de forma segura
  const getDisplayName = (): string => {
    if (userProfile?.nome_completo) return userProfile.nome_completo;
    if (user?.user_metadata?.nome_completo) return user.user_metadata.nome_completo;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  // Função para verificar se o usuário logado é um administrador do sistema
  const isAdmin = (): boolean => {
    return userProfile?.profile_type === 'admin';
  };

  // Função para verificar se o usuário logado é um administrador/representante de clínica
  const isClinicUser = (): boolean => {
    return userProfile?.profile_type === 'clinica';
  };

  // Função para obter as iniciais do nome para avatares
  const getInitials = (): string => {
    const name = getDisplayName();
    if (!name) return 'U';
    return name.split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Função para forçar uma nova busca do perfil (útil para debug)
  const refreshProfile = () => {
    console.log('[useAuthUser] Forçando refresh do perfil...');
    refetchProfile();
  };

  // Retornar um objeto consolidado com todos os dados e funções relevantes
  return {
    user, // Objeto user do Supabase Auth (pode ser null)
    session, // Objeto session do Supabase Auth (pode ser null)
    userProfile: userProfile || null, // Perfil da tabela user_profiles (garante que é UserProfile ou null)
    
    // Estado de carregamento combinado
    loading: authContextLoading || profileLoading, 
    // Booleano para verificar se o usuário está autenticado
    isAuthenticated: !!user && !!session && !authContextLoading,
    
    // Informação adicional sobre erro no perfil
    profileError,
    
    // Funções utilitárias
    getDisplayName,
    getInitials,
    isAdmin,
    isClinicUser,
    signOut: contextSignOut,
    refreshProfile, // Nova função para debug
  };
};
