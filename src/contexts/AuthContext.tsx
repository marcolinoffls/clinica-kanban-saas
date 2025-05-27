// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client'; // Ajuste o caminho se necessário
import { toast } from 'sonner'; // Biblioteca de notificações

/**
 * @interface AuthContextType
 * Define a estrutura do contexto de autenticação, incluindo o usuário, sessão,
 * estado de carregamento e funções para interagir com a autenticação.
 */
interface AuthContextType {
  user: User | null; // Objeto do usuário autenticado do Supabase, ou null se não logado.
  session: Session | null; // Objeto da sessão ativa do Supabase, ou null.
  loading: boolean; // Indica se o estado inicial de autenticação ainda está sendo carregado.
  initialAuthChecked: boolean; // Indica se a verificação inicial da sessão já foi feita.
  signUp: (email: string, password: string, nomeCompleto?: string) => Promise<void>; // Função para registrar um novo usuário.
  signIn: (email: string, password: string) => Promise<void>; // Função para logar um usuário existente.
  signOut: () => Promise<void>; // Função para deslogar o usuário.
}

// Criação do Contexto de Autenticação.
// O valor inicial é undefined para forçar o uso dentro de um AuthProvider.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook customizado `useAuth` para consumir o AuthContext.
 * Garante que o hook seja usado dentro de um AuthProvider.
 * @returns {AuthContextType} O valor do contexto de autenticação.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode; // Tipo para 'children' em componentes React.
}

