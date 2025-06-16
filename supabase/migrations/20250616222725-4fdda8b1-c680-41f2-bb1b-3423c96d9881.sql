
-- Criar tabela para armazenar apelidos dos anúncios
CREATE TABLE public.ad_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id UUID NOT NULL,
  ad_name_original TEXT NOT NULL,
  ad_alias TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índice único para evitar duplicatas por clínica
CREATE UNIQUE INDEX ad_aliases_clinica_ad_name_unique 
ON public.ad_aliases (clinica_id, ad_name_original);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.ad_aliases ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para que cada clínica veja apenas seus próprios aliases
CREATE POLICY "Clínicas podem ver seus próprios aliases de anúncios" 
  ON public.ad_aliases 
  FOR SELECT 
  USING (clinica_id = get_user_clinica_id());

CREATE POLICY "Clínicas podem criar aliases de anúncios" 
  ON public.ad_aliases 
  FOR INSERT 
  WITH CHECK (clinica_id = get_user_clinica_id());

CREATE POLICY "Clínicas podem atualizar seus próprios aliases de anúncios" 
  ON public.ad_aliases 
  FOR UPDATE 
  USING (clinica_id = get_user_clinica_id());

CREATE POLICY "Clínicas podem deletar seus próprios aliases de anúncios" 
  ON public.ad_aliases 
  FOR DELETE 
  USING (clinica_id = get_user_clinica_id());

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_ad_aliases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ad_aliases_updated_at
  BEFORE UPDATE ON public.ad_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ad_aliases_updated_at();
