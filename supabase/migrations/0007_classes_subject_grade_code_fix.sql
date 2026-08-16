-- =========================================================
-- MIGRATION 0007: CLASSES COLUMNS & PUBLIC_CODE DEFAULT FIX
-- Adds missing subject, grade_level columns to classes
-- Sets default generator for classes.public_code
-- =========================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'subject'
  ) then
    alter table public.classes add column subject text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'grade_level'
  ) then
    alter table public.classes add column grade_level text null;
  end if;

  -- Set default value for public_code so inserts without public_code generate one automatically
  alter table public.classes alter column public_code set default ('CLS-' || upper(substr(md5(random()::text), 1, 8)));
end;
$$;
