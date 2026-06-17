-- MI-15: enable Realtime on day_entries so the once-per-day shared reading lock
-- syncs across both spouses' devices in near-real-time. Row-Level Security still
-- scopes which changes each member receives (only their own household's).
--
-- replica identity full ensures UPDATE/DELETE payloads carry the full old row so
-- RLS can be evaluated for those events too.
alter table public.day_entries replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'day_entries'
  ) then
    alter publication supabase_realtime add table public.day_entries;
  end if;
end $$;
