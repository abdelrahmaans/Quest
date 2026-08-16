-- =========================================================
-- MIGRATION 0005: ADD CREATED_BY TO XP_EVENTS
-- Standardizes tracking of which user awarded/created the XP event
-- =========================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'xp_events'
      and column_name  = 'created_by'
  ) then
    alter table public.xp_events
      add column created_by uuid null references public.profiles(id) on delete set null;
  end if;
end;
$$;
