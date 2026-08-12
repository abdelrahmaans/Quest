-- =========================================================
-- MADA QUEST — DEMO / SEED DATA SCRIPT (STEP C)
-- Safe, additive seed data for internal testing and review.
-- All demo records use UUIDs starting with 'd0000000-...'
-- and 'Demo:' prefix so Step E can remove them cleanly.
-- =========================================================

-- ── 1. DEMO PROFILES (INSTRUCTORS & ADMIN) ───────────────
-- Instructors: d0000000-0000-0000-0000-000000000001, d0000000-0000-0000-0000-000000000002
-- Admin:       d0000000-0000-0000-0000-000000000003

INSERT INTO public.profiles (id, full_name, role, is_active, created_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Demo: Prof. Ahmed Hassan', 'instructor', true, NOW() - INTERVAL '30 days'),
  ('d0000000-0000-0000-0000-000000000002', 'Demo: Eng. Sarah Mansour', 'instructor', true, NOW() - INTERVAL '25 days'),
  ('d0000000-0000-0000-0000-000000000003', 'Demo: System Admin Mada', 'admin', true, NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- ── 2. DEMO CLASSES ──────────────────────────────────────
INSERT INTO public.classes (id, name, subject, grade_level, instructor_id, status, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Demo: Web Development & UI Quest', 'Computer Science', 'Grade 9-10', 'd0000000-0000-0000-0000-000000000001', 'active', NOW() - INTERVAL '20 days'),
  ('c0000000-0000-0000-0000-000000000002', 'Demo: Robotics & AI Junior', 'STEM', 'Grade 7-8', 'd0000000-0000-0000-0000-000000000001', 'active', NOW() - INTERVAL '15 days'),
  ('c0000000-0000-0000-0000-000000000003', 'Demo: Advanced Python & Algorithms', 'Data Science', 'Grade 11-12', 'd0000000-0000-0000-0000-000000000002', 'active', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ── 3. DEMO STUDENTS (~15 Students) ──────────────────────
INSERT INTO public.students (id, full_name, class_id, instructor_id, xp_total, level, streak_days, created_at)
VALUES
  ('s0000000-0000-0000-0000-000000000001', 'Demo: Omar Khaled',     'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1450, 4, 7, NOW() - INTERVAL '18 days'),
  ('s0000000-0000-0000-0000-000000000002', 'Demo: Laila Mahmoud',   'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1200, 3, 5, NOW() - INTERVAL '18 days'),
  ('s0000000-0000-0000-0000-000000000003', 'Demo: Youssef Karim',   'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 980,  3, 4, NOW() - INTERVAL '17 days'),
  ('s0000000-0000-0000-0000-000000000004', 'Demo: Nour El-Din',     'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 750,  2, 3, NOW() - INTERVAL '16 days'),
  ('s0000000-0000-0000-0000-000000000005', 'Demo: Mariam Ali',      'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 620,  2, 2, NOW() - INTERVAL '15 days'),

  ('s0000000-0000-0000-0000-000000000006', 'Demo: Hamza Ibrahim',   'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 1800, 5, 12, NOW() - INTERVAL '14 days'),
  ('s0000000-0000-0000-0000-000000000007', 'Demo: Hana Tarek',      'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 1100, 3, 6, NOW() - INTERVAL '14 days'),
  ('s0000000-0000-0000-0000-000000000008', 'Demo: Ziyad Mostafa',   'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 890,  3, 3, NOW() - INTERVAL '13 days'),
  ('s0000000-0000-0000-0000-000000000009', 'Demo: Salma Sherif',    'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 450,  1, 1, NOW() - INTERVAL '12 days'),
  ('s0000000-0000-0000-0000-000000000010', 'Demo: Adam Bilal',      'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 320,  1, 0, NOW() - INTERVAL '10 days'),

  ('s0000000-0000-0000-0000-000000000011', 'Demo: Farida Amer',     'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 2100, 6, 15, NOW() - INTERVAL '9 days'),
  ('s0000000-0000-0000-0000-000000000012', 'Demo: Karim Nabil',     'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 1650, 4, 9, NOW() - INTERVAL '9 days'),
  ('s0000000-0000-0000-0000-000000000013', 'Demo: Malak Hany',      'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 1300, 3, 7, NOW() - INTERVAL '8 days'),
  ('s0000000-0000-0000-0000-000000000014', 'Demo: Seif Eldin',      'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 920,  3, 4, NOW() - INTERVAL '7 days'),
  ('s0000000-0000-0000-0000-000000000015', 'Demo: Habiba Sameh',    'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 510,  2, 2, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, xp_total = EXCLUDED.xp_total;

-- ── 4. DEMO SESSIONS ─────────────────────────────────────
INSERT INTO public.sessions (id, title, description, class_id, status, duration_minutes, created_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Demo: Intro to CSS Grid & Flexbox', 'Interactive layout exercise and live coding.', 'c0000000-0000-0000-0000-000000000001', 'completed', 45, NOW() - INTERVAL '5 days'),
  ('e0000000-0000-0000-0000-000000000002', 'Demo: JavaScript DOM Manipulation Live', 'Hands-on live session building dynamic cards.', 'c0000000-0000-0000-0000-000000000001', 'completed', 60, NOW() - INTERVAL '2 days'),
  ('e0000000-0000-0000-0000-000000000003', 'Demo: Angular Signals & State Live Room', 'Live session workspace testing environment.', 'c0000000-0000-0000-0000-000000000001', 'live', 45, NOW() - INTERVAL '10 minutes'),

  ('e0000000-0000-0000-0000-000000000004', 'Demo: Sensors & Actuators Lab', 'Live hardware simulation session.', 'c0000000-0000-0000-0000-000000000002', 'completed', 45, NOW() - INTERVAL '4 days'),
  ('e0000000-0000-0000-0000-000000000005', 'Demo: AI Obstacle Avoidance Challenge', 'Live robotics challenge competition.', 'c0000000-0000-0000-0000-000000000002', 'scheduled', 60, NOW() + INTERVAL '1 day'),

  ('e0000000-0000-0000-0000-000000000006', 'Demo: Object-Oriented Python Mastery', 'Classes, methods, and inheritance live review.', 'c0000000-0000-0000-0000-000000000003', 'completed', 50, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- ── 5. DEMO XP EVENTS LEDGER ─────────────────────────────
INSERT INTO public.xp_events (id, student_id, awarded_by, points, reason, event_type, created_at)
VALUES
  ('x0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 100, 'Demo: Correct Answer in CSS Quiz', 'quiz', NOW() - INTERVAL '4 days'),
  ('x0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 50,  'Demo: Active Participation', 'participation', NOW() - INTERVAL '2 days'),
  ('x0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', 150, 'Demo: Robotics Challenge Winner', 'challenge', NOW() - INTERVAL '3 days'),
  ('x0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', 200, 'Demo: Perfect Python Assignment', 'homework', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ── 6. DEMO BADGES ───────────────────────────────────────
INSERT INTO public.badges (id, title, description, icon_name, xp_reward, category, created_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Demo: Code Ninja', 'Mastered core programming fundamentals.', 'zap', 100, 'achievement', NOW() - INTERVAL '30 days'),
  ('b0000000-0000-0000-0000-000000000002', 'Demo: Early Bird', 'Consistently present and punctual for live sessions.', 'clock', 50, 'attendance', NOW() - INTERVAL '30 days'),
  ('b0000000-0000-0000-0000-000000000003', 'Demo: Team Catalyst', 'Helped peers solve complex coding bugs during class.', 'users', 75, 'collaboration', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- ── 7. DEMO CHALLENGES ───────────────────────────────────
INSERT INTO public.challenges (id, title, description, xp_reward, status, created_at)
VALUES
  ('h0000000-0000-0000-0000-000000000001', 'Demo: Weekly Flexbox Duel', 'Build the fastest responsive layout using pure CSS flexbox.', 150, 'published', NOW() - INTERVAL '5 days'),
  ('h0000000-0000-0000-0000-000000000002', 'Demo: Algorithmic Sprint', 'Solve 3 sorting algorithms with minimum time complexity.', 250, 'published', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- =========================================================
-- ROW COUNTS CONFIRMATION QUERY:
-- SELECT 'profiles' as tbl, count(*) FROM public.profiles WHERE id LIKE 'd0000000-%'
-- UNION ALL SELECT 'classes', count(*) FROM public.classes WHERE id LIKE 'c0000000-%'
-- UNION ALL SELECT 'students', count(*) FROM public.students WHERE id LIKE 's0000000-%'
-- UNION ALL SELECT 'sessions', count(*) FROM public.sessions WHERE id LIKE 'e0000000-%'
-- UNION ALL SELECT 'badges', count(*) FROM public.badges WHERE id LIKE 'b0000000-%'
-- UNION ALL SELECT 'challenges', count(*) FROM public.challenges WHERE id LIKE 'h0000000-%';
-- =========================================================
