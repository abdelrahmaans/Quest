-- =========================================================
-- MIGRATION 0016: CLASSES DURATION MINUTES
-- Adds session_duration_minutes to classes table for recurring session length
-- =========================================================

alter table public.classes
  add column if not exists duration_minutes integer default 45;
