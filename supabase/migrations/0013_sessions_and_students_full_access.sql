-- =========================================================
-- MIGRATION 0013: FULL RLS PERMISSIONS FOR SESSIONS, STUDENTS, AND CLASSES
-- Grants all authenticated instructors unobstructed access to manage sessions, classes, and students
-- =========================================================

-- 1. Full access for sessions
drop policy if exists "Instructors manage sessions" on public.sessions;
drop policy if exists "Tenant organization read sessions" on public.sessions;
create policy "Instructors manage sessions"
  on public.sessions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 2. Full access for students
drop policy if exists "Instructors manage own students" on public.students;
create policy "Instructors manage own students"
  on public.students for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 3. Full access for classes
drop policy if exists "Instructors manage own classes" on public.classes;
create policy "Instructors manage own classes"
  on public.classes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 4. Full access for class_members
drop policy if exists "Instructors manage class members" on public.class_members;
create policy "Instructors manage class members"
  on public.class_members for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
