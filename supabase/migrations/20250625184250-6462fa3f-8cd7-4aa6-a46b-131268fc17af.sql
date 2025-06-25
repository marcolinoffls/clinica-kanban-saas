
-- Criar tabela para anúncios personalizados
CREATE TABLE public.custom_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  ad_phrase TEXT NOT NULL,
  ad_source TEXT NOT NULL,
  ad_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS (Row Level Security) para a tabela
ALTER TABLE public.custom_ads ENABLE ROW LEVEL SECURITY;

-- Política para que apenas usuários da clínica vejam seus próprios anúncios
CREATE POLICY "Users can view their clinic's custom ads" 
  ON public.custom_ads 
  FOR SELECT 
  USING (
    clinica_id IN (
      SELECT clinica_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
    OR is_admin()
  );

-- Política para criar anúncios
CREATE POLICY "Users can create custom ads for their clinic" 
  ON public.custom_ads 
  FOR INSERT 
  WITH CHECK (
    clinica_id IN (
      SELECT clinica_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
    OR is_admin()
  );

-- Política para atualizar anúncios
CREATE POLICY "Users can update their clinic's custom ads" 
  ON public.custom_ads 
  FOR UPDATE 
  USING (
    clinica_id IN (
      SELECT clinica_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
    OR is_admin()
  );

-- Política para deletar anúncios
CREATE POLICY "Users can delete their clinic's custom ads" 
  ON public.custom_ads 
  FOR DELETE 
  USING (
    clinica_id IN (
      SELECT clinica_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
    OR is_admin()
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_custom_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_ads_updated_at
  BEFORE UPDATE ON public.custom_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_ads_updated_at();

-- Comentários para documentar a tabela
COMMENT ON TABLE public.custom_ads IS 'Configurações de anúncios personalizados por clínica para contabilização no n8n';
COMMENT ON COLUMN public.custom_ads.ad_phrase IS 'Frase personalizada que identifica o anúncio';
COMMENT ON COLUMN public.custom_ads.ad_source IS 'Origem do anúncio: whatsapp, direct, google ou personalizada';
COMMENT ON COLUMN public.custom_ads.ad_name IS 'Nome identificador do anúncio';
COMMENT ON COLUMN public.custom_ads.active IS 'Se o anúncio está ativo para detecção';
