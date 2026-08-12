# 🎯 Mada Quest — Complete Master Project Plan & Reference

> **This is the single source of truth for the project.** It contains everything: what the product is, what has been built, exactly what remains, the prompts to execute each remaining step, and the process for closing out every step (build → commit → update this file → push).
>
> **Current status**: Phases 0–6 & Interim Phase complete ✅ | **Active phase**: Phase 7 (AI Assistant) — Step 7.1 done ✅, Step 7.2 in progress ⏳ | **Next up**: Phase 7.2 Backend Edge Function → 7.3 Frontend UI → Phase 8 (Realtime & Notifications)

---

# PART 1 — PROJECT REFERENCE (current state)

## 1. Project Overview

**Mada Quest** is a gamified educational platform for managing classes and motivating students through XP, Levels, Badges, Achievements, Challenges, and a real-time Leaderboard. It serves four audiences — Instructors, Students, Parents, and Admins.

The platform is a **generic, brand-agnostic core engine**. Mada Academy is the primary brand and the visual identity is modeled on Mada, but the platform stays reusable for other academies later. Mada's presence on the public site is conceptually a **sponsor credit** — subtle, not a dominant advertising layer.

## 2. Brand Identity & Design System (Mada)

> ⚠️ Actual Mada brand assets (logo files, official brand guide) have not been supplied yet. The palette below is the last agreed baseline. If real assets arrive, update this section and re-run the styling pass (Interim Step D) against them.

### 2.1 Color Palette

**Light Mode**
| Token | Hex | Usage |
|---|---|---|
| Primary Teal | `#0D9488` | Brand identity, primary actions |
| Navy | `#0F172A` | Hierarchy, headings, dark text |
| Amber | `#F59E0B` | Reward moments only (XP gain, level up, badge unlock) |
| Mint | `#CCFBF1` | Soft surfaces |
| Background | `#FAFAFA` | Page background |
| White | `#FFFFFF` | Cards / surfaces |
| Border | `#E2E8F0` | Dividers, card borders |
| Slate | `#64748B` | Secondary text |

**Dark Mode** (a dedicated system — never an inverted Light Mode)
| Token | Hex | Usage |
|---|---|---|
| Background | `#0F172A` | Page background |
| Surface | `#111827` | Cards |
| Elevated | `#1E293B` | Modals, elevated panels |
| Border | `#334155` | Dividers |
| Text | `#F8FAFC` | Primary text |
| Secondary Text | `#CBD5E1` | Secondary text |
| Muted Text | `#94A3B8` | Muted/disabled text |
| Teal | `#0D9488` | Brand identity |
| Soft Teal | `#134E4A` | Subtle brand surfaces |
| Amber | `#F59E0B` | Reward moments |

### 2.2 Typography
Arabic: **Cairo** · English: **Inter** · Code/monospace: **JetBrains Mono**

### 2.3 Visual Language
Rounded cards, soft borders, subtle shadows. Teal for brand accents, Mint for soft surfaces, Navy for text hierarchy, Amber reserved strictly for reward/celebration moments. Optional decorative tech motifs: `{}`, `<>`, nodes, paths, grids, brackets, dots. Avoid casino aesthetics, loot-box visuals, or childish overload.

### 2.4 "Powered by Mada" — Sponsor Concept
Used once, small, in the public Home Page footer only — never repeated, never a banner, never a pop-up. Mada Quest remains the headline identity.

### 2.5 Implementation Constraints (already enforced in this codebase)
- **Plain CSS only** — CSS Custom Properties + BEM. No Tailwind, no SCSS.
- Dark mode via `[data-theme]`, persisted via `ThemeService` + `localStorage`, no flash on load.
- All icons via the local inline-SVG `IconComponent` (`icons.constants.ts`) — no external icon libraries.

## 3. Tech Stack & Architecture

| Component | Technology | Notes |
|---|---|---|
| Frontend | Angular 22 (Standalone Components) | Signals + Reactive Forms |
| Styling | Pure Vanilla CSS | CSS Custom Properties, BEM |
| Theme | Dynamic `[data-theme]` | `ThemeService` |
| i18n & RTL | Custom `I18nService` | Arabic (RTL/Cairo), English (LTR/Inter) |
| Icons | Custom SVG `IconComponent` | Local inline SVGs |
| Backend | Supabase (PostgreSQL + Auth + RLS) | Numbered, documented migrations |
| State | Angular Signals | No external state library |

