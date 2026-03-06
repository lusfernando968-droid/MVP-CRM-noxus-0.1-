-- Criação da tabela de suporte para comunicação interna
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_support BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to view their own messages') THEN
        CREATE POLICY "Allow users to view their own messages" ON public.support_messages 
        FOR SELECT USING (
            auth.uid() = user_id OR 
            (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to insert their own messages') THEN
        CREATE POLICY "Allow users to insert their own messages" ON public.support_messages 
        FOR INSERT WITH CHECK (
            auth.uid() = user_id OR 
            (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
        );
    END IF;
END $$;
