-- MI-10: Row-Level Security policies.
--
-- RLS was enabled in MI-9 (deny-all). This adds household-scoping policies so a
-- member can only read/write rows belonging to their own household — the core
-- privacy guarantee for this health data.
--
-- All policies target the `authenticated` role; the `anon` role (publishable
-- key, no session) matches nothing and stays fully locked out.
--
-- NOTE: this migration creates the helper in `public`; the follow-up migration
-- move_household_helper_to_private_schema relocates it to a non-exposed schema
-- so it isn't callable via the REST API. (Kept as two steps to mirror how the
-- change was rolled out.)

-- Resolve the caller's household. SECURITY DEFINER so the lookup bypasses RLS —
-- without that, the members SELECT policy would recurse on itself. A member
-- maps to exactly one household (members.auth_user_id is unique).
create function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.members where auth_user_id = (select auth.uid())
$$;

revoke all on function public.current_household_id() from public;
grant execute on function public.current_household_id() to authenticated;

-- households — read your own. Creation is handled by a SECURITY DEFINER RPC in
-- the account-creation work (MI-11/12); no end-user write path here.
create policy households_select on public.households
  for select to authenticated
  using (id = public.current_household_id());

-- members — read yourself and your spouse. Membership creation / spouse-join is
-- handled by the definer RPC (MI-11/12).
create policy members_select on public.members
  for select to authenticated
  using (household_id = public.current_household_id());

-- settings — read + update within your household (reset time, timezone,
-- protocol). The row is created with the household by the signup RPC.
create policy settings_select on public.settings
  for select to authenticated
  using (household_id = public.current_household_id());
create policy settings_update on public.settings
  for update to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- day_entries — full CRUD within your household. The unique(household_id,
-- chart_date) constraint from MI-9 enforces the one-reading-per-day rule.
create policy day_entries_select on public.day_entries
  for select to authenticated
  using (household_id = public.current_household_id());
create policy day_entries_insert on public.day_entries
  for insert to authenticated
  with check (household_id = public.current_household_id());
create policy day_entries_update on public.day_entries
  for update to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());
create policy day_entries_delete on public.day_entries
  for delete to authenticated
  using (household_id = public.current_household_id());

-- intercourse_events — full CRUD within your household. Unrestricted count.
create policy intercourse_events_select on public.intercourse_events
  for select to authenticated
  using (household_id = public.current_household_id());
create policy intercourse_events_insert on public.intercourse_events
  for insert to authenticated
  with check (household_id = public.current_household_id());
create policy intercourse_events_update on public.intercourse_events
  for update to authenticated
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());
create policy intercourse_events_delete on public.intercourse_events
  for delete to authenticated
  using (household_id = public.current_household_id());
