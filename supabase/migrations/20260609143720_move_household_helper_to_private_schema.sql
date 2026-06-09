-- MI-10 follow-up: move current_household_id() out of the API-exposed `public`
-- schema into a `private` schema.
--
-- As a SECURITY DEFINER function in `public`, it was callable directly via
-- PostgREST (/rest/v1/rpc/current_household_id) — flagged by the database
-- linter. It can't be SECURITY INVOKER (that recurses on the members policy)
-- and `authenticated` must keep EXECUTE for policy evaluation, so the fix is to
-- relocate it to a schema PostgREST doesn't expose. Policies still reference it.
--
-- Dropping the public function cascades its dependent policies, which are
-- recreated below pointing at private.current_household_id().
drop function if exists public.current_household_id() cascade;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.members where auth_user_id = (select auth.uid())
$$;
revoke all on function private.current_household_id() from public;
grant execute on function private.current_household_id() to authenticated;

create policy households_select on public.households
  for select to authenticated
  using (id = private.current_household_id());

create policy members_select on public.members
  for select to authenticated
  using (household_id = private.current_household_id());

create policy settings_select on public.settings
  for select to authenticated
  using (household_id = private.current_household_id());
create policy settings_update on public.settings
  for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());

create policy day_entries_select on public.day_entries
  for select to authenticated
  using (household_id = private.current_household_id());
create policy day_entries_insert on public.day_entries
  for insert to authenticated
  with check (household_id = private.current_household_id());
create policy day_entries_update on public.day_entries
  for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());
create policy day_entries_delete on public.day_entries
  for delete to authenticated
  using (household_id = private.current_household_id());

create policy intercourse_events_select on public.intercourse_events
  for select to authenticated
  using (household_id = private.current_household_id());
create policy intercourse_events_insert on public.intercourse_events
  for insert to authenticated
  with check (household_id = private.current_household_id());
create policy intercourse_events_update on public.intercourse_events
  for update to authenticated
  using (household_id = private.current_household_id())
  with check (household_id = private.current_household_id());
create policy intercourse_events_delete on public.intercourse_events
  for delete to authenticated
  using (household_id = private.current_household_id());
