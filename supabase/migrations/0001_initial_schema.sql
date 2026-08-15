-- =========================================================
-- GAMIFICATION PLATFORM
-- SUPABASE INITIAL SCHEMA
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'instructor');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.class_status AS ENUM ('active', 'paused', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('draft', 'scheduled', 'live', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_type AS ENUM (
    'feedback', 'suggestion', 'gamification_request', 'feature_request', 'contact', 'complaint', 'praise'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_status AS ENUM ('new', 'in_review', 'approved', 'rejected', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.challenge_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.challenge_assignment_status AS ENUM ('active', 'completed', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================
-- USER PROFILES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null,
  avatar_url text,

  role public.user_role not null default 'instructor',

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- AGE PROFILES
-- =========================================================

create table if not exists public.age_profiles (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null unique,

  min_age integer,
  max_age integer,

  description text,

  competitive_enabled boolean not null default true,
  negative_points_enabled boolean not null default false,
  leaderboard_enabled boolean not null default true,

  default_visual_style text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- TRACKS
-- =========================================================

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null unique,

  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- STUDENTS
-- =========================================================

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),

  public_code text not null unique,

  display_name text not null,
  full_name text,

  birth_date date,

  age_profile_id uuid references public.age_profiles(id),

  avatar_url text,

  status public.member_status not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- PARENTS
-- =========================================================

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,
  email text,
  phone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- STUDENT / PARENT RELATION
-- =========================================================

create table if not exists public.student_parents (
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id uuid not null references public.parents(id) on delete cascade,

  relationship text,

  primary key (student_id, parent_id)
);

-- =========================================================
-- CLASSES
-- =========================================================

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),

  public_code text not null unique,

  name text not null,
  description text,

  instructor_id uuid not null
    references public.profiles(id),

  track_id uuid references public.tracks(id),

  age_profile_id uuid references public.age_profiles(id),

  status public.class_status not null default 'active',

  max_students integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- CLASS MEMBERS
-- =========================================================

create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),

  class_id uuid not null
    references public.classes(id)
    on delete cascade,

  student_id uuid not null
    references public.students(id)
    on delete cascade,

  status public.member_status not null default 'active',

  joined_at timestamptz not null default now(),
  completed_at timestamptz,

  unique(class_id, student_id)
);

-- =========================================================
-- LEVELS
-- =========================================================

create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),

  class_id uuid not null
    references public.classes(id)
    on delete cascade,

  level_number integer not null,

  name text not null,
  description text,

  xp_required integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  unique(class_id, level_number)
);

-- =========================================================
-- SESSIONS
-- =========================================================

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),

  class_id uuid not null
    references public.classes(id)
    on delete cascade,

  level_id uuid
    references public.levels(id)
    on delete set null,

  session_number integer not null,

  title text not null,
  description text,

  duration_minutes integer,

  scheduled_at timestamptz,

  status public.session_status not null default 'draft',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(class_id, session_number)
);

-- =========================================================
-- GAMIFICATION MODULES
-- =========================================================

create table if not exists public.gamification_modules (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  code text not null unique,

  description text,

  category text,

  icon text,

  is_active boolean not null default true,

  created_at timestamptz not null default now()
);

-- =========================================================
-- CLASS GAMIFICATION
-- =========================================================

create table if not exists public.class_gamification (
  id uuid primary key default gen_random_uuid(),

  class_id uuid not null
    references public.classes(id)
    on delete cascade,

  module_id uuid not null
    references public.gamification_modules(id)
    on delete cascade,

  enabled boolean not null default true,

  configuration jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  unique(class_id, module_id)
);

-- =========================================================
-- SESSION GAMIFICATION
-- =========================================================

create table if not exists public.session_gamification (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null
    references public.sessions(id)
    on delete cascade,

  module_id uuid not null
    references public.gamification_modules(id),

  configuration jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- =========================================================
-- XP EVENTS
-- =========================================================

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete cascade,

  class_id uuid
    references public.classes(id)
    on delete set null,

  session_id uuid
    references public.sessions(id)
    on delete set null,

  source_type text not null,
  source_id uuid,

  points integer not null,

  reason text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- =========================================================
-- BADGES
-- =========================================================

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),

  public_code text not null unique,

  name text not null,
  description text,

  icon_url text,

  rarity text,

  xp_reward integer not null default 0,

  criteria jsonb not null default '{}'::jsonb,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- STUDENT BADGES
-- =========================================================

create table if not exists public.student_badges (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete cascade,

  badge_id uuid not null
    references public.badges(id)
    on delete cascade,

  class_id uuid
    references public.classes(id)
    on delete set null,

  awarded_at timestamptz not null default now(),

  unique(student_id, badge_id, class_id)
);

-- =========================================================
-- ACHIEVEMENTS
-- =========================================================

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),

  public_code text not null unique,

  name text not null,
  description text,

  icon_url text,

  xp_reward integer not null default 0,

  criteria jsonb not null default '{}'::jsonb,

  is_active boolean not null default true,

  created_at timestamptz not null default now()
);

-- =========================================================
-- STUDENT ACHIEVEMENTS
-- =========================================================

create table if not exists public.student_achievements (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete cascade,

  achievement_id uuid not null
    references public.achievements(id)
    on delete cascade,

  class_id uuid
    references public.classes(id)
    on delete set null,

  achieved_at timestamptz not null default now(),

  unique(student_id, achievement_id, class_id)
);

