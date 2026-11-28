-- AquaProFish 2.0.0: saúde, equipamentos, despesas e diário de fotos
-- Todas as tabelas têm RLS por usuário. Fotos pessoais ficam em bucket privado;
-- fotos compartilhadas em publicações usam bucket público com upload limitado ao dono.

create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aquarium_id uuid null,
  recorded_at timestamptz not null default now(),
  fish_name text,
  symptoms text not null,
  treatment text,
  medication text,
  status text not null default 'observando' check (status in ('observando','tratamento','recuperado')),
  notes text,
  created_at timestamptz not null default now(),
  constraint health_records_aquarium_owner_fk foreign key (aquarium_id,user_id)
    references public.aquariums(id,user_id) on delete set null (aquarium_id)
);
create index if not exists health_records_user_recorded_idx on public.health_records(user_id,recorded_at desc);
alter table public.health_records enable row level security;
create policy "Users can view own health records" on public.health_records for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can insert own health records" on public.health_records for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update own health records" on public.health_records for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own health records" on public.health_records for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.health_records to authenticated;

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aquarium_id uuid null,
  name text not null,
  category text not null default 'other' check (category in ('filter','heater','lighting','pump','uv','co2','other')),
  brand_model text,
  installed_at date,
  maintenance_interval_days integer check (maintenance_interval_days is null or maintenance_interval_days between 1 and 3650),
  last_maintenance_at date,
  notes text,
  created_at timestamptz not null default now(),
  constraint equipment_aquarium_owner_fk foreign key (aquarium_id,user_id)
    references public.aquariums(id,user_id) on delete set null (aquarium_id),
  constraint equipment_id_user_key unique (id,user_id)
);
create index if not exists equipment_user_aquarium_idx on public.equipment(user_id,aquarium_id);
alter table public.equipment enable row level security;
create policy "Users can view own equipment" on public.equipment for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can insert own equipment" on public.equipment for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update own equipment" on public.equipment for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own equipment" on public.equipment for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.equipment to authenticated;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aquarium_id uuid null,
  equipment_id uuid null,
  description text not null,
  category text not null default 'other' check (category in ('equipment','food','medicine','fish','maintenance','other')),
  amount numeric(12,2) not null check (amount > 0),
  spent_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  constraint expenses_aquarium_owner_fk foreign key (aquarium_id,user_id)
    references public.aquariums(id,user_id) on delete set null (aquarium_id),
  constraint expenses_equipment_owner_fk foreign key (equipment_id,user_id)
    references public.equipment(id,user_id) on delete set null (equipment_id)
);
create index if not exists expenses_user_spent_idx on public.expenses(user_id,spent_at desc);
alter table public.expenses enable row level security;
create policy "Users can view own expenses" on public.expenses for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can insert own expenses" on public.expenses for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update own expenses" on public.expenses for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own expenses" on public.expenses for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.expenses to authenticated;

create table if not exists public.photo_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aquarium_id uuid null,
  image_path text not null,
  caption text,
  taken_at date not null default current_date,
  created_at timestamptz not null default now(),
  constraint photo_journal_aquarium_owner_fk foreign key (aquarium_id,user_id)
    references public.aquariums(id,user_id) on delete set null (aquarium_id)
);
create index if not exists photo_journal_user_taken_idx on public.photo_journal(user_id,taken_at desc);
alter table public.photo_journal enable row level security;
create policy "Users can view own photo journal" on public.photo_journal for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can insert own photo journal" on public.photo_journal for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can delete own photo journal" on public.photo_journal for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,delete on public.photo_journal to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('aquaprofish-journal','aquaprofish-journal',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('aquaprofish-community','aquaprofish-community',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create policy "Users can read own AquaProFish journal photos" on storage.objects for select to authenticated
using (bucket_id='aquaprofish-journal' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can upload own AquaProFish journal photos" on storage.objects for insert to authenticated
with check (bucket_id='aquaprofish-journal' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can delete own AquaProFish journal photos" on storage.objects for delete to authenticated
using (bucket_id='aquaprofish-journal' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can upload own AquaProFish community photos" on storage.objects for insert to authenticated
with check (bucket_id='aquaprofish-community' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can update own AquaProFish community photos" on storage.objects for update to authenticated
using (bucket_id='aquaprofish-community' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='aquaprofish-community' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Users can delete own AquaProFish community photos" on storage.objects for delete to authenticated
using (bucket_id='aquaprofish-community' and (storage.foldername(name))[1]=(select auth.uid())::text);
