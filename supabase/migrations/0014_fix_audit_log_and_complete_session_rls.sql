-- =========================================================
-- MIGRATION 0014: AUDIT LOG RLS FOR INSTRUCTORS
-- Allows authenticated instructors to insert audit logs on session completion
-- =========================================================

drop policy if exists "Instructors insert audit_log" on public.audit_log;
create policy "Instructors insert audit_log"
  on public.audit_log for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Instructors read own audit_log" on public.audit_log;
create policy "Instructors read own audit_log"
  on public.audit_log for select
  using (auth.role() = 'authenticated' or actor_id = auth.uid() or is_admin());
