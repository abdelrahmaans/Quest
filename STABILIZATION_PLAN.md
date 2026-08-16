# Mada Quest — Stabilization Plan (Feature by Feature)

> **Rule for this entire plan**: one feature at a time. Send the prompt → get the fix → **you personally test it in the browser** → only then move to the next feature. Do not batch features together, even if they look related. This plan exists specifically because trusting written reports without personal testing caused real problems before (fake "Complete" status, broken XP everywhere). No feature is marked done here until you've clicked it yourself.

Current known root cause: several components were each writing their own `INSERT`/`SELECT` logic against Supabase independently, instead of going through one shared service — so the same wrong column name (`awarded_by`, `event_type`, `scheduled_at`, `streak_days`) got duplicated into multiple places. The fix is to centralize, not patch each spot separately.

---

## Feature 1 — Centralized XP Engine (fixes 4 broken spots at once)

**Why first**: `awarded_by`/`event_type` mismatches currently break Overview stats, the Gamification quick-XP buttons, the Live Session Workspace, and the AI Assistant's "Apply XP Bonus" — all from the same root cause.

**Prompt:**
```
Fix the XP system properly, in one centralized place, instead of patching each spot:

1. Create migration 0005_xp_events_created_by.sql adding column `created_by uuid
   nullable references profiles(id)` to xp_events.
2. Create core/services/xp.service.ts with one method:
   awardXp(studentId, classId, sessionId, points, sourceType, reason, metadata) that
   inserts into xp_events using the REAL column names (student_id, class_id,
   session_id, source_type, points, reason, metadata, created_by = current user id).
   No component should build its own xp_events insert from now on.
3. Update these to use XpService.awardXp() instead of their own direct insert:
   - GamificationComponent (quick XP buttons)
   - LiveWorkspaceComponent (live session XP)
   - AIService (Apply XP Bonus)
4. Fix InstructorOverviewComponent's SELECT on xp_events to drop the non-existent
   awarded_by column.
5. Replace every remaining use of `event_type` with `source_type` (the real column name).
6. Run npm run build, confirm 0 errors.
```

**You test this yourself:**
1. Go to `/instructor/gamification`, click a quick-XP button on a student. Open DevTools Console (F12) — no red errors.
2. Go to `/instructor` (Overview) — XP totals still load without errors.
3. Start a live session, award XP from the Live Workspace — no errors, XP shows up.
4. ✅ / ❌ — tell me which of these 3 worked and which didn't, with the exact error text if any failed.

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

## Feature 3 — Sessions creation fix

**Prompt:**
```
Fix SessionsListComponent:
1. It queries/inserts "scheduled_at" which doesn't exist — the real columns are
   started_at and ended_at. Update accordingly.
2. The sessions table requires session_number (NOT NULL) but it's never sent on
   insert. Auto-calculate it as (highest existing session_number for that class) + 1.
Run npm run build, confirm 0 errors.
```

**You test this yourself:**
1. Go to `/instructor/sessions`, create a new session for any class.
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

I'll check: are the two answers meaningfully different and actually responsive to each question, or do they look like the same canned fallback text repeated? This tells us definitively whether Gemini is really answering or the fallback is still firing.

---

## Feature 6 — Make `audit_log` actually get written to

Currently the table and the reading page both work, but nothing ever inserts a row — it will stay empty forever until this is done.

**Prompt:**
```
Add actual audit_log writes to the important admin/instructor actions that should be
tracked: role changes (AdminUsersComponent), manual XP adjustments if any exist outside
normal awardXp flow, student removal from a class, and class deletion/archiving.
Insert into audit_log with actor_id = current user, action, entity, entity_id, and
relevant metadata, for each of these actions. Run npm run build, confirm 0 errors.
```

**You test this yourself:**
1. As admin, change a user's role on `/admin/users`.
2. Go to `/admin/logs` — confirm a new row appeared describing that exact action.

---

## Feature 7 — Realtime, personally verified

**No code changes expected** — just proof.

**You test this yourself:**
1. Open the same live session in two browser tabs (or two browsers) side by side.
2. Award XP to a student from tab 1.
3. Watch tab 2 without refreshing — does it update, and how many seconds does it take?

Tell me exactly what you saw.

---

## Feature 8 — Notifications, personally verified

**You test this yourself:**
1. Award a badge to a student (or trigger whatever event generates a notification in the current code).
2. Click the 🔔 bell icon.
3. Tell me exactly what appeared, and how long after the action it showed up.

---

## Feature 9 — Demo data: final decision

Once Features 1–8 are confirmed working, decide:
- **Keep** the demo data permanently as example/seed data, clearly marked, OR
- **Delete** it now (Interim Step E cleanup) if you're done needing it for testing.

Tell me which, and I'll give you the exact prompt for whichever you pick.

---

## Feature 10 — Full re-audit (repeat of the audit that found all this)

**Prompt (only run after Features 1–6 are confirmed fixed):**
```
Re-run the exact same full-project audit as before (every route, every Supabase call,
compared column-by-column against the real schema in supabase/migrations/0001 to 0005).
Produce the same style master audit table. This is a re-check to confirm there are no
remaining mismatches after all the fixes in this stabilization plan.
```

---

## Feature 11 — Mada brand styling consistency pass

Only after everything above works correctly — styling on top of broken functionality is wasted effort.

**Prompt:**
```
Do a consistency pass across every screen (public home, auth, instructor, admin) to
confirm the approved brand tokens are applied everywhere: Primary Teal #14B8A6,
Warm background #FAF7F2, correct Dark Mode tokens (#0F172A background, #F8FAFC text).
List any screen/component still using old or hardcoded colors that don't match, and
fix them. Run npm run build, confirm 0 errors.
```

**You test this yourself:** click through every screen in both Light and Dark mode, in both Arabic and English, and confirm nothing looks visually broken or inconsistent.

---

## Feature 12 — Final honest documentation update

**Prompt:**
```
Update PROJECT_PLAN.md to reflect the TRUE current state after this entire
stabilization plan: what was actually broken, what was fixed, what was personally
verified by the project owner (not just described), and what remains (if anything).
Do not mark anything "Complete" unless it was explicitly confirmed working by me
during this stabilization plan, feature by feature.
```

---

### How to use this file
Go top to bottom, Feature 1 through 12, in order. Send me the result of each "You test this yourself" step before moving to the next feature's prompt. If a feature fails your personal test, we fix it before continuing — we do not move to the next feature with a known broken one behind us.
