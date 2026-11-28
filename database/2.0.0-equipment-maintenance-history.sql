-- AquaProFish 2.0.0: histórico de manutenção dos equipamentos
create table if not exists public.equipment_maintenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  equipment_id uuid not null,
  maintained_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  constraint equipment_maintenance_owner_fk
    foreign key (equipment_id,user_id) references public.equipment(id,user_id) on delete cascade
);
create index if not exists equipment_maintenance_equipment_date_idx
  on public.equipment_maintenance(equipment_id,user_id,maintained_at desc);
create index if not exists equipment_maintenance_user_date_idx
  on public.equipment_maintenance(user_id,maintained_at desc);
alter table public.equipment_maintenance enable row level security;
drop policy if exists "Users can view own equipment maintenance" on public.equipment_maintenance;
drop policy if exists "Users can insert own equipment maintenance" on public.equipment_maintenance;
drop policy if exists "Users can update own equipment maintenance" on public.equipment_maintenance;
drop policy if exists "Users can delete own equipment maintenance" on public.equipment_maintenance;
create policy "Users can view own equipment maintenance" on public.equipment_maintenance for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can insert own equipment maintenance" on public.equipment_maintenance for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update own equipment maintenance" on public.equipment_maintenance for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own equipment maintenance" on public.equipment_maintenance for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.equipment_maintenance to authenticated;
