ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.users 
SET subscription_ends_at = NOW() + INTERVAL '10 years'
WHERE role = 'ADMIN' OR email = 'dev@noxus.com' OR email = 'luizfernando968@gmail.com';

UPDATE public.users 
SET subscription_ends_at = NOW() + INTERVAL '30 days'
WHERE is_active = true AND role != 'ADMIN';