-- =========================================================
-- CHALLENGES
-- =========================================================

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),

  public_code text not null unique,

  title text not null,
  description text,

  difficulty text,

  duration_minutes integer,

  xp_reward integer not null default 0,

  badge_id uuid
    references public.badges(id)
    on delete set null,

  age_profile_id uuid
    references public.age_profiles(id),

  track_id uuid
    references public.tracks(id),

  status public.challenge_status not null default 'draft',

  configuration jsonb not null default '{}'::jsonb,

  created_by uuid
    references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- CHALLENGE ASSIGNMENTS
-- =========================================================

create table if not exists public.challenge_assignments (
  id uuid primary key default gen_random_uuid(),

  challenge_id uuid not null
    references public.challenges(id)
    on delete cascade,

  class_id uuid not null
    references public.classes(id)
    on delete cascade,

  session_id uuid
    references public.sessions(id)
    on delete set null,

  starts_at timestamptz,
  ends_at timestamptz,

  status public.challenge_assignment_status
    not null default 'active',

  created_at timestamptz not null default now()
);

-- =========================================================
-- STUDENT CHALLENGE RESULTS
-- =========================================================

create table if not exists public.challenge_results (
  id uuid primary key default gen_random_uuid(),

  assignment_id uuid not null
    references public.challenge_assignments(id)
    on delete cascade,

  student_id uuid not null
    references public.students(id)
    on delete cascade,

  score integer not null default 0,

  completion_time_seconds integer,

  completed_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  unique(assignment_id, student_id)
);

-- =========================================================
-- ATTENDANCE
-- =========================================================

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null
    references public.sessions(id)
    on delete cascade,

  student_id uuid not null
    references public.students(id)
    on delete cascade,

  present boolean not null default false,

  created_at timestamptz not null default now(),

  unique(session_id, student_id)
);

-- =========================================================
-- FEEDBACK
-- =========================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),

  type public.feedback_type not null,

  name text,
  email text,

  student_code text,
  class_code text,

  rating integer,

  title text,
  message text not null,

  status public.feedback_status
    not null default 'new',

  admin_notes text,

  approved_for_public boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- GAMIFICATION SUGGESTIONS
-- =========================================================

create table if not exists public.gamification_suggestions (
  id uuid primary key default gen_random_uuid(),

  instructor_id uuid
    references public.profiles(id)
    on delete set null,

  title text not null,

  description text not null,

  category text not null,

  example_configuration jsonb
    not null default '{}'::jsonb,

  status text not null default 'new',

  admin_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_students_public_code
on public.students(public_code);

create index if not exists idx_classes_public_code
on public.classes(public_code);

create index if not exists idx_class_members_class
on public.class_members(class_id);

create index if not exists idx_class_members_student
on public.class_members(student_id);

create index if not exists idx_sessions_class
on public.sessions(class_id);

create index if not exists idx_xp_events_student
on public.xp_events(student_id);

create index if not exists idx_xp_events_class
on public.xp_events(class_id);

create index if not exists idx_xp_events_created
on public.xp_events(created_at);

create index if not exists idx_attendance_student
on public.attendance(student_id);

create index if not exists idx_challenge_results_student
on public.challenge_results(student_id);

create index if not exists idx_feedback_status
on public.feedback(status);

-- =========================================================
-- INITIAL GAMIFICATION MODULES
-- =========================================================

insert into public.gamification_modules
(name, code, description, category, icon)
values
('XP', 'xp', 'Experience points system', 'progress', '⚡'),
('Badges', 'badges', 'Badge achievement system', 'reward', '🏅'),
('Achievements', 'achievements', 'Milestone achievement system', 'reward', '🏆'),
('Leaderboard', 'leaderboard', 'Ranking system', 'competition', '📊'),
('Streak', 'streak', 'Consistency tracking', 'progress', '🔥'),
('Challenges', 'challenges', 'Challenge system', 'gameplay', '🎯'),
('Time Attack', 'time_attack', 'Timed challenge mechanic', 'gameplay', '⏱️'),
('Team Battle', 'team_battle', 'Team based competition', 'competition', '⚔️'),
('Mystery Reward', 'mystery_reward', 'Random reward mechanic', 'gameplay', '🎁'),
('Progress', 'progress', 'Visual progress system', 'progress', '🚀')
on conflict (code) do nothing;

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists students_updated_at on public.students;
create trigger students_updated_at
before update on public.students
for each row execute procedure public.handle_updated_at();

drop trigger if exists parents_updated_at on public.parents;
create trigger parents_updated_at
before update on public.parents
for each row execute procedure public.handle_updated_at();

drop trigger if exists classes_updated_at on public.classes;
create trigger classes_updated_at
before update on public.classes
for each row execute procedure public.handle_updated_at();

drop trigger if exists sessions_updated_at on public.sessions;
create trigger sessions_updated_at
before update on public.sessions
for each row execute procedure public.handle_updated_at();

drop trigger if exists badges_updated_at on public.badges;
create trigger badges_updated_at
before update on public.badges
for each row execute procedure public.handle_updated_at();

drop trigger if exists challenges_updated_at on public.challenges;
create trigger challenges_updated_at
before update on public.challenges
for each row execute procedure public.handle_updated_at();

drop trigger if exists feedback_updated_at on public.feedback;
create trigger feedback_updated_at
before update on public.feedback
for each row execute procedure public.handle_updated_at();

drop trigger if exists gamification_suggestions_updated_at on public.gamification_suggestions;
create trigger gamification_suggestions_updated_at
before update on public.gamification_suggestions
for each row execute procedure public.handle_updated_at();
