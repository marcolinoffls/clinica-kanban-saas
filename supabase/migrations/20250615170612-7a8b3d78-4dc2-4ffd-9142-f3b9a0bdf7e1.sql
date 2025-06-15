
-- Criar tabela para campanhas de follow-up
CREATE TABLE public.follow_up_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) NOT NULL DEFAULT 'automatico' CHECK (tipo IN ('automatico', 'manual')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  dias_inatividade INTEGER NOT NULL DEFAULT 3,
  horario_envio TIME WITHOUT TIME ZONE DEFAULT '09:00:00',
  apenas_dias_uteis BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para templates de mensagens de follow-up
CREATE TABLE public.follow_up_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.follow_up_campaigns(id) ON DELETE CASCADE,
  sequencia INTEGER NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  tipo_mensagem VARCHAR(20) DEFAULT 'text' CHECK (tipo_mensagem IN ('text', 'image', 'audio')),
  intervalo_dias INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, sequencia)
);

-- Criar tabela para execuções de follow-up
CREATE TABLE public.follow_up_execucoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.follow_up_campaigns(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.follow_up_templates(id) ON DELETE CASCADE,
  tipo_execucao VARCHAR(20) NOT NULL DEFAULT 'automatico' CHECK (tipo_execucao IN ('automatico', 'manual')),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'erro', 'cancelado')),
  data_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
  data_enviado TIMESTAMP WITH TIME ZONE,
  mensagem_id UUID REFERENCES public.chat_mensagens(id),
  erro_detalhes TEXT,
  user_id_manual UUID REFERENCES public.user_profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campo para controlar follow-up nos leads
ALTER TABLE public.leads 
ADD COLUMN follow_up_pausado BOOLEAN DEFAULT false,
ADD COLUMN data_ultimo_followup TIMESTAMP WITH TIME ZONE;

-- Criar índices para performance
CREATE INDEX idx_follow_up_campaigns_clinica_ativo ON public.follow_up_campaigns(clinica_id, ativo);
CREATE INDEX idx_follow_up_templates_campaign_sequencia ON public.follow_up_templates(campaign_id, sequencia);
CREATE INDEX idx_follow_up_execucoes_status_agendada ON public.follow_up_execucoes(status, data_agendada);
CREATE INDEX idx_follow_up_execucoes_lead_campaign ON public.follow_up_execucoes(lead_id, campaign_id);
CREATE INDEX idx_leads_follow_up_data ON public.leads(data_ultimo_contato, follow_up_pausado);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.follow_up_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_execucoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para follow_up_campaigns
CREATE POLICY "Users can view their clinic campaigns" 
  ON public.follow_up_campaigns 
  FOR SELECT 
  USING (clinica_id = public.get_user_clinica_id());

CREATE POLICY "Users can create campaigns for their clinic" 
  ON public.follow_up_campaigns 
  FOR INSERT 
  WITH CHECK (clinica_id = public.get_user_clinica_id());

CREATE POLICY "Users can update their clinic campaigns" 
  ON public.follow_up_campaigns 
  FOR UPDATE 
  USING (clinica_id = public.get_user_clinica_id());

CREATE POLICY "Users can delete their clinic campaigns" 
  ON public.follow_up_campaigns 
  FOR DELETE 
  USING (clinica_id = public.get_user_clinica_id());

-- Políticas RLS para follow_up_templates
CREATE POLICY "Users can view templates of their clinic campaigns" 
  ON public.follow_up_templates 
  FOR SELECT 
  USING (campaign_id IN (
    SELECT id FROM public.follow_up_campaigns 
    WHERE clinica_id = public.get_user_clinica_id()
  ));

CREATE POLICY "Users can create templates for their clinic campaigns" 
  ON public.follow_up_templates 
  FOR INSERT 
  WITH CHECK (campaign_id IN (
    SELECT id FROM public.follow_up_campaigns 
    WHERE clinica_id = public.get_user_clinica_id()
  ));

CREATE POLICY "Users can update templates of their clinic campaigns" 
  ON public.follow_up_templates 
  FOR UPDATE 
  USING (campaign_id IN (
    SELECT id FROM public.follow_up_campaigns 
    WHERE clinica_id = public.get_user_clinica_id()
  ));

CREATE POLICY "Users can delete templates of their clinic campaigns" 
  ON public.follow_up_templates 
  FOR DELETE 
  USING (campaign_id IN (
    SELECT id FROM public.follow_up_campaigns 
    WHERE clinica_id = public.get_user_clinica_id()
  ));

-- Políticas RLS para follow_up_execucoes
CREATE POLICY "Users can view executions of their clinic leads" 
  ON public.follow_up_execucoes 
  FOR SELECT 
  USING (lead_id IN (
    SELECT id FROM public.leads 
    WHERE clinica_id = public.get_user_clinica_id()
  ));

CREATE POLICY "Users can create executions for their clinic leads" 
  ON public.follow_up_execucoes 
  FOR INSERT 
  WITH CHECK (lead_id IN (
    SELECT id FROM public.leads 
    WHERE clinica_id = public.get_user_clinica_id()
  ));

CREATE POLICY "Users can update executions of their clinic leads" 
  ON public.follow_up_execucoes 
  FOR UPDATE 
  USING (lead_id IN (
    SELECT id FROM public.leads 
    WHERE clinica_id = public.get_user_clinica_id()
  ));

-- Políticas para admins terem acesso total
CREATE POLICY "Admins can view all campaigns" 
  ON public.follow_up_campaigns 
  FOR ALL 
  USING (public.is_admin());

CREATE POLICY "Admins can view all templates" 
  ON public.follow_up_templates 
  FOR ALL 
  USING (public.is_admin());

CREATE POLICY "Admins can view all executions" 
  ON public.follow_up_execucoes 
  FOR ALL 
  USING (public.is_admin());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_follow_up_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_follow_up_campaigns_updated_at
  BEFORE UPDATE ON public.follow_up_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_up_updated_at();

CREATE TRIGGER update_follow_up_templates_updated_at
  BEFORE UPDATE ON public.follow_up_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_up_updated_at();

CREATE TRIGGER update_follow_up_execucoes_updated_at
  BEFORE UPDATE ON public.follow_up_execucoes
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_up_updated_at();
