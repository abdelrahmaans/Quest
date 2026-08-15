-- =========================================================
-- MADA QUEST — DEMO / SEED DATA SCRIPT (STEP C)
-- Safe, additive seed data for internal testing and review.
-- Matches exact column schema and valid Hexadecimal UUID syntax.
-- =========================================================

-- ── 0. DEMO AUTH USERS ───────────────────────────────────
-- Required because public.profiles.id references auth.users(id)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
)
VALUES
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.instructor1@madaquest.local', crypt('Password123!', gen_salt('bf')), NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo: Prof. Ahmed Hassan"}', false, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.instructor2@madaquest.local', crypt('Password123!', gen_salt('bf')), NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo: Eng. Sarah Mansour"}', false, NOW(), NOW()),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo.admin@madaquest.local', crypt('Password123!', gen_salt('bf')), NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo: System Admin Mada"}', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── 1. DEMO PROFILES ─────────────────────────────────────
INSERT INTO public.profiles (id, full_name, role, is_active, created_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Demo: Prof. Ahmed Hassan', 'instructor', true, NOW() - INTERVAL '30 days'),
  ('d0000000-0000-0000-0000-000000000002', 'Demo: Eng. Sarah Mansour', 'instructor', true, NOW() - INTERVAL '25 days'),
  ('d0000000-0000-0000-0000-000000000003', 'Demo: System Admin Mada', 'admin', true, NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- ── 2. DEMO CLASSES ──────────────────────────────────────
INSERT INTO public.classes (id, public_code, name, description, instructor_id, status, created_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'CLS-DEMO-01', 'Demo: Web Development & UI Quest', 'Grade 9-10 Computer Science', 'd0000000-0000-0000-0000-000000000001', 'active', NOW() - INTERVAL '20 days'),
  ('c0000000-0000-0000-0000-000000000002', 'CLS-DEMO-02', 'Demo: Robotics & AI Junior', 'Grade 7-8 STEM', 'd0000000-0000-0000-0000-000000000001', 'active', NOW() - INTERVAL '15 days'),
  ('c0000000-0000-0000-0000-000000000003', 'CLS-DEMO-03', 'Demo: Advanced Python & Algorithms', 'Grade 11-12 Data Science', 'd0000000-0000-0000-0000-000000000002', 'active', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ── 3. DEMO STUDENTS ─────────────────────────────────────
INSERT INTO public.students (id, public_code, display_name, full_name, created_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'STD-DEMO-01', 'Omar K.',   'Demo: Omar Khaled',   NOW() - INTERVAL '18 days'),
  ('f0000000-0000-0000-0000-000000000002', 'STD-DEMO-02', 'Laila M.',  'Demo: Laila Mahmoud', NOW() - INTERVAL '18 days'),
  ('f0000000-0000-0000-0000-000000000003', 'STD-DEMO-03', 'Youssef K.','Demo: Youssef Karim', NOW() - INTERVAL '17 days'),
  ('f0000000-0000-0000-0000-000000000004', 'STD-DEMO-04', 'Nour E.',   'Demo: Nour El-Din',   NOW() - INTERVAL '16 days'),
  ('f0000000-0000-0000-0000-000000000005', 'STD-DEMO-05', 'Mariam A.', 'Demo: Mariam Ali',    NOW() - INTERVAL '15 days'),

  ('f0000000-0000-0000-0000-000000000006', 'STD-DEMO-06', 'Hamza I.',  'Demo: Hamza Ibrahim', NOW() - INTERVAL '14 days'),
  ('f0000000-0000-0000-0000-000000000007', 'STD-DEMO-07', 'Hana T.',   'Demo: Hana Tarek',    NOW() - INTERVAL '14 days'),
  ('f0000000-0000-0000-0000-000000000008', 'STD-DEMO-08', 'Ziyad M.',  'Demo: Ziyad Mostafa', NOW() - INTERVAL '13 days'),
  ('f0000000-0000-0000-0000-000000000009', 'STD-DEMO-09', 'Salma S.',  'Demo: Salma Sherif',  NOW() - INTERVAL '12 days'),
  ('f0000000-0000-0000-0000-000000000010', 'STD-DEMO-10', 'Adam B.',   'Demo: Adam Bilal',    NOW() - INTERVAL '10 days'),

  ('f0000000-0000-0000-0000-000000000011', 'STD-DEMO-11', 'Farida A.', 'Demo: Farida Amer',   NOW() - INTERVAL '9 days'),
  ('f0000000-0000-0000-0000-000000000012', 'STD-DEMO-12', 'Karim N.',  'Demo: Karim Nabil',   NOW() - INTERVAL '9 days'),
  ('f0000000-0000-0000-0000-000000000013', 'STD-DEMO-13', 'Malak H.',  'Demo: Malak Hany',    NOW() - INTERVAL '8 days'),
  ('f0000000-0000-0000-0000-000000000014', 'STD-DEMO-14', 'Seif E.',   'Demo: Seif Eldin',    NOW() - INTERVAL '7 days'),
  ('f0000000-0000-0000-0000-000000000015', 'STD-DEMO-15', 'Habiba S.', 'Demo: Habiba Sameh',  NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- ── 4. DEMO CLASS MEMBERS (LINK STUDENTS TO CLASSES) ──────
INSERT INTO public.class_members (class_id, student_id, status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'active'),
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'active'),
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'active'),
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', 'active'),
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'active'),

  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000006', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000007', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000008', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000009', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000010', 'active'),

  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000011', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000012', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000013', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000014', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000015', 'active')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- ── 5. DEMO SESSIONS ─────────────────────────────────────
INSERT INTO public.sessions (id, class_id, session_number, title, description, duration_minutes, status, created_at)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 'Demo: Intro to CSS Grid & Flexbox', 'Interactive layout exercise and live coding.', 45, 'completed', NOW() - INTERVAL '5 days'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 2, 'Demo: JavaScript DOM Manipulation Live', 'Hands-on live session building dynamic cards.', 60, 'completed', NOW() - INTERVAL '2 days'),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 3, 'Demo: Angular Signals & State Live Room', 'Live session workspace testing environment.', 45, 'live', NOW() - INTERVAL '10 minutes'),

  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 1, 'Demo: Sensors & Actuators Lab', 'Live hardware simulation session.', 45, 'completed', NOW() - INTERVAL '4 days'),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 2, 'Demo: AI Obstacle Avoidance Challenge', 'Live robotics challenge competition.', 60, 'scheduled', NOW() + INTERVAL '1 day'),

  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 1, 'Demo: Object-Oriented Python Mastery', 'Classes, methods, and inheritance live review.', 50, 'completed', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- ── 6. DEMO XP EVENTS LEDGER ─────────────────────────────