## 4. Working Process & Workflow

This is how every session on this project runs, without exception:

1. **One step at a time.** Only the step explicitly requested gets implemented — no bundling, no "while I was at it" additions.
2. **Discovery before build.** Every step starts by inspecting what already exists (files, tables, services) before writing anything new.
3. **Pure CSS, no Tailwind/SCSS. Local icons only.**
4. **Build verification.** `npm run build` must pass with zero errors before a step is considered closed.
5. **Security discipline.** RLS mandatory on sensitive tables, no secrets in frontend code, server-authoritative XP/level/badge calculations, no permanent shortcuts — temporary code is tagged `// TEMP-TESTING:` and has a tracked reversal step.
6. **Every step closes with the same ritual** (see 4.1 below) — build check → git commit → update this file → push.
7. **Cross-checking:** significant milestones (end of a phase, or any non-trivial architectural decision) get reported back for review before the next phase starts, especially before Phase 4-equivalent work (anything touching the gamification engine core).

### 4.1 Standard Step-Closure Ritual (use this prompt after finishing ANY step)

```
This step is functionally done. Now close it out properly:

1. Run npm run build and confirm zero TypeScript/HTML/CSS errors. If there are errors,
   fix them before continuing — do not close the step with a broken build.
2. Git commit with a structured message following this convention:
   "<phase-tag>: <short description>"
   Examples: "interim/step-b: add temporary auth bypass for internal testing",
             "phase7/step-2: add AIService and Edge Function for gamification suggestions"
   The commit body should list the files changed and a one-line reason for each.
3. Push the commit to https://github.com/abdelrahmaans/Quest.git.
4. Update PROJECT_PLAN.md:
   - Mark the step/phase just completed with ✅ in the relevant checklist.
   - Add a short entry under "Detailed Accomplishments" describing what was actually
     built (not just "done" — 2-4 lines of real detail, same style as existing entries).
   - Update the "Current status" line at the very top of the file.
5. Show me: the final build output confirmation, the exact commit message used, and the
   diff of what changed in PROJECT_PLAN.md.
```

Run this after **every** step in Part 2 below, not just at the end of a phase.

## 5. Current Directory Structure

```
QUEST/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/ (auth.service.ts)
│   │   │   ├── guards/ (auth.guard.ts, role.guard.ts)
│   │   │   ├── interceptors/ (auth.interceptor.ts)
│   │   │   ├── models/ (role.enum.ts, user.model.ts)
│   │   │   └── services/ (supabase.service.ts, theme.service.ts, i18n.service.ts, translations.ts)
│   │   ├── shared/ui/ (icon/, theme-toggle.ts, lang-toggle.ts)
│   │   └── features/
│   │       ├── auth/ (login, signup, forgot-password, reset-password)
│   │       ├── home/ (home-page, dashboard)
│   │       ├── instructor/ (shell, overview, classes, gamification, leaderboard, sessions)
│   │       └── admin/ (shell, overview, users, config, logs)
│   ├── styles.css
│   └── environments/ (environment.ts, environment.prod.ts)
├── supabase/
│   ├── migrations/ (0001_initial_schema.sql, 0002_rls_and_auth_trigger.sql, 0003_admin_policies_and_fixes.sql)
│   └── seed/ (temp_demo_seed.sql)
├── angular.json / package.json
└── PROJECT_PLAN.md   ← this file
```

## 6. Database & Security Status

- 22 core tables (`0001_initial_schema.sql`).
- RLS + auth trigger (`0002_rls_and_auth_trigger.sql`).
- `is_admin()` helper, full admin policies, `audit_log` (admin-read-only), `organization_id` columns, `xp_events` corrected to **append-only ledger** (`0003_admin_policies_and_fixes.sql`).
- **Verified (Interim Step A, ✅ complete)**: all 13 existing screens confirmed reading/writing real Supabase data through the anon key, zero mock data found anywhere in the codebase. `environment.prod.ts` still holds empty placeholder keys — flagged, not blocking, must be filled before any real deployment.

## 7. Phases Progress

