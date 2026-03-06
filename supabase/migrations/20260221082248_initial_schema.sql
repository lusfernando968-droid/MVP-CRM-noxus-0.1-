-- Create profiles table
CREATE TABLE IF NOT EXISTS public.nx_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.nx_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  instagram TEXT,
  age INTEGER,
  sessions INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.nx_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.nx_clients ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL
);

-- Create financial_transactions table
CREATE TABLE IF NOT EXISTS public.nx_financial_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  status TEXT NOT NULL DEFAULT 'Pago',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  appointment_id UUID REFERENCES public.nx_appointments ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.nx_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_financial_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.nx_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.nx_profiles FOR UPDATE USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Users can view own clients" ON public.nx_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own clients" ON public.nx_clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.nx_clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.nx_clients FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON public.nx_appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own appointments" ON public.nx_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.nx_appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON public.nx_appointments FOR DELETE USING (auth.uid() = user_id);

-- Financial transactions policies
CREATE POLICY "Users can view own transactions" ON public.nx_financial_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.nx_financial_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.nx_financial_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.nx_financial_transactions FOR DELETE USING (auth.uid() = user_id);
