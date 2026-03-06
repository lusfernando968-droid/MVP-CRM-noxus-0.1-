alter table public.anamnesis 
add column if not exists birth_date date;
alter table public.anamnesis 
add column if not exists discovery_source text;
