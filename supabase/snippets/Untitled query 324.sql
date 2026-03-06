create table public.anamnesis (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null unique,
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

alter table public.anamnesis enable row level security;

create policy "Anyone can insert an anamnesis"
  on public.anamnesis for insert
  with check (true);

create policy "Users can view anamnesis of their clients"
  on public.anamnesis for select
  using (auth.uid() = user_id);

create policy "Users can update anamnesis of their clients"
  on public.anamnesis for update
  using (auth.uid() = user_id);

create trigger handle_updated_at before update on public.anamnesis
  for each row execute procedure moddatetime (updated_at);
