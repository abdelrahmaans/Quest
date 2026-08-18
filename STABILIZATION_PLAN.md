# Mada Quest — Stabilization Plan (Feature by Feature)

> **Rule for this entire plan**: One feature at a time. Run/review the prompt → verify the implementation & build → **you personally test it in the browser** → only then move to the next feature. Do not batch features together. No feature is marked done until you've tested and confirmed it yourself in the UI.

---

## 🎯 Centralized Architecture & Schema Progress Summary

| Database Migration | Status | Description |
|---|---|---|
| `0001` to `0004` | ✅ Live | Initial schema, multi-tenancy, RLS, and admin roles |
| `0005_xp_events_created_by.sql` | ✅ Live | Centralized `created_by` column on `xp_events` |
| `0006_instructor_rls_and_gamification_mode.sql` | ✅ Live | Gamification modes & instructor RLS permissions |
| `0007_classes_subject_grade_code_fix.sql` | ✅ Live | Subject, grade, and auto public code generation |
| `0008_students_schema_alignment.sql` | ✅ Live | Align students schema (xp_total, level, current_streak) |
| `0009_sessions_and_attendance_rls.sql` | ✅ Live | Comprehensive RLS on sessions & attendance |
| `0010_sessions_schedule_and_dates.sql` | ✅ Live | `scheduled_at`, `started_at`, `ended_at`, weekly schedule fields |
| `0011_fix_classes_rls_and_indexes.sql` | ✅ Live | Authenticated full access to classes & students |
| `0012_class_members_and_students_sync.sql` | ✅ Live | Auto-sync trigger between `students.class_id` and `class_members` |
| `0013_sessions_and_students_full_access.sql` | ✅ Live | Unobstructed instructor session launching & student access |
| `0014_fix_audit_log_and_complete_session_rls.sql` | ✅ Live | Instructor audit logging permissions on session completion |

---

## Feature 1 — Centralized XP Engine (Implemented & Tested)

**Goal:** Centralize all XP writes through a single `XpService` (`src/app/core/services/xp.service.ts`) using the real database column names.

**Implementation Status:**
- `XpService` created with `awardXp` and `awardBatchXp`.
- Connected to `GamificationComponent`, `LiveWorkspaceComponent`, `ClassDetailComponent`, and `AIService`.
- Removed references to non-existent `awarded_by` / `event_type` columns.

**Verification Steps (User Testing):**
1. Navigate to `/instructor/gamification` ➡️ Click a quick XP button (`+10 XP`, `+25 XP`, `+50 XP`) on a student.
2. Check Console (F12) ➡️ Confirm 0 red errors and instant XP update on student card.
3. Open `/instructor` (Overview) ➡️ Verify total class XP and activity load accurately.

---

## Feature 2 — Leaderboard Column & Real-Time Ranking (Implemented & Tested)

**Goal:** Correct the leaderboard query from non-existent `streak_days` to `current_streak` and sort students by `xp_total` descending.

**Implementation Status:**
- `LeaderboardComponent` queries `current_streak`, `xp_total`, and `level`.
- Class Hub Leaderboard tab (`/instructor/classes/:id`) displays ranked podium (🥇, 🥈, 🥉) with streak count.

**Verification Steps (User Testing):**
1. Navigate to `/instructor/leaderboard`.
2. Confirm students are ranked in descending order of XP with valid levels and streak days.

---

## Feature 3 — Sessions Scheduling & Auto-Generator (Implemented & Tested)

**Goal:** Support weekly auto-scheduling of sessions on class creation, clean session titles, interactive calendar view, and live workspace launching.

**Implementation Status:**
- Implemented `SessionService.autoGenerateClassSessions()` generating clean session titles (`Session #1`, `Session #2`).
- Added interactive monthly calendar view (`/instructor/sessions`) with day click modal.
- Added **Today's Agenda** spotlight banner.
- Added 30-minute upcoming session alert banner in Class Hub.

**Verification Steps (User Testing):**
1. Open `/instructor/classes` ➡️ Create a new class with auto-schedule enabled (e.g. 8 sessions on Sun/Tue).
2. Open `/instructor/sessions` ➡️ Switch to **Calendar View** ➡️ Verify sessions are mapped to the correct days.
3. Click any date on the calendar ➡️ Confirm the Day Details Modal opens with direct **Launch Live** button.

---

## Feature 4 — Verify AI Service `challenges` Schema (Implemented & Ready for Testing)

