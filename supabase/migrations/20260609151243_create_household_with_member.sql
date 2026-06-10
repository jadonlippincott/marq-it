-- MI-11: bootstrap RPC for sign-up.
--
-- A brand-new user has no membership yet, so the SELECT-only RLS on households/
-- members (MI-10) blocks them from creating their own household directly. This
-- SECURITY DEFINER function does it atomically on their behalf: household +
-- default settings + the creator's member row, all for the calling auth user.
--
-- SECURITY DEFINER is intentional and the function is deliberately exposed to
-- `authenticated` via RPC (this is the sign-up entry point). It is NOT granted
-- to `anon` — an unauthenticated caller has no auth.uid() and is rejected.
create function public.create_household_with_member(
  p_display_name text,
  p_role public.member_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_household_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if coalesce(btrim(p_display_name), '') = '' then
    raise exception 'display_name is required' using errcode = '22023';
  end if;

  -- One membership per user (also enforced by members.auth_user_id unique).
  if exists (select 1 from public.members where auth_user_id = v_uid) then
    raise exception 'user already belongs to a household' using errcode = '23505';
  end if;

  insert into public.households default values returning id into v_household_id;
  insert into public.settings (household_id) values (v_household_id);
  insert into public.members (household_id, auth_user_id, display_name, role)
    values (v_household_id, v_uid, btrim(p_display_name), p_role);

  return v_household_id;
end;
$$;

revoke all on function public.create_household_with_member(text, public.member_role) from public;
revoke all on function public.create_household_with_member(text, public.member_role) from anon;
grant execute on function public.create_household_with_member(text, public.member_role) to authenticated;
