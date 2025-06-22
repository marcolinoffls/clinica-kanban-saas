
-- Criar função security definer para verificar se o usuário é admin
-- Isso evita recursão infinita nas políticas RLS
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND profile_type = 'admin'
  );
$$;

-- Política RLS para chat_mensagens permitindo acesso completo para admins
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_mensagens;
CREATE POLICY "Admins can view all messages" 
ON public.chat_mensagens 
FOR SELECT 
USING (public.is_current_user_admin());

-- Política RLS para leads permitindo acesso completo para admins
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
USING (public.is_current_user_admin());

-- Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE public.chat_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
