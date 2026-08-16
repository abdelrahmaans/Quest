-- =========================================================
-- MIGRATION 0010: SESSIONS SCHEDULE AND DATE COLUMNS
-- Ensures started_at, ended_at, and scheduled_at exist on sessions table
-- =========================================================

alter table public.sessions
  add column if not exists scheduled_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz;

-- Also add schedule metadata fields to classes for reference
alter table public.classes
  add column if not exists schedule_days text[],
  add column if not exists schedule_time text,
  add column if not exists start_date date,
  add column if not exists total_sessions integer default 8;
