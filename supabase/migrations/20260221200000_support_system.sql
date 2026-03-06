-- 1. Create support_messages table
CREATE TABLE IF NOT EXISTS public.nx_support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_from_support BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.nx_support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_messages
-- 1. Usuários podem ver suas próprias mensagens
CREATE POLICY "Users can view own support messages" 
ON public.nx_support_messages FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Usuários podem enviar suas próprias mensagens
CREATE POLICY "Users can send support messages" 
ON public.nx_support_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Admins podem ver todas as mensagens
CREATE POLICY "Admins can view all support messages" 
ON public.nx_support_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- 4. Admins podem enviar respostas
CREATE POLICY "Admins can send support responses" 
ON public.nx_support_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);
