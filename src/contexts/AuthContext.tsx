
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Contexto de Autenticação Global
 * 
 * Gerencia o estado de autenticação em toda a aplicação:
 * - Usuário atual logado
 * - Sessão ativa do Supabase
 * - Estados de carregamento
 * - Funções de login, logout e cadastro
 * 
 * Utiliza o supabase.auth.onAuthStateChange para manter
 * o estado sincronizado automaticamente.
 */

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nomeCompleto?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Configurando listener de autenticação...');

    // Configurar listener de mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Evento de auth:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sessão inicial:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('Removendo listener de autenticação');
      subscription.unsubscribe();
    };
  }, []);

  // Função de cadastro
  const signUp = async (email: string, password: string, nomeCompleto?: string) => {
    try {
      setLoading(true);
      console.log('Tentando cadastrar usuário:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: nomeCompleto || 'Usuário'
          }
        }
      });

      if (error) {
        console.error('Erro no cadastro:', error);
        
        // Traduzir mensagens de erro comuns
        if (error.message.includes('User already registered')) {
          throw new Error('Este email já está cadastrado. Tente fazer login.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Email inválido. Verifique o formato.');
        }
        
        throw new Error(error.message);
      }

      if (data.user && !data.session) {
        toast.success('Cadastro realizado! Verifique seu email para confirmar a conta.');
      } else if (data.session) {
        toast.success('Cadastro realizado com sucesso!');
      }

      console.log('Cadastro bem-sucedido:', data.user?.email);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error(error.message || 'Erro ao cadastrar usuário.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Tentando fazer login:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro no login:', error);
        
        // Traduzir mensagens de erro comuns
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Email não confirmado. Verifique sua caixa de entrada.');
        }
        
        throw new Error(error.message);
      }

      console.log('Login bem-sucedido:', data.user?.email);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      console.log('Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        throw error;
      }

      console.log('Logout realizado com sucesso');
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout.');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
