-- Adiciona a coluna de controle de assinatura
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ DEFAULT NOW();

-- Garante que o desenvolvedor/admin tenha uma assinatura infinita (10 anos à frente) para não ser bloqueado.
UPDATE public.users 
SET subscription_ends_at = NOW() + INTERVAL '10 years'
WHERE role = 'ADMIN' OR email = 'dev@noxus.com' OR email = 'luizfernando968@gmail.com';

-- Garante que os usuários existentes que já estavam ativos ganhem pelo menos 30 dias de presente 
-- para não serem ejetados sem aviso prévio caso estivessem no meio de um atendimento
UPDATE public.users 
SET subscription_ends_at = NOW() + INTERVAL '30 days'
WHERE is_active = true AND role != 'ADMIN';