```
[ Phase 0: Setup ]                          ✅ Complete
[ Phase 1: Foundation & Auth ]              ✅ Complete
[ Phase 2: Landing Page ]                   ✅ Complete
[ Phase 3: Instructor Shell ]               ✅ Complete
[ Phase 4: Gamification Engine ]            ✅ Complete
[ Phase 5: Live Session Workspace ]         ✅ Complete
[ Phase 6: Admin Dashboard ]                ✅ Complete
[ Interim: Verify / Seed / Brand ]          ✅ Complete
    Step A — Backend connectivity audit     ✅ Complete
    Step B — Temporary auth bypass          ✅ Complete (Cleaned up in Step E)
    Step C — Demo/seed data                 ✅ Complete (In supabase/seed/temp_demo_seed.sql)
    Step D — Apply Mada brand styling       ✅ Complete (Teal/Navy/Amber, Cairo/Inter/Mono, Powered by Mada)
    Step E — Cleanup (revert temp code)     ✅ Complete (0 TEMP-TESTING tags remain, build clean)
[ Phase 7: AI Gamification Assistant ]      ⏳ Active Phase
    Step 7.1 — Discovery                    ✅ Complete
    Step 7.2 — Backend: Secure AI Endpoint  ⏳ Active (Next)
    Step 7.3 — Frontend: AIService & UI     ⏳ Pending
[ Phase 8: Advanced / Realtime ]            ⏳ Pending
```

## 8. Detailed Accomplishments Log

- **Phase 0**: Angular 22 standalone project scaffolded; Supabase client wired to environment variables; `core/`, `shared/`, `features/` structure established.
- **Phase 1**: 22-table schema, RLS, auth trigger, admin policies, append-only `xp_events`; `AuthService`, `authGuard`, `roleGuard`; `ThemeService`; `I18nService` (AR/EN, RTL/LTR).
- **Phase 2**: Public landing page at `/home` with 7 sections.
- **Phase 3**: Instructor shell (collapsible dark sidebar) + live overview dashboard pulling real Supabase stats.
- **Phase 4**: Class management (cards + creation form), quick XP-award buttons (+5 to +100) with reason tags and a live activity feed, leaderboard with podium view for top 3 + full ranking table.
- **Phase 5**: Session list (`/instructor/sessions`) with status filters and creation form; live session screen (`/instructor/sessions/:id/live`) with live timer HUD, attendance (P/L/A), batched live XP bar, live activity stream.
- **Phase 6**: Admin shell (obsidian/gold sidebar), system-wide overview stats, user/role management (`/admin/users`), level & XP configuration (`/admin/config`), audit log viewer (`/admin/logs`).
- **Interim Phase**: Completed Step A (100% real Supabase connectivity audit), Step B (temporary testing auth bypass & dev role switcher), Step C (additive demo seed data in `supabase/seed/temp_demo_seed.sql`), Step D (Mada brand palette, Cairo/Inter/JetBrains Mono typography, "Powered by Mada" sponsor credit), and Step E (full cleanup of testing bypass code & 0 remaining `TEMP-TESTING` tags).
- **Phase 7 / Step 7.1 (Discovery)**: Audited all existing tables (`classes`, `students`, `sessions`, `attendance`, `xp_events`, `challenges`, `badges`) and services (`AuthService`, `SupabaseService`) for available context. Determined required AI architecture: Supabase Edge Function to protect server-side AI API keys, structured JSON response schema for age-safe gamification suggestions, frontend `AIService`, and explicit human confirmation before writing to Supabase.

---

# PART 2 — FULL REMAINING PLAN, STEP BY STEP WITH PROMPTS

## 9. Phase 7 — AI Gamification Assistant (Active Phase)

### Step 7.1 — Discovery ✅ Complete

Audited all existing data models and services to define the context payload and Edge Function requirements.

### Step 7.2 — Backend: Secure AI Endpoint

```
Build the AI integration server-side, never calling the Claude/AI API directly from the
Angular frontend with an exposed key:

1. Create a Supabase Edge Function (e.g. `ai-gamification-assistant`) that receives a
   request from the frontend containing: session context (class, age group, track, level,
   objectives, active gamification profile), recent performance data (attendance, XP
   distribution, challenge history, engagement trend), and the instructor's free-text
   question.
2. The Edge Function holds the AI API key as a server-side secret (never shipped to the
   client), builds a system prompt that constrains the assistant to be an educational
   gamification advisor only, and explicitly instructs it to consider age, track,
   difficulty, session duration, student maturity, and competition intensity — and to
   never recommend aggressive competition for young children.
3. The function returns a structured JSON response: title, objective, duration,
   instructions, gamification suggestion, xp_reward, badge suggestion, challenge
   suggestion, materials, instructor_steps, expected_student_behavior.
4. Add basic rate limiting / auth check so only authenticated instructors can call this
   function (verify the Supabase session token server-side).

Confirm the API key is not present anywhere in the Angular bundle (check the built
output, not just the source).
```