**Goal:** Confirm the `challenges` table definition in `0001_initial_schema.sql` and ensure "Apply as Challenge" writes to real columns.

**Schema Details:**
- Table: `public.challenges`
- Columns: `id`, `class_id`, `created_by`, `title`, `description`, `type`, `xp_reward`, `status` (`draft`, `published`, `archived`), `configuration` (jsonb), `created_at`.
- The `challenges` insert in `AIService` matches the schema structure.

**Verification Steps (User Testing):**
1. In Live Workspace (`/instructor/sessions/:id/live`), open the AI Assistant Drawer.
2. Click **Apply as Challenge** on any generated suggestion.
3. Confirm confirmation modal opens and challenge is saved to database.

---

## Feature 5 — Real Gemini AI Verification

**Goal:** Verify whether Gemini API is returning dynamic context-aware responses or falling back to static text.

**Verification Steps (User Testing):**
1. Open AI Assistant Drawer.
2. Prompt 1: *"Give me a 10-minute challenge for Scratch, age 9"*
3. Prompt 2: *"Why might engagement be dropping in my class?"*
4. Compare both outputs: confirm they are distinct, tailored, and context-specific.

---

## Feature 6 — Audit Logging on Critical Actions (Implemented & Tested)

**Goal:** Ensure critical admin and instructor operations (session completion, role updates, class changes) write to `public.audit_log`.

**Implementation Status:**
- `SessionService.completeSession()` writes `COMPLETE_SESSION` with metadata (duration, XP awarded, attendance, MVP).
- Migration `0014` applied granting authenticated instructors write access to `audit_log`.

**Verification Steps (User Testing):**
1. Launch a live session ➡️ Award XP ➡️ Click **End Session** ➡️ Click **Save & Go to Class Leaderboard**.
2. Check Supabase table `audit_log` ➡️ Verify a new record exists with action `COMPLETE_SESSION`.

---

## Feature 7 — Realtime Synchronization (Live Workspace)

**Goal:** Verify Supabase Realtime channel synchronization between multiple concurrent tabs without manual page reload.

**Verification Steps (User Testing):**
1. Open the same live session room (`/instructor/sessions/:id/live`) in two separate browser tabs/windows side-by-side.
2. Award +25 XP to a student in Tab 1.
3. Watch Tab 2: Confirm student XP, live feed, and total session XP update automatically in real-time.

---

## Feature 8 — In-App Notifications & Alerts

**Goal:** Verify system notifications (session reminders, achievements, badges) trigger and appear under the 🔔 icon.

**Verification Steps (User Testing):**
1. Trigger a notification event or award a badge in live session.
2. Click the 🔔 bell icon in the top header navbar.
3. Confirm unread badge count updates and notification card is displayed.

---

## Feature 9 — Demo Data Strategy & Cleanup

**Goal:** Decide on test/seed data strategy for production deployment.

**Options:**
- **Option A (Keep Seed Data):** Retain realistic test students and classes clearly tagged as demo data for testing.
- **Option B (Clean Reset):** Execute a cleanup script to purge test student rows before user onboarding.

---

## Feature 10 — Full System Re-Audit

**Goal:** Run a comprehensive end-to-end check across all routes and Supabase tables to confirm 0 schema/type mismatches.

**Checklist:**
- [x] `profiles` / Auth & Roles (`instructor`, `admin`, `parent`, `student`)
- [x] `classes` & `class_members` (multi-tenancy, subject, schedule)
- [x] `students` (xp_total, level, current_streak, metadata)
- [x] `sessions` & `attendance` (scheduled_at, started_at, ended_at, gamification_mode)
- [x] `xp_events` (student_id, source_type, points, created_by)
- [x] `audit_log` (actor_id, action, entity, metadata)

---

## Feature 11 — Mada Brand Styling & Consistency Pass

**Goal:** Ensure brand consistency across Light & Dark modes, Arabic (RTL) & English (LTR).

**Approved Brand Palette:**
- Primary Teal: `#14B8A6` / `#0D9488`
- Surface / Warm BG: `#FAF7F2` / `#FFFFFF`
- Dark Mode BG / Surface: `#0F172A` / `#1E293B`
- Accent Gold (XP/Badges): `#F59E0B` / `#FCD34D`
- Accent Red (Duels/Live): `#EF4444`

---

## Feature 12 — Final Documentation & Handover

**Goal:** Synchronize `PROJECT_PLAN.md`, `README.md`, and system blueprints with the final verified codebase state.
