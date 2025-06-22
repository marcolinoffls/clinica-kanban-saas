
-- Corrigir políticas RLS para permitir que admins criem leads para qualquer clínica
DROP POLICY IF EXISTS "Users can create leads for their clinic" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads from their clinic" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads from their clinic" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads from their clinic" ON public.leads;

-- Política para SELECT: usuários veem leads de sua clínica, admins veem todos
CREATE POLICY "Users can view leads" 
ON public.leads 
FOR SELECT 
USING (
  public.is_current_user_admin() OR 
  clinica_id = public.get_user_clinica_id()
);

-- Política para INSERT: usuários criam leads para sua clínica, admins podem criar para qualquer clínica
CREATE POLICY "Users can create leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  public.is_current_user_admin() OR 
  clinica_id = public.get_user_clinica_id()
);

-- Política para UPDATE: usuários atualizam leads de sua clínica, admins podem atualizar qualquer lead
CREATE POLICY "Users can update leads" 
ON public.leads 
FOR UPDATE 
USING (
  public.is_current_user_admin() OR 
  clinica_id = public.get_user_clinica_id()
);

-- Política para DELETE: usuários deletam leads de sua clínica, admins podem deletar qualquer lead
CREATE POLICY "Users can delete leads" 
ON public.leads 
FOR DELETE 
USING (
  public.is_current_user_admin() OR 
  clinica_id = public.get_user_clinica_id()
);
