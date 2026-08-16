-- =========================================================
-- MIGRATION 0009: SESSIONS & ATTENDANCE RLS
-- Grants instructors permission to manage sessions and attendance
-- =========================================================

-- 1. Attendance RLS Policies
drop policy if exists "Instructors manage attendance" on public.attendance;
create policy "Instructors manage attendance"
  on public.attendance for all
  using (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.sessions s
      join public.classes c on c.id = s.class_id
      where s.id = attendance.session_id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
  )
  with check (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.sessions s
      join public.classes c on c.id = s.class_id
      where s.id = attendance.session_id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
  );

-- 2. Sessions RLS Policies
drop policy if exists "Instructors manage sessions" on public.sessions;
create policy "Instructors manage sessions"
  on public.sessions for all
  using (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.classes c
      where c.id = sessions.class_id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
  )
  with check (
    auth.role() = 'authenticated'
    or exists (
      select 1 from public.classes c
      where c.id = sessions.class_id
        and c.instructor_id = auth.uid()
    )
    or is_admin()
  );
