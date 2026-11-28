-- AquaProFish 2.0.0 — categorias e vínculo das tarefas
-- Migração aditiva: preserva as tarefas existentes.

alter table public.tasks
  add column if not exists category text not null default 'other',
  add column if not exists aquarium_id uuid;

alter table public.tasks
  drop constraint if exists tasks_category_check;

alter table public.tasks
  add constraint tasks_category_check
  check (category = any (array[
    'tpa','feeding','filter_cleaning','media_replacement',
    'water_test','health','other'
  ]));

alter table public.tasks
  drop constraint if exists tasks_aquarium_owner_fk;

alter table public.tasks
  add constraint tasks_aquarium_owner_fk
  foreign key (aquarium_id, user_id)
  references public.aquariums(id, user_id)
  on delete cascade;

update public.tasks
set category = case
  when title ilike '%tpa%' or title ilike '%troca parcial%' or title ilike '%troca de água%' then 'tpa'
  when title ilike '%aliment%' or title ilike '%ração%' then 'feeding'
  when title ilike '%filtro%' or title ilike '%limpeza%' then 'filter_cleaning'
  when title ilike '%mídia%' or title ilike '%perlon%' or title ilike '%carvão ativado%' then 'media_replacement'
  when title ilike '%teste%' or title ilike '%ph%' or title ilike '%amônia%' or title ilike '%nitrito%' then 'water_test'
  when title ilike '%saúde%' or title ilike '%medic%' or title ilike '%observa%' then 'health'
  else 'other'
end
where category = 'other';

create index if not exists tasks_user_due_date_idx
  on public.tasks(user_id, due_date);

create index if not exists tasks_aquarium_user_idx
  on public.tasks(aquarium_id, user_id);
