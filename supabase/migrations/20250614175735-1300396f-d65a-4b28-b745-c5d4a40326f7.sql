
-- Adiciona a coluna para armazenar o nome de usuário do Instagram na tabela de clínicas.
-- Esta coluna é opcional (pode ser nula) para que as clínicas possam configurar a integração quando desejarem.
ALTER TABLE public.clinicas
ADD COLUMN instagram_user_handle TEXT;
