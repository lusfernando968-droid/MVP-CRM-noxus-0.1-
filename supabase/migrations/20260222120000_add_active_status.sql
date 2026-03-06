-- Migração para controle de acesso manual (MVP)
-- Adiciona o campo is_active para permitir que o admin habilite contas após pagamento externo

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Garantir que o usuário desenvolvedor já comece ativo
UPDATE public.users 
SET is_active = true 
WHERE email = 'dev@noxus.com';
