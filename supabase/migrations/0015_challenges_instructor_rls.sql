-- =========================================================
-- MIGRATION 0015: CHALLENGES RLS FOR INSTRUCTORS
-- Ensures authenticated instructors can insert and manage challenges
-- =========================================================

drop policy if exists "Instructors manage challenges" on public.challenges;
create policy "Instructors manage challenges"
  on public.challenges for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
