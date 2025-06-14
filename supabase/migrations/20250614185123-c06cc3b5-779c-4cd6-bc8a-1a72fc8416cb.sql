
-- Remove a obrigatoriedade da coluna 'nome' para permitir a criação de leads sem essa informação inicial.
ALTER TABLE public.leads ALTER COLUMN nome DROP NOT NULL;

-- Remove a obrigatoriedade da coluna 'telefone' para permitir a criação de leads sem essa informação inicial.
ALTER TABLE public.leads ALTER COLUMN telefone DROP NOT NULL;

-- Atualiza a função de validação de dados do lead para remover a checagem obrigatória de nome e telefone.
-- Isso é necessário para que o fluxo de criação de leads via automação (n8n, etc.) funcione corretamente
-- quando essas informações não estão disponíveis. A validação do formato do e-mail será mantida.
CREATE OR REPLACE FUNCTION public.validar_lead_dados()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- As validações de nome e telefone foram removidas para acomodar leads de origens
  -- como o Instagram, onde esses dados podem não estar presentes inicialmente.
  
  -- Mantém a validação para o formato do email, se ele for fornecido.
  IF NEW.email IS NOT NULL AND LENGTH(TRIM(NEW.email)) > 0 THEN
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Email deve ter formato válido';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
