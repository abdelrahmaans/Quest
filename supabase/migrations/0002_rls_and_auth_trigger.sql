-- =========================================================
-- SUPABASE SCHEMA ENHANCEMENTS: RLS POLICIES & AUTH TRIGGER
-- Execute this SQL after creating the main schema
-- =========================================================

-- 1. Automatic User Profile Creation on Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'instructor')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Enable Row Level Security (RLS) on All Tables
alter table public.profiles enable row level security;
alter table public.age_profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.students enable row level security;
alter table public.parents enable row level security;
alter table public.student_parents enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.levels enable row level security;
alter table public.sessions enable row level security;
alter table public.gamification_modules enable row level security;
alter table public.class_gamification enable row level security;
alter table public.session_gamification enable row level security;
alter table public.xp_events enable row level security;
alter table public.badges enable row level security;
alter table public.student_badges enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_assignments enable row level security;
alter table public.challenge_results enable row level security;
alter table public.attendance enable row level security;
alter table public.feedback enable row level security;
alter table public.gamification_suggestions enable row level security;

-- 3. Public Read Policies for Non-Sensitive Data
drop policy if exists "Public read age_profiles" on public.age_profiles;
create policy "Public read age_profiles" on public.age_profiles for select using (true);

drop policy if exists "Public read tracks" on public.tracks;
create policy "Public read tracks" on public.tracks for select using (is_active = true);

drop policy if exists "Public read gamification_modules" on public.gamification_modules;
create policy "Public read gamification_modules" on public.gamification_modules for select using (is_active = true);

drop policy if exists "Public read badges" on public.badges;
create policy "Public read badges" on public.badges for select using (is_active = true);

drop policy if exists "Public read achievements" on public.achievements;
create policy "Public read achievements" on public.achievements for select using (is_active = true);

drop policy if exists "Public read safe student profiles" on public.students;
create policy "Public read safe student profiles" on public.students for select using (status = 'active');

drop policy if exists "Public read classes info" on public.classes;
create policy "Public read classes info" on public.classes for select using (status != 'archived');

drop policy if exists "Public read feedback approved" on public.feedback;
create policy "Public read feedback approved" on public.feedback for select using (approved_for_public = true);

-- 4. Instructor & Admin Security Policies
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Instructors manage own classes" on public.classes;
create policy "Instructors manage own classes" on public.classes for all using (auth.uid() = instructor_id);

drop policy if exists "Instructors manage sessions for own classes" on public.sessions;
create policy "Instructors manage sessions for own classes" on public.sessions for all using (
  exists (select 1 from public.classes c where c.id = sessions.class_id and c.instructor_id = auth.uid())
);

drop policy if exists "Instructors award XP for own classes" on public.xp_events;
create policy "Instructors award XP for own classes" on public.xp_events for all using (
  exists (select 1 from public.classes c where c.id = xp_events.class_id and c.instructor_id = auth.uid())
);

-- 5. Public Feedback Submission Policy
drop policy if exists "Anyone can submit public feedback" on public.feedback;
create policy "Anyone can submit public feedback" on public.feedback for insert with check (true);
