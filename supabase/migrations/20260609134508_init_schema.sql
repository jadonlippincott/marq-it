-- MI-9: core charting schema for MarqIt.
--
-- Models a household shared by up to two members (wife + husband), the single
-- shared Low/High/Peak reading per charting day, unrestricted intercourse
-- events, and per-household settings (reset time, timezone, protocol).
--
-- RLS is ENABLED on every table here with NO policies — that is deny-all by
-- default, so health data is never reachable via the publishable key until
-- MI-10 defines the household-scoped policies.

-- Enums ----------------------------------------------------------------------
create type reading_type as enum ('low', 'high', 'peak');
create type member_role as enum ('wife', 'husband');
create type protocol as enum ('nursing_mother', 'transition_to_period', 'regular_cycle');

-- updated_at trigger helper --------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Households -----------------------------------------------------------------
create table households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Members --------------------------------------------------------------------
-- unique(household_id, role) caps a household at two members (one of each role)
-- and enforces the "exactly two per household" domain rule. Each auth user maps
-- to a single membership.
create table members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  role member_role not null,
  created_at timestamptz not null default now(),
  unique (household_id, role),
  unique (auth_user_id)
);
create index members_household_idx on members (household_id);

-- Settings -------------------------------------------------------------------
create table settings (
  household_id uuid primary key references households (id) on delete cascade,
  reset_time time not null default '04:00',
  timezone text not null default 'America/New_York',
  protocol protocol not null default 'nursing_mother',
  updated_at timestamptz not null default now()
);
create trigger settings_set_updated_at
  before update on settings
  for each row execute function set_updated_at();

-- Day entries ----------------------------------------------------------------
-- One shared Low/High/Peak reading per charting day. chart_date is the
-- reset-adjusted local date, computed client-side from settings.reset_time +
-- timezone (see MI-18). unique(household_id, chart_date) enforces the
-- once-per-day-per-household rule across both spouses.
-- recorded_by / updated_by are nullable with ON DELETE SET NULL so removing a
-- member preserves the household's shared entries (light audit).
create table day_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  chart_date date not null,
  reading reading_type not null,
  recorded_by uuid references members (id) on delete set null,
  updated_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, chart_date)
);
create index day_entries_household_date_idx on day_entries (household_id, chart_date);
create trigger day_entries_set_updated_at
  before update on day_entries
  for each row execute function set_updated_at();

-- Intercourse events ---------------------------------------------------------
-- Unrestricted: many per charting day.
create table intercourse_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  recorded_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);
create index intercourse_events_household_time_idx
  on intercourse_events (household_id, occurred_at);

-- Lock everything down until MI-10 defines RLS policies ----------------------
alter table households enable row level security;
alter table members enable row level security;
alter table settings enable row level security;
alter table day_entries enable row level security;
alter table intercourse_events enable row level security;
