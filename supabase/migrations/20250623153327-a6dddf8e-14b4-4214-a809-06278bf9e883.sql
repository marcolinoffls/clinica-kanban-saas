
-- Corrigir políticas RLS apenas para tabelas (não views)

-- Habilitar RLS na tabela clinicas se não estiver habilitado
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Admins can view all clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "Users can view their clinic" ON public.clinicas;
DROP POLICY IF EXISTS "Clinicas visibility policy" ON public.clinicas;

-- Criar política para permitir que admins vejam todas as clínicas
CREATE POLICY "Admins can view all clinicas" 
ON public.clinicas 
FOR SELECT 
USING (public.is_current_user_admin());

-- Criar política para permitir que usuários vejam apenas sua clínica
CREATE POLICY "Users can view their clinic" 
ON public.clinicas 
FOR SELECT 
USING (
  NOT public.is_current_user_admin() AND 
  id = public.get_user_clinica_id()
);

-- Verificar e corrigir políticas para user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Habilitar RLS na tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários verem seu próprio perfil
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Criar política para admins verem todos os perfis
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (public.is_current_user_admin());
