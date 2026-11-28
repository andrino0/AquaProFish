-- AquaProFish 2.0.0 — histórico de qualidade da água
-- Migração aditiva: não altera nem remove registros existentes.

create table if not exists public.water_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aquarium_id uuid,
  tested_at timestamptz not null default now(),
  temperature numeric(5,2),
  ph numeric(4,2) check (ph is null or (ph >= 0 and ph <= 14)),
  ammonia numeric(8,3) check (ammonia is null or ammonia >= 0),
  nitrite numeric(8,3) check (nitrite is null or nitrite >= 0),
  nitrate numeric(8,3) check (nitrate is null or nitrate >= 0),
  notes text,
  created_at timestamptz not null default now(),
  constraint water_tests_aquarium_owner_fk
    foreign key (aquarium_id, user_id)
    references public.aquariums(id, user_id)
    on delete cascade,
  constraint water_tests_has_measurement
    check (temperature is not null or ph is not null or ammonia is not null or nitrite is not null or nitrate is not null)
);

create index if not exists water_tests_user_tested_at_idx
  on public.water_tests(user_id, tested_at desc);

alter table public.water_tests enable row level security;

drop policy if exists "Users manage own water tests" on public.water_tests;
create policy "Users manage own water tests"
  on public.water_tests for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.water_tests to authenticated;
