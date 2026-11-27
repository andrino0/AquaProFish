-- AquaProFish - estrutura inicial do banco de dados
-- Execute este arquivo uma única vez no Supabase SQL Editor.
-- As tabelas de dados pertencem a cada usuário autenticado.
-- Publicações da comunidade podem ser lidas por usuários autenticados.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.aquariums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  volume_liters numeric,
  description text,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.fish (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aquarium_id uuid,
  name text not null,
  species text,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  created_at timestamptz not null default now(),
  constraint fish_aquarium_owner_fk
    foreign key (aquarium_id, user_id)
    references public.aquariums(id, user_id)
    on delete cascade
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date timestamptz,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.aquariums enable row level security;
alter table public.fish enable row level security;
alter table public.tasks enable row level security;
alter table public.posts enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users manage own aquariums" on public.aquariums;
create policy "Users manage own aquariums"
on public.aquariums for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own fish" on public.fish;
create policy "Users manage own fish"
on public.fish for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own tasks" on public.tasks;
create policy "Users manage own tasks"
on public.tasks for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read posts" on public.posts;
create policy "Authenticated users can read posts"
on public.posts for select to authenticated
using (true);

drop policy if exists "Users can create own posts" on public.posts;
create policy "Users can create own posts"
on public.posts for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts"
on public.posts for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts"
on public.posts for delete to authenticated
using (auth.uid() = user_id);

commit;
