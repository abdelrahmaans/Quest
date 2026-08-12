-- =========================================================
-- GAMIFICATION PLATFORM
-- SUPABASE INITIAL SCHEMA
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================

create type public.user_role as enum (
  'admin',
  'instructor'
);

create type public.member_status as enum (
  'active',
  'inactive',
  'completed'
);

create type public.class_status as enum (
  'active',
  'paused',
  'completed',
  'archived'
);

create type public.session_status as enum (
  'draft',
  'scheduled',
  'live',
  'completed',
  'cancelled'
);

create type public.feedback_type as enum (
  'feedback',
  'suggestion',
  'gamification_request',
  'feature_request',
  'contact',
  'complaint',
  'praise'
);

create type public.feedback_status as enum (
  'new',
  'in_review',
  'approved',
  'rejected',
  'resolved'
);

create type public.challenge_status as enum (
  'draft',
  'published',
  'archived'
);

create type public.challenge_assignment_status as enum (
  'active',
  'completed',
  'expired',
  'cancelled'
);

-- =========================================================
-- USER PROFILES
-- =========================================================

create table public.profiles (
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

create table public.age_profiles (
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

create table public.tracks (
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

create table public.students (
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

create table public.parents (
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

create table public.student_parents (
  student_id uuid not null references public.students(id) on delete cascade,
  parent_id uuid not null references public.parents(id) on delete cascade,

  relationship text,

  primary key (student_id, parent_id)
);

-- =========================================================
-- CLASSES
-- =========================================================

create table public.classes (
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

create table public.class_members (
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

create table public.levels (
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

create table public.sessions (
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

create table public.gamification_modules (
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

create table public.class_gamification (
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

create table public.session_gamification (
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

create table public.xp_events (
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

create table public.badges (
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

create table public.student_badges (
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

create table public.achievements (
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

create table public.student_achievements (
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

create table public.challenges (
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

create table public.challenge_assignments (
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

create table public.challenge_results (
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

create table public.attendance (
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

create table public.feedback (
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

create table public.gamification_suggestions (
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

create index idx_students_public_code
on public.students(public_code);

create index idx_classes_public_code
on public.classes(public_code);

create index idx_class_members_class
on public.class_members(class_id);

create index idx_class_members_student
on public.class_members(student_id);

create index idx_sessions_class
on public.sessions(class_id);

create index idx_xp_events_student
on public.xp_events(student_id);

create index idx_xp_events_class
on public.xp_events(class_id);

create index idx_xp_events_created
on public.xp_events(created_at);

create index idx_attendance_student
on public.attendance(student_id);

create index idx_challenge_results_student
on public.challenge_results(student_id);

create index idx_feedback_status
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
('Progress', 'progress', 'Visual progress system', 'progress', '🚀');

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

create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

create trigger students_updated_at
before update on public.students
for each row execute procedure public.handle_updated_at();

create trigger parents_updated_at
before update on public.parents
for each row execute procedure public.handle_updated_at();

create trigger classes_updated_at
before update on public.classes
for each row execute procedure public.handle_updated_at();

create trigger sessions_updated_at
before update on public.sessions
for each row execute procedure public.handle_updated_at();

create trigger badges_updated_at
before update on public.badges
for each row execute procedure public.handle_updated_at();

create trigger challenges_updated_at
before update on public.challenges
for each row execute procedure public.handle_updated_at();

create trigger feedback_updated_at
before update on public.feedback
for each row execute procedure public.handle_updated_at();

create trigger gamification_suggestions_updated_at
before update on public.gamification_suggestions
for each row execute procedure public.handle_updated_at();
