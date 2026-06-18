-- MI-16: enable Realtime on intercourse_events so the per-day intercourse tally
-- syncs across both spouses' devices in near-real-time, mirroring day_entries
-- (MI-15). Row-Level Security still scopes which changes each member receives
-- (only their own household's).
--
-- replica identity full ensures UPDATE/DELETE payloads carry the full old row so
-- RLS can be evaluated for those events too.
alter table public.intercourse_events replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'intercourse_events'
  ) then
    alter publication supabase_realtime add table public.intercourse_events;
  end if;
end $$;
