# Mada Quest — Stabilization Plan (Feature by Feature)

> **Rule for this entire plan**: one feature at a time. Send the prompt → get the fix → **you personally test it in the browser** → only then move to the next feature. Do not batch features together, even if they look related. This plan exists specifically because trusting written reports without personal testing caused real problems before (fake "Complete" status, broken XP everywhere). No feature is marked done here until you've clicked it yourself.

---

## 🎯 System Architecture & Hierarchy Overview

### 1. Class & Students Flow:
- Instructor creates a Class (with optional bulk/initial student enrollment via newline textarea).
- Instructor manages enrolled students on each Class card (view roster, add individual students, see current Levels and XP).

### 2. Multi-Mode Gamification Architecture (Per Session):
- Each Class contains interactive live/scheduled **Sessions**.
- When creating a Session for any Class, the Instructor explicitly selects the **Gamification Mode**:
  1. ⚡ **`xp_levels` (XP & Level Progression)**: Classic points, level progression, and individual student streaks.
  2. 🛡️ **`teams_duels` (Team Quests & Duels)**: Group-based challenges, team battles, and collaborative XP.
  3. 🏆 **`badges_mastery` (Badges & Mastery)**: Milestone-driven achievement tracking and criteria unlocks.
  4. 🎯 **`hybrid_quest` (Custom Hybrid Quest)**: Customizable combination of XP, badges, streaks, and challenges.
- Launching the session activates the chosen gamification workspace.

---

## Feature 1 — Centralized XP Engine & Core Schema Alignment (COMPLETED)

**Status:** ✅ Completed & Tested (Migrations 0005, 0006, 0007, 0008 live on Supabase).

**Accomplished:**
1. Created `0005_xp_events_created_by.sql`, `0006_instructor_rls_and_gamification_mode.sql`, `0007_classes_subject_grade_code_fix.sql`, and `0008_students_schema_alignment.sql`.
2. Created centralized `XpService` (`src/app/core/services/xp.service.ts`) with `awardXp` and `awardBatchXp`.
3. Added `gamification_mode` column to `classes` and `sessions` tables.
4. Added `subject`, `grade_level`, and default `public_code` generator to `classes` table.
5. Added `class_id`, `instructor_id`, `xp_total`, `level`, `current_streak`, `highest_streak` to `students` table.
6. Updated `InstructorClassesComponent` to allow creating classes, bulk/single student enrollment, and direct session launching.
7. Fixed all RLS policies for instructors on `classes`, `students`, `sessions`, and `xp_events`.

---

## Feature 2 — Leaderboard column fix

**Prompt:**
```
Fix LeaderboardComponent: it queries a column "streak_days" that doesn't exist —
the real column in the students table is "current_streak". Update the query,
run npm run build, confirm 0 errors.
```

**You test this yourself:**
1. Go to `/instructor/leaderboard`.
2. Confirm the page loads with student rankings, no red console errors, streak numbers show up (even if 0).

---

## Feature 3 — Sessions creation & Gamification Mode Selection

**Prompt:**
```
Fix SessionsListComponent:
1. It queries/inserts "started_at" and calculates auto session_number.
2. Store and load "gamification_mode" on session creation and display.
Run npm run build, confirm 0 errors.
```

**You test this yourself:**
1. Go to `/instructor/sessions`, create a new session for any class with chosen gamification mode.
2. Confirm it appears in the list with no console errors.
3. Create a second session for the same class — confirm it doesn't clash (different session_number).

---

## Feature 4 — Verify AI Service `challenges` insert is actually correct

**Prompt:**
```
Open supabase/migrations/0001_initial_schema.sql, find the exact `challenges` table
definition, and paste it here. Confirm whether "status" and "configuration" columns
genuinely exist (they appeared to in the original schema, contradicting the earlier
audit report). Tell me clearly: was there ever a real problem with the challenges
insert in AIService, or was the only real issue the xp_events part already fixed in
Feature 1?
```

**You test this yourself (after Claude's answer, only if a real fix was needed):**
1. Open the AI Assistant, get a suggestion, click "Apply as Challenge", confirm.
2. Open Supabase Dashboard → `challenges` table → confirm a new row appeared with your data.

---

## Feature 5 — Real Gemini AI verification (this has been pending for a while — close it now)

**No code changes expected here** — just proof it actually works.

**You test this yourself:**
1. Open the AI Assistant Drawer.
2. Ask: *"Give me a 10-minute challenge for Scratch, age 9"*
3. Ask a completely different question: *"Why might engagement be dropping in my class?"*
4. Paste both raw responses here.

---

## Feature 6 — Make `audit_log` actually get written to

```
Add actual audit_log writes to the important admin/instructor actions that should be
tracked: role changes (AdminUsersComponent), manual XP adjustments, student removal from a class, and class deletion.
Insert into audit_log with actor_id = current user, action, entity, entity_id, and
relevant metadata. Run npm run build, confirm 0 errors.
```

**You test this yourself:**
1. As admin, change a user's role on `/admin/users`.
2. Go to `/admin/logs` — confirm a new row appeared describing that exact action.

---

## Feature 7 — Realtime, personally verified

**No code changes expected** — just proof.

**You test this yourself:**
1. Open the same live session in two browser tabs side by side.
2. Award XP to a student from tab 1.
3. Watch tab 2 without refreshing — confirm real-time synchronization.

---

## Feature 8 — Notifications, personally verified

**You test this yourself:**
1. Award a badge to a student.
2. Click the 🔔 bell icon.
3. Confirm instant notification appears.

---

## Feature 9 — Demo data: final decision

Decide:
- **Keep** the demo data permanently as seed data, OR
- **Delete** it now if you're done needing it for testing.

---

## Feature 10 — Full re-audit

```
Re-run the exact same full-project audit as before (every route, every Supabase call,
compared column-by-column against the real schema in supabase/migrations/0001 to 0008).
Produce the same style master audit table.
```

---

## Feature 11 — Mada brand styling consistency pass

```
Do a consistency pass across every screen (public home, auth, instructor, admin) to
confirm the approved brand tokens are applied everywhere: Primary Teal #14B8A6,
Warm background #FAF7F2, correct Dark Mode tokens (#0F172A background, #F8FAFC text).
```

---

## Feature 12 — Final honest documentation update

```
Update PROJECT_PLAN.md to reflect the TRUE current state after this entire
stabilization plan: what was actually broken, what was fixed, and what was personally
verified by the project owner.
```
