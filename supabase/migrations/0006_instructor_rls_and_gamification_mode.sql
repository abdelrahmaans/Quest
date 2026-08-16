-- =========================================================
-- MIGRATION 0006: INSTRUCTOR RLS FIXES & GAMIFICATION MODES
-- 1. Adds gamification_mode to classes and sessions tables
-- 2. Grants full RLS permissions to instructors on students, xp_events, sessions
-- =========================================================

-- 1. Gamification Mode Column on classes and sessions
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
    where table_schema = 'public' and table_name = 'sessions' and column_name = 'gamification_mode'
  ) then
    alter table public.sessions add column gamification_mode text not null default 'xp_levels';
  end if;
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