INSERT INTO public.xp_events (id, student_id, class_id, source_type, points, reason, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'quiz', 100, 'Demo: Correct Answer in CSS Quiz', NOW() - INTERVAL '4 days'),
  ('a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'participation', 50, 'Demo: Active Participation', NOW() - INTERVAL '2 days'),
  ('a0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'challenge', 150, 'Demo: Robotics Challenge Winner', NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000003', 'homework', 200, 'Demo: Perfect Python Assignment', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ── 7. DEMO BADGES ───────────────────────────────────────
INSERT INTO public.badges (id, public_code, name, description, created_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'BADGE-DEMO-01', 'Demo: Code Ninja', 'Mastered core programming fundamentals.', NOW() - INTERVAL '30 days'),
  ('b0000000-0000-0000-0000-000000000002', 'BADGE-DEMO-02', 'Demo: Early Bird', 'Consistently present and punctual for live sessions.', NOW() - INTERVAL '30 days'),
  ('b0000000-0000-0000-0000-000000000003', 'BADGE-DEMO-03', 'Demo: Team Catalyst', 'Helped peers solve complex coding bugs during class.', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ── 8. DEMO CHALLENGES ───────────────────────────────────
INSERT INTO public.challenges (id, public_code, title, description, xp_reward, status, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'CHAL-DEMO-01', 'Demo: Weekly Flexbox Duel', 'Build the fastest responsive layout using pure CSS flexbox.', 150, 'published', NOW() - INTERVAL '5 days'),
  ('10000000-0000-0000-0000-000000000002', 'CHAL-DEMO-02', 'Demo: Algorithmic Sprint', 'Solve 3 sorting algorithms with minimum time complexity.', 250, 'published', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
