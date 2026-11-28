-- AquaProFish 2.0.0: índices para as chaves estrangeiras dos novos módulos
create index if not exists equipment_aquarium_owner_idx on public.equipment(aquarium_id,user_id);
create index if not exists expenses_aquarium_owner_idx on public.expenses(aquarium_id,user_id);
create index if not exists expenses_equipment_owner_idx on public.expenses(equipment_id,user_id);
create index if not exists health_records_aquarium_owner_idx on public.health_records(aquarium_id,user_id);
create index if not exists photo_journal_aquarium_owner_idx on public.photo_journal(aquarium_id,user_id);
create index if not exists fry_observations_batch_owner_idx on public.fry_observations(batch_id,user_id);
