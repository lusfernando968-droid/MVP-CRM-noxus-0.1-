INSERT INTO public.users (id, email, nome, role, is_active, subscription_ends_at, created_at)
VALUES 
  (gen_random_uuid(), 'oldschoolink@teste.com', 'Old School Ink Studio', 'USER', true, NOW() + INTERVAL '3 days', NOW()),
  (gen_random_uuid(), 'darktattooclub@teste.com', 'Dark Tattoo Club', 'USER', true, NOW() + INTERVAL '12 days', NOW()),
  (gen_random_uuid(), 'aquarelamaria@teste.com', 'Maria Aquarela Tattoos', 'USER', true, NOW() + INTERVAL '20 days', NOW()),
  -- Vencido abaixo
  (gen_random_uuid(), 'falidoestudio@teste.com', 'Estúdio Bloqueado', 'USER', false, NOW() - INTERVAL '5 days', NOW()),
  (gen_random_uuid(), 'finelineze@teste.com', 'Zé FineLine', 'USER', false, NOW() - INTERVAL '30 days', NOW());
