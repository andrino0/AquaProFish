-- AquaProFish 2.0.0 — reprodução e acompanhamento de alevinos
-- Migração aditiva: cria tabelas novas sem alterar aquários, peixes ou tarefas existentes.
create table if not exists public.breeding_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aquarium_id uuid,
  species text not null,
  variety text,
  birth_date date not null default current_date,
  fry_count integer not null default 0 check (fry_count >= 0),
  female_parent text,
  male_parent text,
  notes text,
  created_at timestamptz not null default now(),
  constraint breeding_batches_id_user_unique unique (id, user_id),
  constraint breeding_batches_aquarium_owner_fk foreign key (aquarium_id, user_id)
    references public.aquariums(id, user_id) on delete set null (aquarium_id)
);
create table if not exists public.fry_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null,
  observed_at date not null default current_date,
  quantity integer not null check (quantity >= 0),
  average_size_mm numeric check (average_size_mm is null or average_size_mm >= 0),
  food text,
  notes text,
  created_at timestamptz not null default now(),
  constraint fry_observations_batch_owner_fk foreign key (batch_id, user_id)
    references public.breeding_batches(id, user_id) on delete cascade
);
create index if not exists breeding_batches_user_birth_idx on public.breeding_batches(user_id, birth_date desc);
create index if not exists breeding_batches_aquarium_user_idx on public.breeding_batches(aquarium_id, user_id);
create index if not exists fry_observations_batch_date_idx on public.fry_observations(batch_id, observed_at desc);
create index if not exists fry_observations_user_date_idx on public.fry_observations(user_id, observed_at desc);
alter table public.breeding_batches enable row level security;
alter table public.fry_observations enable row level security;
drop policy if exists "Users manage their breeding batches" on public.breeding_batches;
create policy "Users manage their breeding batches" on public.breeding_batches for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users manage their fry observations" on public.fry_observations;
create policy "Users manage their fry observations" on public.fry_observations for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
