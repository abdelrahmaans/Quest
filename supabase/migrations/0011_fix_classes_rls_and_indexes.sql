-- =========================================================
-- MIGRATION 0011: FIX CLASSES AND STUDENTS RLS ACCESS
-- Ensures authenticated instructors can read and manage all their classes and students
-- =========================================================

-- 1. Classes RLS
drop policy if exists "Instructors manage own classes" on public.classes;
create policy "Instructors manage own classes"
  on public.classes for all
  using (
    auth.role() = 'authenticated'
    or instructor_id = auth.uid()
    or is_admin()
  )
  with check (
    auth.role() = 'authenticated'
    or instructor_id = auth.uid()
    or is_admin()
  );

-- 2. Students RLS
drop policy if exists "Instructors manage own students" on public.students;
create policy "Instructors manage own students"
  on public.students for all
  using (
    auth.role() = 'authenticated'
    or instructor_id = auth.uid()
    or is_admin()
  )
  with check (
    auth.role() = 'authenticated'
    or instructor_id = auth.uid()
    or is_admin()
  );
