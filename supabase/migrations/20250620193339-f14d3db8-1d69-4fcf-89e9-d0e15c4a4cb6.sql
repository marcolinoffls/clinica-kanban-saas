
-- Criar tabela de planos disponíveis
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  display_name VARCHAR NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_leads INTEGER,
  max_users INTEGER,
  max_mensagens_mes INTEGER,
  features JSONB DEFAULT '{}',
  stripe_price_id_monthly VARCHAR,
  stripe_price_id_yearly VARCHAR,
  active BOOLEAN NOT NULL DEFAULT true,
  trial_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de assinaturas das clínicas
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status VARCHAR NOT NULL DEFAULT 'trial',
  stripe_subscription_id VARCHAR UNIQUE,
  stripe_customer_id VARCHAR,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinica_id)
);

-- Criar tabela de histórico de mudanças de planos
CREATE TABLE public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  old_plan_id UUID REFERENCES public.plans(id),
  new_plan_id UUID NOT NULL REFERENCES public.plans(id),
  change_reason VARCHAR,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir planos padrão
INSERT INTO public.plans (name, display_name, description, price_monthly, price_yearly, max_leads, max_users, max_mensagens_mes, features, trial_days) VALUES
('trial', 'Período de Teste', 'Teste gratuito com recursos limitados', 0, 0, 50, 1, 500, '{"ai_chat": true, "kanban": true, "basic_reports": true}', 14),
('basic', 'Plano Básico', 'Ideal para clínicas pequenas', 97, 970, 500, 3, 2000, '{"ai_chat": true, "kanban": true, "basic_reports": true, "follow_up": true}', 0),
('professional', 'Plano Profissional', 'Para clínicas em crescimento', 197, 1970, 2000, 10, 10000, '{"ai_chat": true, "kanban": true, "advanced_reports": true, "follow_up": true, "integrations": true, "priority_support": true}', 0);

-- Habilitar RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para plans (todos podem ver planos ativos)
CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (active = true);

-- Políticas RLS para subscriptions (apenas da própria clínica ou admin)
CREATE POLICY "Users can view own clinic subscription" ON public.subscriptions
  FOR SELECT USING (
    clinica_id = get_user_clinica_id() OR 
    is_admin()
  );

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
  FOR ALL USING (is_admin());

-- Políticas RLS para subscription_history
CREATE POLICY "Users can view own subscription history" ON public.subscription_history
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions 
      WHERE clinica_id = get_user_clinica_id()
    ) OR is_admin()
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at_trigger
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();

-- Modificar função handle_new_user para criar trial automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    nova_clinica_id uuid;
    nome_usuario text;
    trial_plan_id uuid;
BEGIN
    -- Obter o nome do usuário dos metadados ou usar um padrão
    nome_usuario := COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', 'Usuário');
    
    -- Criar uma nova clínica para o usuário
    INSERT INTO public.clinicas (
        nome,
        email,
        status,
        plano_contratado
    )
    VALUES (
        'Clínica de ' || nome_usuario,
        NEW.email, 
        'ativo',    
        'trial'    
    )
    RETURNING id INTO nova_clinica_id;
    
    -- Criar o perfil do usuário associado à nova clínica
    INSERT INTO public.user_profiles (
        user_id, 
        nome_completo, 
        profile_type, 
        status_usuario,
        clinica_id
    )
    VALUES (
        NEW.id,
        nome_usuario,
        'clinica'::public.user_profile_type, 
        'ativo',                             
        nova_clinica_id
    );
    
    -- Buscar o plano trial
    SELECT id INTO trial_plan_id FROM public.plans WHERE name = 'trial' LIMIT 1;
    
    -- Criar assinatura trial para a nova clínica
    IF trial_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (
            clinica_id,
            plan_id,
            status,
            trial_start,
            trial_end
        )
        VALUES (
            nova_clinica_id,
            trial_plan_id,
            'trial',
            NOW(),
            NOW() + INTERVAL '14 days'
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro e re-raise para não bloquear o cadastro
        RAISE WARNING 'Erro no trigger handle_new_user: SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        RAISE; 
END;
$$;
