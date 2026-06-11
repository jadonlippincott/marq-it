-- MI-12: second-spouse onboarding via single-use, expiring invite codes.
--
-- Member #1 generates an invite for their household (assigned the unfilled
-- role); the second spouse signs up with their own login and redeems it to
-- become member #2. The unique(household_id, role) constraint (MI-9) plus an
-- explicit member-count guard cap a household at two members and reject a third
-- join. All mutations go through SECURITY DEFINER RPCs; the table itself is
-- read-only to members via RLS.

create table public.household_invites (
  code text primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  role public.member_role not null,
  created_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references public.members (id) on delete set null
);
create index household_invites_household_idx on public.household_invites (household_id);

alter table public.household_invites enable row level security;

-- Members can read their own household's invites (to display/track the code).
-- Creation/redemption is handled only by the SECURITY DEFINER RPCs below.
create policy household_invites_select on public.household_invites
  for select to authenticated
  using (household_id = private.current_household_id());

-- create_household_invite -----------------------------------------------------
-- For an authenticated member: mint a single-use code for their household,
-- assigned the role they themselves do NOT hold, valid for 7 days. Any prior
-- unredeemed invite for the household is replaced (one active invite at a time).
create function public.create_household_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_member_id uuid;
  v_household_id uuid;
  v_my_role public.member_role;
  v_target_role public.member_role;
  v_code text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select id, household_id, role
    into v_member_id, v_household_id, v_my_role
    from public.members
   where auth_user_id = v_uid;
  if v_household_id is null then
    raise exception 'caller is not a household member' using errcode = '42501';
  end if;

  if (select count(*) from public.members where household_id = v_household_id) >= 2 then
    raise exception 'household already has two members' using errcode = '23505';
  end if;

  v_target_role := case
    when v_my_role = 'wife' then 'husband'::public.member_role
    else 'wife'::public.member_role
  end;

  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));

  delete from public.household_invites
   where household_id = v_household_id and redeemed_at is null;

  insert into public.household_invites (code, household_id, role, created_by, expires_at)
  values (v_code, v_household_id, v_target_role, v_member_id, now() + interval '7 days');

  return v_code;
end;
$$;
revoke all on function public.create_household_invite() from public, anon;
grant execute on function public.create_household_invite() to authenticated;

-- redeem_household_invite ------------------------------------------------------
-- For a freshly-signed-up authenticated user with no household: validate the
-- code and join their household as member #2 with the invite's role.
create function public.redeem_household_invite(p_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite public.household_invites;
  v_member_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if coalesce(btrim(p_display_name), '') = '' then
    raise exception 'display_name is required' using errcode = '22023';
  end if;
  if exists (select 1 from public.members where auth_user_id = v_uid) then
    raise exception 'user already belongs to a household' using errcode = '23505';
  end if;

  select * into v_invite
    from public.household_invites
   where code = upper(btrim(p_code))
   for update;

  if v_invite.code is null then
    raise exception 'invalid invite code' using errcode = '22023';
  end if;
  if v_invite.redeemed_at is not null then
    raise exception 'invite has already been used' using errcode = '22023';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'invite has expired' using errcode = '22023';
  end if;
  if (select count(*) from public.members where household_id = v_invite.household_id) >= 2 then
    raise exception 'household already has two members' using errcode = '23505';
  end if;

  insert into public.members (household_id, auth_user_id, display_name, role)
  values (v_invite.household_id, v_uid, btrim(p_display_name), v_invite.role)
  returning id into v_member_id;

  update public.household_invites
     set redeemed_at = now(), redeemed_by = v_member_id
   where code = v_invite.code;

  return v_invite.household_id;
end;
$$;
revoke all on function public.redeem_household_invite(text, text) from public, anon;
grant execute on function public.redeem_household_invite(text, text) to authenticated;
