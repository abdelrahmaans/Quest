-- =========================================================
-- MIGRATION 0008: STUDENTS SCHEMA ALIGNMENT & RLS
-- Adds class_id, instructor_id, xp_total, level, streaks to students table
-- Ensures direct queries by class_id and instructor_id work with 200 OK
-- =========================================================

do $$
begin
  -- 1. class_id
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'class_id'
  ) then
    alter table public.students
      add column class_id uuid null references public.classes(id) on delete set null;
  end if;

  -- 2. instructor_id
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'instructor_id'
  ) then
    alter table public.students
      add column instructor_id uuid null references public.profiles(id) on delete set null;
  end if;

  -- 3. xp_total
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'xp_total'
  ) then
    alter table public.students
      add column xp_total integer not null default 0;
  end if;

  -- 4. level
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'level'
  ) then
    alter table public.students
      add column level integer not null default 1;
  end if;

  -- 5. current_streak
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'current_streak'
  ) then
    alter table public.students
      add column current_streak integer not null default 0;
  end if;

  -- 6. highest_streak
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'highest_streak'
  ) then
    alter table public.students
      add column highest_streak integer not null default 0;
  end if;

  -- 7. Default for public_code on students
  alter table public.students alter column public_code set default ('STD-' || upper(substr(md5(random()::text), 1, 8)));
end;
$$;

-- 8. Refresh RLS policies for students table with instructor_id column
drop policy if exists "Instructors manage own students" on public.students;
create policy "Instructors manage own students"
  on public.students for all
  using (
    auth.uid() = instructor_id
    or exists (
      select 1 from public.classes c
      where c.id = students.class_id
        and c.instructor_id = auth.uid()
    )
    or exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = students.id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
    or auth.role() = 'authenticated'
  )
  with check (
    auth.uid() = instructor_id
    or exists (
      select 1 from public.classes c
      where c.id = students.class_id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
    or auth.role() = 'authenticated'
  );
