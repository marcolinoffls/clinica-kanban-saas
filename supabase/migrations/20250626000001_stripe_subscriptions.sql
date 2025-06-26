
-- Criação da tabela de assinaturas do Stripe
-- O que faz: Armazena informações das assinaturas pagas das clínicas
-- Onde é usado: Sistema de cobrança e controle de acesso a funcionalidades premium
-- Como se conecta: Liga clínicas aos seus planos de pagamento no Stripe

CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE COMMENT 'ID da clínica proprietária da assinatura',
    stripe_customer_id TEXT UNIQUE COMMENT 'ID do cliente no Stripe',
    stripe_subscription_id TEXT UNIQUE COMMENT 'ID da assinatura no Stripe',
    stripe_price_id TEXT COMMENT 'ID do preço/plano no Stripe',
    status TEXT NOT NULL DEFAULT 'trial' COMMENT 'Status da assinatura: trial, active, canceled, past_due',
    plano TEXT NOT NULL DEFAULT 'free' COMMENT 'Tipo do plano: free, basic, premium',
    valor_mensal DECIMAL(10,2) COMMENT 'Valor mensal da assinatura em reais',
    trial_end TIMESTAMPTZ COMMENT 'Data de fim do período de teste',
    current_period_start TIMESTAMPTZ COMMENT 'Início do período atual',
    current_period_end TIMESTAMPTZ COMMENT 'Fim do período atual',
    canceled_at TIMESTAMPTZ COMMENT 'Data de cancelamento da assinatura',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT 'Data de criação do registro',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT 'Data da última atualização'
);

-- Índices para otmizar consultas
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_clinica_id ON public.stripe_subscriptions(clinica_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON public.stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_customer_id ON public.stripe_subscriptions(stripe_customer_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_stripe_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stripe_subscriptions_updated_at
    BEFORE UPDATE ON public.stripe_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_subscriptions_updated_at();

-- Política de segurança RLS (Row Level Security)
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Permite que usuários vejam apenas assinaturas de suas próprias clínicas
CREATE POLICY "Usuários podem ver assinaturas de suas clínicas"
ON public.stripe_subscriptions FOR SELECT
USING (
    clinica_id IN (
        SELECT cu.clinica_id 
        FROM clinica_usuarios cu 
        WHERE cu.user_id = auth.uid()
    )
);

-- Permite que usuários atualizem assinaturas de suas clínicas (apenas para administradores)
CREATE POLICY "Administradores podem atualizar assinaturas"
ON public.stripe_subscriptions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid() 
        AND au.email IN ('admin@sistema.com', 'suporte@sistema.com')
    )
);

-- Adiciona colunas de controle de plano na tabela de clínicas
ALTER TABLE public.clinicas 
ADD COLUMN IF NOT EXISTS plano_atual TEXT DEFAULT 'free' COMMENT 'Plano atual da clínica: free, basic, premium',
ADD COLUMN IF NOT EXISTS plano_expira_em TIMESTAMPTZ COMMENT 'Data de expiração do plano atual',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT COMMENT 'ID do cliente no Stripe (duplicado para facilitar consultas)';

-- Índice para otimizar consultas por plano
CREATE INDEX IF NOT EXISTS idx_clinicas_plano_atual ON public.clinicas(plano_atual);

-- Função para verificar se uma clínica tem acesso a funcionalidades premium
CREATE OR REPLACE FUNCTION public.clinica_tem_acesso_premium(clinica_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plano_info RECORD;
BEGIN
    -- Busca informações do plano da clínica
    SELECT 
        c.plano_atual,
        c.plano_expira_em,
        ss.status,
        ss.current_period_end
    INTO plano_info
    FROM public.clinicas c
    LEFT JOIN public.stripe_subscriptions ss ON c.id = ss.clinica_id
    WHERE c.id = clinica_uuid;
    
    -- Se não encontrou a clínica, nega acesso
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Se tem plano básico ou premium ativo
    IF plano_info.plano_atual IN ('basic', 'premium') THEN
        -- Verifica se não expirou
        IF plano_info.plano_expira_em IS NULL OR plano_info.plano_expira_em > NOW() THEN
            -- Verifica status da assinatura no Stripe
            IF plano_info.status IN ('active', 'trialing') THEN
                RETURN TRUE;
            END IF;
        END IF;
    END IF;
    
    -- Verifica se está em período de teste válido
    IF plano_info.plano_atual = 'free' AND plano_info.plano_expira_em > NOW() THEN
        RETURN TRUE;
    END IF;
    
    -- Caso contrário, nega acesso
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE public.stripe_subscriptions IS 'Tabela para gerenciar assinaturas do Stripe - controla o acesso pago das clínicas';
COMMENT ON FUNCTION public.clinica_tem_acesso_premium(UUID) IS 'Função para verificar se uma clínica tem acesso a funcionalidades premium baseado no seu plano ativo';
