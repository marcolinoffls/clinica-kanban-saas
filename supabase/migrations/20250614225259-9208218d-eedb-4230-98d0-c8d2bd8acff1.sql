
-- Adiciona a coluna para o tipo de webhook do Instagram
-- 'personalizado' será o padrão, para manter o comportamento atual.
ALTER TABLE public.clinicas
ADD COLUMN instagram_webhook_type TEXT CHECK (instagram_webhook_type IN ('padrao', 'personalizado')) DEFAULT 'personalizado';

-- Adiciona a coluna para a URL do webhook padrão do Instagram (usada quando o tipo é 'padrao')
ALTER TABLE public.clinicas
ADD COLUMN instagram_webhook_url TEXT;

-- Adiciona comentários para documentação no banco de dados, explicando o propósito de cada coluna nova.
COMMENT ON COLUMN public.clinicas.instagram_webhook_type IS 'Define o tipo de webhook para o Instagram: "padrao" (usa uma URL fixa de instagram_webhook_url) ou "personalizado" (constrói a URL a partir do instagram_user_handle).';
COMMENT ON COLUMN public.clinicas.instagram_webhook_url IS 'Armazena a URL completa do webhook do tipo "padrão" para o Instagram.';

