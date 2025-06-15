
-- Adiciona a coluna para o complemento do endereço na tabela de clínicas
ALTER TABLE public.clinicas ADD COLUMN complemento TEXT;

-- Adiciona a coluna para a cidade na tabela de clínicas
ALTER TABLE public.clinicas ADD COLUMN cidade TEXT;

-- Adiciona a coluna para o estado (UF) na tabela de clínicas
ALTER TABLE public.clinicas ADD COLUMN estado TEXT;

-- Adiciona a coluna para o CEP na tabela de clínicas
ALTER TABLE public.clinicas ADD COLUMN cep TEXT;

-- Adiciona a coluna para o horário de funcionamento na tabela de clínicas
-- O tipo JSONB é usado para armazenar estruturas de dados flexíveis, como os horários.
ALTER TABLE public.clinicas ADD COLUMN horario_funcionamento JSONB;
