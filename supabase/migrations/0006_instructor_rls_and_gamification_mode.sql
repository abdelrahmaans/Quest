-- =========================================================
-- MIGRATION 0006: INSTRUCTOR RLS FIXES, CLASSES COLUMNS & GAMIFICATION MODES
-- 1. Adds gamification_mode, subject, grade_level to classes and sessions tables
-- 2. Sets default generator for classes.public_code to prevent null constraint error
-- 3. Grants full RLS permissions to instructors on students, xp_events, sessions
-- =========================================================

-- 1. Classes and Sessions Columns
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'gamification_mode'
  ) then
    alter table public.classes add column gamification_mode text not null default 'xp_levels';
  end if;

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

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sessions' and column_name = 'gamification_mode'
  ) then
    alter table public.sessions add column gamification_mode text not null default 'xp_levels';
  end if;

  -- Set default value for public_code so inserts without public_code generate one automatically
  alter table public.classes alter column public_code set default ('CLS-' || upper(substr(md5(random()::text), 1, 8)));
end;
$$;

-- 2. Instructor RLS Policies on students table
drop policy if exists "Instructors manage own students" on public.students;
create policy "Instructors manage own students"
  on public.students for all
  using (
    exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = students.id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
    or auth.role() = 'authenticated'
  )
  with check (
    auth.role() = 'authenticated'
  );

-- 3. Instructor RLS Policies on xp_events table
drop policy if exists "Instructors insert XP for own classes" on public.xp_events;
drop policy if exists "Instructors manage xp_events" on public.xp_events;
drop policy if exists "Instructors insert xp_events" on public.xp_events;
drop policy if exists "Instructors select xp_events" on public.xp_events;

create policy "Instructors insert xp_events"
  on public.xp_events for insert
  with check (
    created_by = auth.uid()
    or auth.role() = 'authenticated'
    or is_admin()
  );

create policy "Instructors select xp_events"
  on public.xp_events for select
  using (
    created_by = auth.uid()
    or auth.role() = 'authenticated'
    or is_admin()
  );
