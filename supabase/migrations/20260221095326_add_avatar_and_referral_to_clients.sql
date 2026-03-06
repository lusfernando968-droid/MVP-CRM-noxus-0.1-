-- Add avatar_url and referred_by_id to clients table
ALTER TABLE public.nx_clients
ADD COLUMN avatar_url TEXT,
ADD COLUMN referred_by_id UUID REFERENCES public.nx_clients(id) ON DELETE SET NULL;
