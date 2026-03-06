create table public.nx_anamnesis (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.nx_clients(id) on delete cascade not null unique,
  user_id uuid references auth.users(id) on delete cascade not null,
  medical_history jsonb not null default '{}'::jsonb,
  allergies text,
  medications text,
  emergency_contact text,
  has_contract_signed boolean default false,
  signed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- set up row level security
alter table public.nx_anamnesis enable row level security;

-- Policies

-- Public can insert (so clients can fill the form via public link)
create policy "Anyone can insert an anamnesis"
  on public.nx_anamnesis for insert
  with check (true);

-- Users can read their own clients' anamnesis
create policy "Users can view anamnesis of their clients"
  on public.nx_anamnesis for select
  using (auth.uid() = user_id);

-- Users can update their own clients' anamnesis
create policy "Users can update anamnesis of their clients"
  on public.nx_anamnesis for update
  using (auth.uid() = user_id);

-- Trigger to update updated_at column
create trigger handle_updated_at before update on public.nx_anamnesis
  for each row execute procedure moddatetime (updated_at);
