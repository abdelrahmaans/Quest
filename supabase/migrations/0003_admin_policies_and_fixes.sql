-- =========================================================
-- MIGRATION 0003: ADMIN POLICIES, AUDIT LOG,
--                 ORGANIZATION COLUMN, XP_EVENTS FIX
-- Apply AFTER 0001 and 0002
-- =========================================================


-- =========================================================
-- SECTION 1: is_admin() HELPER FUNCTION
-- A stable, security-definer function that checks whether
-- the currently authenticated user has the 'admin' role in
-- public.profiles. Using security definer + stable allows
-- Postgres to inline/cache the result per query and prevents
-- RLS recursion (bypasses RLS on the profiles table lookup).
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


-- =========================================================
-- SECTION 2: ADMIN FULL-ACCESS POLICIES ON ALL TABLES
-- Each policy allows an authenticated admin to perform any
-- operation (SELECT / INSERT / UPDATE / DELETE) on the table.
-- We use FOR ALL with USING + WITH CHECK both calling
-- is_admin() so it covers every command type.
-- =========================================================

-- profiles
create policy "Admin full access profiles"
  on public.profiles for all
  using (is_admin())
  with check (is_admin());

-- age_profiles
create policy "Admin full access age_profiles"
  on public.age_profiles for all
  using (is_admin())
  with check (is_admin());

-- tracks
create policy "Admin full access tracks"
  on public.tracks for all
  using (is_admin())
  with check (is_admin());

-- students
create policy "Admin full access students"
  on public.students for all
  using (is_admin())
  with check (is_admin());

-- parents
create policy "Admin full access parents"
  on public.parents for all
  using (is_admin())
  with check (is_admin());

-- student_parents
create policy "Admin full access student_parents"
  on public.student_parents for all
  using (is_admin())
  with check (is_admin());

-- classes
create policy "Admin full access classes"
  on public.classes for all
  using (is_admin())
  with check (is_admin());

-- class_members
create policy "Admin full access class_members"
  on public.class_members for all
  using (is_admin())
  with check (is_admin());

-- levels
create policy "Admin full access levels"
  on public.levels for all
  using (is_admin())
  with check (is_admin());

-- sessions
create policy "Admin full access sessions"
  on public.sessions for all
  using (is_admin())
  with check (is_admin());

-- gamification_modules
create policy "Admin full access gamification_modules"
  on public.gamification_modules for all
  using (is_admin())
  with check (is_admin());

-- class_gamification
create policy "Admin full access class_gamification"
  on public.class_gamification for all
  using (is_admin())
  with check (is_admin());

-- session_gamification
create policy "Admin full access session_gamification"
  on public.session_gamification for all
  using (is_admin())
  with check (is_admin());

-- xp_events
create policy "Admin full access xp_events"
  on public.xp_events for all
  using (is_admin())
  with check (is_admin());

-- badges
create policy "Admin full access badges"
  on public.badges for all
  using (is_admin())
  with check (is_admin());

-- student_badges
create policy "Admin full access student_badges"
  on public.student_badges for all
  using (is_admin())
  with check (is_admin());

-- achievements
create policy "Admin full access achievements"
  on public.achievements for all
  using (is_admin())
  with check (is_admin());

-- student_achievements
create policy "Admin full access student_achievements"
  on public.student_achievements for all
  using (is_admin())
  with check (is_admin());

-- challenges
create policy "Admin full access challenges"
  on public.challenges for all
  using (is_admin())
  with check (is_admin());

-- challenge_assignments
create policy "Admin full access challenge_assignments"
  on public.challenge_assignments for all
  using (is_admin())
  with check (is_admin());

-- challenge_results
create policy "Admin full access challenge_results"
  on public.challenge_results for all
  using (is_admin())
  with check (is_admin());

-- attendance
create policy "Admin full access attendance"
  on public.attendance for all
  using (is_admin())
  with check (is_admin());

-- feedback
create policy "Admin full access feedback"
  on public.feedback for all
  using (is_admin())
  with check (is_admin());

-- gamification_suggestions
create policy "Admin full access gamification_suggestions"
  on public.gamification_suggestions for all
  using (is_admin())
  with check (is_admin());


-- =========================================================
-- SECTION 3: AUDIT LOG TABLE
-- Append-only event log. Writes come ONLY from server-side
-- functions (security definer). Regular users have zero
-- INSERT access. Only admins can SELECT.
-- =========================================================

create table public.audit_log (
  id          uuid        primary key default gen_random_uuid(),
  actor_id    uuid        references public.profiles(id),
  action      text        not null,
  entity      text        not null,
  entity_id   uuid,
  metadata    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Enable RLS immediately on creation
alter table public.audit_log enable row level security;

-- Only admins can read audit logs; no policy for INSERT/UPDATE/DELETE
-- means regular users have zero write access through the API.
create policy "Admin read audit_log"
  on public.audit_log for select
  using (is_admin());

-- Index for common query patterns
create index idx_audit_log_actor    on public.audit_log(actor_id);
create index idx_audit_log_entity   on public.audit_log(entity, entity_id);
create index idx_audit_log_created  on public.audit_log(created_at desc);


-- =========================================================
-- SECTION 4: ADD organization_id COLUMN
-- Nullable UUID with no FK constraint yet. The FK to a future
-- organizations table will be added in a later migration.
-- We use IF NOT EXISTS guard via DO block to make the
-- migration safely re-runnable.
-- =========================================================

-- profiles
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'organization_id'
  ) then
    alter table public.profiles
      add column organization_id uuid null;
  end if;
end;
$$;

-- students
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'students'
      and column_name  = 'organization_id'
  ) then
    alter table public.students
      add column organization_id uuid null;
  end if;
end;
$$;

-- classes
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'classes'
      and column_name  = 'organization_id'
  ) then
    alter table public.classes
      add column organization_id uuid null;
  end if;
end;
$$;


-- =========================================================
-- SECTION 5: FIX xp_events POLICY (append-only ledger)
-- The old policy "Instructors award XP for own classes" was
-- FOR ALL (SELECT + INSERT + UPDATE + DELETE) which is wrong.
-- xp_events is an immutable ledger: instructors may only
-- INSERT new events, never mutate or delete existing ones.
-- We drop the old policy and replace it with INSERT-only.
-- =========================================================

-- Drop the incorrect FOR ALL policy from migration 0002
drop policy if exists "Instructors award XP for own classes"
  on public.xp_events;

-- New INSERT-only policy for instructors (WITH CHECK, not USING)
-- WITH CHECK runs on the NEW row being inserted, confirming the
-- class_id in the event belongs to the currently authed instructor.
create policy "Instructors insert XP for own classes"
  on public.xp_events for insert
  with check (
    exists (
      select 1
      from public.classes c
      where c.id = xp_events.class_id
        and c.instructor_id = auth.uid()
    )
  );

-- Note: No UPDATE or DELETE policy for instructors on xp_events.
-- The only path to modify/delete an xp_event is through an admin
-- (covered by "Admin full access xp_events" in Section 2).
