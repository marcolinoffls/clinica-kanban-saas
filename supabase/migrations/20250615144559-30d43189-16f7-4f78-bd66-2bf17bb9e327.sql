
-- Adiciona a coluna para o token da API do Instagram na tabela de clínicas
-- O que faz: Cria um novo campo chamado 'instagram_api_token' na tabela 'clinicas'.
-- Onde é usado: Este campo armazenará o token de API que será usado para autenticar
-- as integrações com o Instagram.
-- Tipo de dado: TEXT permite armazenar tokens de comprimentos variados.
ALTER TABLE public.clinicas
ADD COLUMN instagram_api_token TEXT;