### Step 7.3 — Frontend: AIService + Assistant UI

```
Build the instructor-facing AI Assistant:

1. AIService in Angular calls the Edge Function from Step 7.2, passing real session/class
   context pulled from existing services (never fabricated placeholder data).
2. Add an "AI Assistant" panel inside the instructor area (e.g. accessible from the
   gamification screen and from the live session workspace) with a prompt box and a few
   ready-made example prompts ("Give me a 10-minute challenge", "How can I motivate this
   class?", "Suggest XP rewards").
3. Render the structured response clearly (use the existing card/section styling from
   the Mada design system, not a raw JSON dump).
4. Add an "Apply" action per suggestion type (e.g. apply as a new challenge, apply as a
   new gamification rule) that requires an explicit confirmation dialog before writing
   anything to Supabase — the AI must never modify XP rules, scores, badges, or class
   configuration without that explicit instructor confirmation.

Test: ask for a suggestion for a real class in the system, confirm the context sent was
accurate, and confirm "Apply" only writes data after explicit confirmation.
```

→ Run the **Standard Step-Closure Ritual** (Section 4.1) after each of 7.1, 7.2, 7.3.

---

## 10. Phase 8 — Advanced / Realtime

### Step 8.1 — Realtime Leaderboard & Session Events

```
Enable Supabase Realtime selectively:

1. Subscribe to realtime updates scoped to: the active class's leaderboard during a live
   session, and session events (new XP, badge awarded) within an open live session
   workspace only. Do not subscribe broadly to entire tables.
2. Ensure subscriptions are properly torn down (unsubscribe) when the user leaves the
   relevant page (ngOnDestroy), so no orphaned channels remain.

Test: open the live session workspace in two browser tabs, award XP from one, and confirm
the other tab updates live without a manual refresh.
```

### Step 8.2 — In-App Notifications

```
Build a notifications system:
1. Use the `notifications` table (create it if not already present) + a NotificationService.
2. Generate notifications for: badge unlocked, achievement unlocked, level up, challenge
   starts, challenge ends, session completed.
3. Add a simple bell icon + dropdown list in the shell header (instructor and admin).
   No email/WhatsApp yet — in-app only for this phase.

Test: trigger a challenge start and confirm a real notification appears at the right time.
```

### Step 8.3 — Multi-Tenancy Preparation Review

```
Review the `organization_id` columns already added to profiles/students/classes in
migration 0003. Document (in this master plan file, new subsection) exactly how
multi-tenancy would be activated later without breaking existing data. Do not build any
organizations UI yet — documentation and a readiness check only.
```

### Step 8.4 — Final Full-Project Review

```
Do a full final review of the entire project against the original non-negotiable rules
and success criteria:
1. Walk through a complete Instructor flow end-to-end (create class → add students →
   session → XP → challenge → badge → complete session → analytics → AI suggestion).
2. Confirm RLS is enforced correctly for every role by testing with real accounts, not
   just reading policy SQL.
3. Confirm performance basics: lazy loading where appropriate, no redundant Supabase
   calls, images/assets reasonably optimized.
4. Confirm security: no secrets in the frontend bundle, service-role key never exposed,
   XP/level/badge calculations are server-authoritative everywhere.
5. Produce a final punch-list of anything remaining before this is considered
   launch-ready, and update PROJECT_PLAN.md's status table to reflect it.
```

→ Run the **Standard Step-Closure Ritual** (Section 4.1) after each step in Phase 8.

---

## 11. How to Resume Work in a New Session

If a new chat/session ever needs to pick this project back up, use this prompt first:

```
You're continuing work on "Mada Quest" (Mada Quest), an Angular + Supabase gamified
education platform. Before anything else, read PROJECT_PLAN.md in the project
root fully — it is the single source of truth for what's built, what's in progress, and
what's next, including exact prompts for every remaining step. Inspect the actual codebase
to confirm the file's "Current status" line still matches reality (things may have moved
since the file was last updated). Report back your understanding of exactly where we are
before executing anything.
```

---

## 12. How to Run

```bash
npm run start   # development server
npm run build   # production build
```

---
*This file is the single source of truth for Mada Quest. Update it — status line, checklist, and accomplishments log — at the end of every single step, per Section 4.1.*