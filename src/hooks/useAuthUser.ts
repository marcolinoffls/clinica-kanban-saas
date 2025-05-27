// src/hooks/useAuthUser.ts

import { useAuth } from '@/contexts/AuthContext'; // Ajuste o caminho se necessário
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Ajuste o caminho se necessário

/**
 * Interface para os dados do perfil do usuário.
 * Certifique-se de que corresponde à sua tabela `user_profiles` e à enum `user_profile_type`.
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
 */
export const useAuthUser = () => {
  // 1. Obter dados brutos de autenticação (user, session, loading) e função signOut do AuthContext.
  //    'authContextLoading' renomeado para evitar conflito com 'profileLoading'.
  const { user, session, loading: authContextLoading, signOut: contextSignOut } = useAuth();

  // Log para verificar os dados recebidos do AuthContext.
  // Este é o primeiro ponto a verificar se userProfile está vindo como null.
  console.log(
    '[useAuthUser] Dados do AuthContext -> User:', user, 
    'Session:', session, 
    'AuthContextLoading:', authContextLoading
  );
  if (user) {
    console.log('[useAuthUser] AuthContext user.id:', user.id, 'user.email:', user.email);
  } else if (!authContextLoading) {
    console.warn('[useAuthUser] AuthContext: User é nulo e authContextLoading é false. Usuário provavelmente não está logado.');
  }


  // 2. Determinar se a query para buscar o perfil do usuário deve ser habilitada.
  //    A query só roda se:
  //    a) O objeto 'user' do AuthContext existir e tiver um 'id'.
  //    b) A 'session' do AuthContext existir (garante que estamos autenticados).
  //    c) O 'authContextLoading' for false (o AuthContext terminou seu carregamento inicial).
  const queryProfileEnabled = !!user?.id && !!session && !authContextLoading;
  console.log('[useAuthUser] Query para buscar userProfile está habilitada (queryProfileEnabled)? ->', queryProfileEnabled);

  // 3. Usar @tanstack/react-query para buscar os dados do perfil da tabela `user_profiles`.
  const { 
    data: userProfile, // Dados do perfil, undefined inicialmente, depois UserProfile ou null.
    isLoading: profileLoading, // Booleano: esta query específica está carregando?
    error: profileError // Objeto de erro se a queryFn falhar.
  } = useQuery<UserProfile | null, Error>({ // Tipagem explícita do retorno e do erro.
    // Chave da query: Única. Muda se user.id mudar, causando refetch.
    queryKey: ['userProfile', user?.id], 
    
    // Função que efetivamente busca os dados.
    queryFn: async (): Promise<UserProfile | null> => {
      // Esta verificação é uma redundância, pois 'enabled' já cuida disso, mas útil para depurar a queryFn.
      if (!user?.id) {
        console.warn('[useAuthUser - queryFn] Tentativa de executar queryFn, mas user.id é nulo/indefinido. Retornando null.');
        return null;
      }

      console.log(`[useAuthUser - queryFn] Buscando perfil do usuário para user_id: ${user.id}`);

      // Chamada ao Supabase.
      const { data, error: dbError } = await supabase
        .from('user_profiles') // Nome da sua tabela de perfis.
        .select('*') // Seleciona todas as colunas.
        .eq('user_id', user.id) // Filtra pelo user_id do usuário autenticado.
        .single(); // Espera um único resultado.

      // Tratamento de erro da chamada ao Supabase.
      if (dbError) {
        console.error('[useAuthUser - queryFn] Erro ao buscar user_profile no Supabase:', dbError);
        // Lançar o erro faz com que o React Query coloque a query no estado 'error'.
        // E retornará null para userProfile se não for tratado no onError.
        // Se a RLS impede a leitura e a linha existe, dbError.code pode ser '42501' (permission denied)
        // Se a linha não existe, data será null e dbError também (com single()).
        // Se múltiplas linhas forem encontradas (não deveria acontecer com user_id UNIQUE), single() dá erro.
        throw new Error(`Erro ao buscar perfil do usuário: ${dbError.message}`);
      }

      if (data) {
        console.log('[useAuthUser - queryFn] Perfil do usuário encontrado no Supabase:', data);
      } else {
        console.warn(`[useAuthUser - queryFn] Nenhum perfil encontrado na tabela 'user_profiles' para user_id: ${user.id}. Verifique o trigger handle_new_user.`);
      }
      
      return data as UserProfile | null; // Retorna os dados ou null.
    },
    // Habilita a query somente se as condições forem atendidas.
    enabled: queryProfileEnabled, 
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos.
    retry: 1 // Tenta 1 vez adicional em caso de falha.
  });

  // Log do estado do userProfile e do carregamento do perfil.
  console.log(
    '[useAuthUser] Estado da query de perfil -> userProfile:', userProfile, 
    'profileLoading:', profileLoading, 
    'profileError:', profileError
  );

  // Função para obter nome de exibição do usuário de forma segura.
  const getDisplayName = (): string => {
    if (userProfile?.nome_completo) return userProfile.nome_completo;
    if (user?.user_metadata?.nome_completo) return user.user_metadata.nome_completo; // Do metadata do Supabase Auth
    if (user?.email) return user.email.split('@')[0]; // Fallback para parte local do email
    return 'Usuário'; // Fallback final
  };

  // Função para verificar se o usuário logado é um administrador do sistema.
  const isAdmin = (): boolean => {
    return userProfile?.profile_type === 'admin';
  };

  // Função para verificar se o usuário logado é um administrador/representante de clínica.
  const isClinicUser = (): boolean => { // Renomeado para clareza, já que 'clinica' é um tipo de perfil
    return userProfile?.profile_type === 'clinica';
  };

  // Função para obter as iniciais do nome para avatares.
  const getInitials = (): string => {
    const name = getDisplayName();
    if (!name) return 'U'; // Fallback se nome for nulo/vazio
    return name.split(' ')
      .filter(word => word.length > 0) // Evita erro com múltiplos espaços
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // 4. Retornar um objeto consolidado com todos os dados e funções relevantes.
  return {
    user, // Objeto user do Supabase Auth (pode ser null)
    session, // Objeto session do Supabase Auth (pode ser null)
    userProfile: userProfile || null, // Perfil da tabela user_profiles (garante que é UserProfile ou null)
    
    // Estado de carregamento combinado: verdadeiro se a autenticação OU o perfil estiverem carregando.
    loading: authContextLoading || profileLoading, 
    // Booleano simples para verificar se o usuário está autenticado.
    isAuthenticated: !!user && !!session && !authContextLoading, // Considera authContextLoading para um estado mais preciso
    
    // Funções utilitárias
    getDisplayName,
    getInitials,
    isAdmin,
    isClinicUser, // Renomeado de isClinicAdmin para refletir o profile_type 'clinica'
    signOut: contextSignOut, // Renomeado para evitar conflito e usar o signOut do AuthContext
  };
};