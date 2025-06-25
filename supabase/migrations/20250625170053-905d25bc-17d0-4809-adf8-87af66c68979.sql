
-- Adicionar campos para configuração de webhook por clínica
ALTER TABLE public.clinicas 
ADD COLUMN webhook_type text DEFAULT 'padrao',
ADD COLUMN webhook_url text;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.clinicas.webhook_type IS 'Tipo de webhook: padrao ou personalizado';
COMMENT ON COLUMN public.clinicas.webhook_url IS 'URL personalizada do webhook quando tipo é personalizado';
