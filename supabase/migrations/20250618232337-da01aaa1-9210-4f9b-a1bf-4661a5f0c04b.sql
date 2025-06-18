
-- Criar tabela para armazenar relatórios de IA
CREATE TABLE public.ai_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  delivery_method character varying NOT NULL DEFAULT 'system',
  status character varying NOT NULL DEFAULT 'pending',
  report_content text,
  report_pdf_url text,
  phone_number character varying,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar índice para otimizar buscas por clínica e período
CREATE INDEX idx_ai_reports_clinica_period ON public.ai_reports(clinica_id, start_date, end_date);

-- Criar índice para status para buscar relatórios em processamento
CREATE INDEX idx_ai_reports_status ON public.ai_reports(status);

-- Habilitar Row Level Security
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- Política para usuários de clínicas verem apenas seus próprios relatórios
CREATE POLICY "Usuários podem ver relatórios da própria clínica" 
  ON public.ai_reports 
  FOR SELECT 
  USING (clinica_id = get_user_clinica_id());

-- Política para usuários de clínicas criarem relatórios da própria clínica
CREATE POLICY "Usuários podem criar relatórios da própria clínica" 
  ON public.ai_reports 
  FOR INSERT 
  WITH CHECK (clinica_id = get_user_clinica_id());

-- Política para usuários de clínicas atualizarem relatórios da própria clínica
CREATE POLICY "Usuários podem atualizar relatórios da própria clínica" 
  ON public.ai_reports 
  FOR UPDATE 
  USING (clinica_id = get_user_clinica_id());

-- Política para administradores terem acesso total
CREATE POLICY "Administradores têm acesso total a relatórios" 
  ON public.ai_reports 
  FOR ALL 
  USING (is_admin());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_ai_reports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER ai_reports_updated_at_trigger
  BEFORE UPDATE ON public.ai_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_reports_updated_at();
