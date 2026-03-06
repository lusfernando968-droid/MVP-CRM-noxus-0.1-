-- Adicionar coluna whatsapp na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Atualizar a função de trigger para também salvar o whatsapp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, role, is_active, whatsapp)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    'USER',
    false, -- Começa inativo para controle manual (MVP)
    NEW.raw_user_meta_data->>'whatsapp'
  )
  ON CONFLICT (id) DO UPDATE SET
    whatsapp = EXCLUDED.whatsapp;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
