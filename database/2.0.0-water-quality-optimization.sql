-- Ajustes de desempenho e avaliação RLS da tabela water_tests.
create index if not exists water_tests_aquarium_user_idx
  on public.water_tests(aquarium_id, user_id);

drop policy if exists "Users manage own water tests" on public.water_tests;
create policy "Users manage own water tests"
  on public.water_tests for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