/**
 * Componente `AuthProvider`
 * Provedor do contexto que gerencia o estado de autenticação global.
 * Ele escuta mudanças no estado de autenticação do Supabase e atualiza o contexto.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Estado para armazenar o objeto do usuário autenticado.
  const [user, setUser] = useState<User | null>(null);
  // Estado para armazenar a sessão ativa.
  const [session, setSession] = useState<Session | null>(null);
  // Estado para indicar se a autenticação inicial está carregando.
  // Começa true para evitar renderizações prematuras de componentes protegidos.
  const [loading, setLoading] = useState(true);
  // Novo estado para rastrear se a verificação da sessão inicial já foi concluída
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  useEffect(() => {
    // Log de desenvolvimento: Indica que o listener de autenticação está sendo configurado.
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthProvider DEV_LOG] Configurando listener de autenticação Supabase...');
    }

    // Tenta obter a sessão atual ao montar o componente para verificar se o usuário já está logado.
    // Isso é importante para restaurar a sessão se o usuário recarregar a página.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider DEV_LOG] Sessão inicial verificada:', initialSession?.user?.email || 'Nenhuma sessão');
      }
      // Define os estados com base na sessão inicial.
      // Se não houver sessão, user e session serão null.
      // setLoading(false) aqui é crucial para não ficar em loading eterno se não houver sessão.
      if (!initialSession) {
        setLoading(false);
      }
      // (onAuthStateChange também será chamado e definirá os estados, mas esta verificação inicial pode acelerar)
      setInitialAuthChecked(true); // Marca que a verificação inicial foi feita
    });

    // Configura um listener para o evento onAuthStateChange do Supabase.
    // Este listener é chamado sempre que o estado de autenticação muda (login, logout, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        // Log de desenvolvimento: Mostra o evento de autenticação e o email do usuário, se houver.
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[AuthProvider DEV_LOG] Evento de AuthStateChange:', _event, 
            'Usuário da sessão:', currentSession?.user?.email || 'Nenhum'
          );
        }
        // Atualiza os estados de sessão e usuário com base na sessão atual.
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // Define loading como false APÓS o primeiro evento ser processado,
        // indicando que o estado de autenticação inicial foi resolvido.
        setLoading(false);
        if (!initialAuthChecked) {
            setInitialAuthChecked(true); // Garante que foi marcado se getSession() não o fez
        }
      }
    );

    // Função de limpeza: Desinscreve o listener quando o componente AuthProvider é desmontado.
    // Isso previne memory leaks.
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider DEV_LOG] Removendo listener de autenticação Supabase.');
      }
      subscription?.unsubscribe();
    };
  }, [initialAuthChecked]); // Adicionado initialAuthChecked para possivelmente refinar a lógica de loading

  // Função para registrar um novo usuário.
  const signUp = async (email: string, password: string, nomeCompleto?: string) => {
    try {
      // setLoading(true); // Pode ser gerenciado pelo estado de loading da mutação/componente que chama
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider DEV_LOG] Tentando cadastrar usuário:', email);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { // Metadados a serem armazenados em auth.users.raw_user_meta_data
            nome_completo: nomeCompleto || undefined // Envia undefined se não fornecido
          }
        }
      });

      if (error) {
        // Log do erro original para depuração em desenvolvimento.
        if (process.env.NODE_ENV === 'development') {
          console.error('[AuthProvider DEV_LOG] Erro Supabase no cadastro:', error);
        }
        // Traduzir mensagens de erro comuns para o usuário.
        if (error.message.includes('User already registered')) {
          throw new Error('Este email já está cadastrado. Tente fazer login.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.message.includes('instance_id')) { // Erro comum de configuração do Supabase
            throw new Error('Erro de configuração do servidor de autenticação. Contate o suporte.');
        }
        // Para outros erros, usa a mensagem do Supabase ou uma genérica.
        throw new Error(error.message || 'Ocorreu um erro desconhecido ao cadastrar.');
      }

      // Feedback para o usuário sobre o sucesso do cadastro.
      // O Supabase pode estar configurado para exigir confirmação de email.
      if (data.user && data.user.identities && data.user.identities.length > 0 && !data.session) {
        toast.success('Cadastro realizado! Verifique seu email para confirmar a conta.');
      } else if (data.session) { // Se o Supabase logar automaticamente após signUp (confirmação desabilitada)
        toast.success('Cadastro e login realizados com sucesso!');
      } else {
        // Fallback se a estrutura de 'data' for inesperada mas sem erro
        toast.info('Processo de cadastro iniciado.');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider DEV_LOG] Cadastro bem-sucedido (resposta Supabase):', data);
      }
    } catch (error: any) {
      // Log do erro final para o console do dev.
      if (process.env.NODE_ENV === 'development') {
        console.error('[AuthProvider DEV_LOG] Erro capturado na função signUp:', error.message);
      }
      // Exibe a mensagem de erro para o usuário.
      toast.error(error.message || 'Erro ao cadastrar usuário.');
      throw error; // Re-lança o erro para que o chamador possa tratar também.
    } finally {
      // setLoading(false); // O loading principal do AuthProvider é mais sobre o estado da sessão.
    }
  };

  // Função para logar um usuário existente.
  const signIn = async (email: string, password: string) => {
    try {
      // setLoading(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider DEV_LOG] Tentando fazer login:', email);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AuthProvider DEV_LOG] Erro Supabase no login:', error);
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Email não confirmado. Verifique sua caixa de entrada.');
        }
        throw new Error(error.message || 'Ocorreu um erro desconhecido ao fazer login.');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider DEV_LOG] Login bem-sucedido (resposta Supabase):', data);
      }
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AuthProvider DEV_LOG] Erro capturado na função signIn:', error.message);
      }
      toast.error(error.message || 'Erro ao fazer login.');
      throw error;
    } finally {
      // setLoading(false);
    }
  };

  // Função para deslogar o usuário.
  const signOut = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider DEV_LOG] Fazendo logout...');
      }
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AuthProvider DEV_LOG] Erro Supabase no logout:', error);
        }
        throw error; // Re-lança o erro do Supabase.
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider DEV_LOG] Logout realizado com sucesso.');
      }
      //setUser(null); // onAuthStateChange cuidará disso
      //setSession(null); // onAuthStateChange cuidará disso
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AuthProvider DEV_LOG] Erro capturado na função signOut:', error.message);
      }
      toast.error('Erro ao fazer logout.');
      throw error;
    }
  };

  // Monta o objeto de valor para o contexto.
  // Inclui os estados e as funções de autenticação.
  const value: AuthContextType = {
    user,
    session,
    loading,
    initialAuthChecked,
    signUp,
    signIn,
    signOut
  };

  // Retorna o Provedor do Contexto envolvendo os componentes filhos.
  // Assim, qualquer componente dentro de AuthProvider pode acessar o contexto via useAuth().
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};