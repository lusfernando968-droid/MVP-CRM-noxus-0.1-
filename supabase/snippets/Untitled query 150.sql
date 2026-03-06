-- Vamos pegar os 3 primeiros usuarios comuns (que acabaram de nascer)
-- e simular assinaturas variadas neles
WITH target_users AS (
  SELECT id FROM public.users 
  WHERE role != 'ADMIN' 
  LIMIT 3
)
UPDATE public.users u
SET 
  is_active = CASE 
    WHEN row_num = 1 THEN true
    WHEN row_num = 2 THEN true
    ELSE false 
  END,
  subscription_ends_at = CASE 
    WHEN row_num = 1 THEN NOW() + INTERVAL '5 days'
    WHEN row_num = 2 THEN NOW() + INTERVAL '20 days'
    ELSE NOW() - INTERVAL '10 days' -- Esse aqui ficará bloqueado
  END
FROM (
  SELECT id, row_number() OVER () as row_num 
  FROM target_users
) as t
WHERE u.id = t.id;
