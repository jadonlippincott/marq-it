-- MI-9: pin the trigger function's search_path.
--
-- Addresses the `function_search_path_mutable` linter warning: a function with a
-- mutable search_path can be hijacked by objects in a caller-controlled schema.
-- The function only uses now() (pg_catalog, always resolvable), so an empty
-- search_path is safe.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
