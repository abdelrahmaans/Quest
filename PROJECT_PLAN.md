# 🎯 Mada Quest — Master Project Reference & Roadmap

> **Current status**: Phases 0–6 complete ✅ | **Active phase**: Interim — Verification, Demo Data & Mada Brand Styling ⏳ | **Next**: Phase 7 (AI Assistant)

---

## 1. Project Overview

**Mada Quest** is a gamified educational platform for managing classes, motivating students through XP, Levels, Badges, Achievements, Challenges, and a real-time Leaderboard. It serves four audiences — Instructors, Students, Parents, and Admins — and is designed to feel like a real product, not a demo dashboard.

Mada Quest is built as a **generic, brand-agnostic core engine**. Mada Academy is the primary brand and the visual identity is modeled on Mada, but the platform must remain reusable for other academies later. Mada's presence on the public site is conceptually that of a **sponsor** — a subtle, tasteful "Powered by Mada" presence, not a dominant advertising layer.

---

## 2. Brand Identity & Design System (Mada)

> ⚠️ **Pending**: actual Mada brand assets (logo files, official brand guide) have not been supplied yet. The palette and rules below are the last agreed baseline. Once real assets are provided, this section must be updated and the styling pass re-validated against them.

### 2.1 Color Palette

**Light Mode**
| Token | Hex | Usage |
|---|---|---|
| Primary Teal | `#0D9488` | Brand identity, primary actions |
| Navy | `#0F172A` | Hierarchy, headings, dark text |
| Amber | `#F59E0B` | Reward moments, celebration accents only |
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
- Arabic: **Cairo**
- English: **Inter**
- Code / monospace: **JetBrains Mono**

### 2.3 Visual Language
- Rounded cards, soft borders, subtle shadows, clean typography.
- Teal for brand accents, Mint for soft surfaces, Navy for text hierarchy, small Amber accents reserved for reward/celebration moments only (XP gain, level up, badge unlock).
- Tech-inspired geometry allowed as decorative motifs: `{}`, `<>`, nodes, paths, grids, brackets, dots.
- Avoid: casino aesthetics, gambling-style mechanics, aggressive loot-box visuals, childish overload.

### 2.4 "Powered by Mada" — Sponsor Concept
- Mada Quest is the primary product identity. Mada appears as a **sponsor-style credit**, not a headline brand.
- Use "Powered by Mada" (or Arabic equivalent "بدعم من مدى") **once**, small, in the footer or a subtle promotional strip — never repeated across every page or screen.
- No aggressive banner ads, no pop-ups, no repeated CTAs pushing Mada as a company. The public Home Page keeps one clear value proposition and one clear CTA, per the original product spec.

### 2.5 Styling Implementation Constraints (already enforced in this codebase)
- **Plain CSS only** — CSS Custom Properties + BEM. No Tailwind, no SCSS preprocessors.
- Dark mode via `[data-theme]` attribute switch, persisted via `ThemeService` + `localStorage`, no flash on load.
- All icons via the local inline-SVG `IconComponent` (`icons.constants.ts`) — no external icon library calls.

---

## 3. Tech Stack & Architecture

| Component | Technology | Notes |
|---|---|---|
| Frontend Framework | Angular 22 (Standalone Components) | Signals (`signal`, `computed`, `effect`) + Reactive Forms |
| Styling | Pure Vanilla CSS | CSS Custom Properties, BEM, no Tailwind/SCSS |
| Theme | Dynamic `[data-theme]` | `ThemeService`, `localStorage` persistence |
| i18n & RTL | Custom `I18nService` | Arabic (RTL, Cairo) / English (LTR, Inter), no external i18n library |
| Icons | Custom SVG `IconComponent` | Local Lucide-based inline SVGs |
| Backend | Supabase (PostgreSQL + Auth + RLS) | Numbered, documented migrations |
| State Management | Angular Signals | No external state library |

---

## 4. Development Rules & Process

1. **One step at a time** — implementation proceeds phase by phase; no new phase starts before the current one is confirmed and tested.
2. **Discovery before build** — every phase starts with an inspection of existing files, Supabase tables, and services before writing new code.
3. **Pure CSS standard** — no Tailwind, no SCSS.
4. **Local icon system only** — `<app-icon name="..." />`, no external icon packages.
5. **Build verification** — `npm run build` after every step; zero TypeScript/HTML/CSS errors required before moving on.
6. **Docs & Git sync** — this reference file and Git commits are updated at the end of every phase, pushed to `https://github.com/abdelrahmaans/Quest.git`.
7. **Security discipline** — RLS mandatory on every sensitive table, no secrets in frontend code, server-authoritative XP/level/badge calculations.
8. **No permanent shortcuts** — any temporary measure introduced for testing/demo purposes (auth bypass, seed data, mock flags) must be clearly marked and has a mandatory, tracked reversal step (see Section 9).

---

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
│   │   ├── shared/
│   │   │   └── ui/
│   │   │       ├── icon/ (icon.ts, icons.constants.ts)
│   │   │       ├── theme-toggle.ts
│   │   │       └── lang-toggle.ts
│   │   └── features/
│   │       ├── auth/ (login, signup, forgot-password, reset-password)
│   │       ├── home/ (home-page, dashboard)
│   │       ├── instructor/ (shell, overview, classes, gamification, leaderboard, sessions)
│   │       └── admin/ (shell, overview, users, config, logs)
│   ├── styles.css (Global design tokens & reset)
│   └── environments/ (environment.ts, environment.prod.ts)
├── supabase/
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       ├── 0002_rls_and_auth_trigger.sql
│       └── 0003_admin_policies_and_fixes.sql
├── angular.json
├── package.json
└── MADA-QUEST-MASTER-REFERENCE.md   (this file)
```

---

## 6. Database & Security Status

- 22 core tables created in `0001_initial_schema.sql`.
- RLS enabled and auth trigger (auto-profile-on-signup) added in `0002_rls_and_auth_trigger.sql`.
- Admin full-access policies via `is_admin()` helper, `audit_log` table (admin-read-only, no direct insert), `organization_id` columns added, and `xp_events` corrected to an **append-only ledger** (insert-only for instructors, no update/delete) in `0003_admin_policies_and_fixes.sql`.
- **Outstanding verification**: end-to-end confirmation that the deployed Angular app can actually read/write through these policies as each role, using real session tokens (not just SQL Editor checks). See Section 9, Step A.

---

## 7. Phases Progress

```
[ Phase 0: Setup ]                          ✅ Complete
[ Phase 1: Foundation & Auth ]              ✅ Complete
[ Phase 2: Landing Page ]                   ✅ Complete
[ Phase 3: Instructor Shell ]               ✅ Complete
[ Phase 4: Gamification Engine ]            ✅ Complete
[ Phase 5: Live Session Workspace ]         ✅ Complete
[ Phase 6: Admin Dashboard ]                ✅ Complete
[ Interim: Verify / Demo / Mada Styling ]   ⏳ Active phase (see Section 9)
[ Phase 7: AI Assistant ]                   ⏳ Pending
[ Phase 8: Advanced Realtime ]              ⏳ Pending
```

---

## 8. Detailed Accomplishments (Phases 0–6, condensed)

- **Phase 0**: Angular 22 standalone project scaffolded; Supabase client wired to environment variables; `core/`, `shared/`, `features/` structure established.
- **Phase 1**: 22-table schema, RLS, auth trigger, admin policies, append-only `xp_events`; `AuthService`, `authGuard`, `roleGuard`; `ThemeService`; `I18nService` (AR/EN, RTL/LTR).
- **Phase 2**: Public landing page at `/home` with 7 sections.
- **Phase 3**: Instructor shell (collapsible dark sidebar) + live overview dashboard pulling real Supabase stats.
- **Phase 4**: Class management (cards + creation form), quick XP-award buttons (+5 to +100) with reason tags and a live activity feed, leaderboard with podium view for top 3 + full ranking table.
- **Phase 5**: Session list (`/instructor/sessions`) with status filters and creation form; live session screen (`/instructor/sessions/:id/live`) with live timer HUD, attendance (P/L/A), batched live XP bar, live activity stream.
- **Phase 6**: Admin shell (obsidian/gold sidebar), system-wide overview stats, user/role management (`/admin/users`), level & XP configuration (`/admin/config`), audit log viewer (`/admin/logs`).

---

## 9. ⏳ ACTIVE PHASE — Verification, Demo Data & Mada Brand Styling

This phase exists **specifically** to let the project owner log in, click through every existing screen, confirm the backend is actually wired correctly end-to-end, see the app populated with realistic content, and review the Mada visual identity applied across the whole app — before Phase 7 adds new complexity on top.

Every temporary measure below **must** be clearly flagged in code (comment tag `// TEMP-TESTING:`) so Step E can find and remove all of them reliably.

### Step A — Backend Connectivity Verification (read-only, no risk)

```
Do a full end-to-end verification that the Angular app is actually reading/writing
Supabase correctly through real user sessions (not just SQL Editor checks):

1. For each existing service (AuthService, and any Class/Session/XP/Badge/Leaderboard
   services built so far), list which Supabase tables/RPCs they call.
2. Confirm the Supabase client in supabase.service.ts is using the anon key only
   (never a service-role key) and that environment.prod.ts has real values, not empty
   strings, before this is ever deployed.
3. Log in as an existing instructor account and, for every existing instructor screen
   (overview, classes, gamification, leaderboard, sessions, live session), confirm data
   is actually coming from Supabase and not from any hardcoded/mock arrays left in
   components. Flag and list any component you find using mock/hardcoded data instead
   of a real Supabase call.
4. Log in as an admin account and repeat the same check for every admin screen
   (overview, users, config, logs).
5. Give me a table: Screen | Data source confirmed real? | Issues found.

Do not fix anything yet in this step — just report findings.
```

### Step B — Temporary Auth Bypass for Internal Testing

```
I need to be able to click through every route (instructor + admin) quickly without
logging in each time, purely for my own manual testing. This must be temporary,
clearly isolated, and trivial to remove later.

1. Add a single boolean flag, e.g. `TEMP_TESTING_BYPASS_AUTH`, in a clearly named file
   (e.g. core/config/temp-testing.flag.ts), defaulting to false.
2. When true, authGuard and roleGuard should allow access without a real session,
   but must inject a mock "current user" (with a role I can control via a query param
   or a small dev-only role switcher UI) so role-specific screens still render correctly.
3. Tag every single line touched for this with `// TEMP-TESTING:` comments.
4. This flag must default to false and must NEVER be true in environment.prod.ts logic
   — make it physically impossible for this bypass to be active in a production build
   (e.g. gate it behind `!environment.production` as well as the flag).
5. Add a small floating dev-only badge in the corner of the screen when the bypass is
   active, so it's visually obvious testing mode is on.

Confirm to me explicitly: with the flag OFF (default), the app behaves exactly as
before this change, with real auth enforced.
```

### Step C — Demo/Seed Data

```
Create a seed script (SQL or a Supabase-safe seeding function, kept in
supabase/seed/temp_demo_seed.sql) that populates realistic demo data so every screen
has something to show:

- 2 demo instructors, 1 demo admin (or reuse existing test accounts if present).
- 3 demo classes across different tracks and age ranges.
- ~15 demo students enrolled across those classes (some in more than one class).
- A handful of past sessions (completed) and 1 upcoming session per class.
- xp_events history for each student (varied event_type: attendance, challenge, quiz,
  peer_help) so the XP breakdown and leaderboard are not empty/flat.
- A few badges and achievements, some already awarded to demo students.
- 1-2 active/scheduled challenges.

Rules:
- Never touch or overwrite any real account/data that might already exist — this must
  be purely additive, using clearly identifiable demo records (e.g. a `is_demo boolean`
  flag column added via a small migration, or a naming convention like "Demo:" prefix
  on names/codes) so Step E can find and delete exactly these rows and nothing else.
- Respect RLS — insert as if through the normal application flow / RPCs where XP is
  involved, not raw table writes that bypass the append-only ledger rules we set up.

After running it, confirm row counts inserted per table.
```

### Step D — Apply Mada Brand Styling Across the App

```
Apply the Mada design system (Section 2 of MADA-QUEST-MASTER-REFERENCE.md) consistently
across every existing screen — public home, auth pages, instructor shell + all instructor
screens, admin shell + all admin screens.

1. Audit styles.css and every component's CSS for the color tokens currently in use;
   list any hardcoded colors that don't match the documented Light/Dark palettes.
2. Bring every screen in line with: Primary Teal #0D9488, Navy #0F172A, Amber #F59E0B
   (reward moments only), Mint #CCFBF1, correct Light and Dark mode tokens as documented
   — Dark mode must remain a dedicated system, not an inverted Light mode.
3. Typography: Cairo for Arabic, Inter for English, JetBrains Mono for any code/monospace
   display, applied consistently everywhere, not just on the landing page.
4. Add the "Powered by Mada" sponsor credit exactly once, small and subtle, in the public
   Home Page footer — nowhere else, no repetition, no banner-style treatment.
5. Confirm every screen still passes the Pure CSS constraint (no Tailwind classes, no SCSS
   leaking back in) and still respects RTL/LTR switching correctly after the styling pass.
6. Run npm run build and confirm zero errors after the full pass.

Show me a before/after summary per screen (what colors/fonts were wrong and what you
changed), not just a "done" confirmation.
```

### Step E — Cleanup (run this LAST, only after manual review is done)

```
This is the final cleanup step for the interim testing phase. Only run this once I
explicitly confirm I'm done reviewing with the auth bypass and demo data.

1. Search the entire codebase for every `// TEMP-TESTING:` tag introduced in Step B and
   fully remove that code (the bypass flag file, the guard modifications, the dev-only
   badge) — restore authGuard and roleGuard to enforcing real Supabase auth exactly as
   they did before Step B, with no leftover dead code or commented-out blocks.
2. Delete every demo/seed record inserted in Step C, identified via the `is_demo` flag
   or naming convention used — verify row counts after deletion match zero remaining
   demo rows, and confirm no real data was touched.
3. Remove supabase/seed/temp_demo_seed.sql from the active migration path (keep it in
   a /supabase/seed folder for future reuse if useful, but make sure it is never
   auto-run against production).
4. Run npm run build and do a final click-through confirming: real login is required
   again, no demo data appears anywhere, and the Mada styling from Step D is fully intact.
5. Update this reference file's Section 7 progress table to mark this phase ✅ Complete,
   and commit with a clear message documenting the cleanup.

Give me an explicit confirmation checklist that all of the above is verified true.
```

---

## 10. Next Phases (after this interim phase closes)

### Phase 7 — AI Gamification Assistant
- Session-context-aware suggestion engine (challenges, XP rules, engagement fixes) per the age-safety and human-approval rules from the original product spec.
- AI never auto-applies changes to XP rules, scores, badges, or class configuration without explicit instructor/admin confirmation.

### Phase 8 — Advanced / Realtime
- Supabase Realtime for live leaderboard and session events (scoped subscriptions only, not blanket table subscriptions).
- In-app notifications (badge unlocked, achievement unlocked, level up, challenge start/end, session completed).
- Student-facing public view (achievement tree, badge showcase) via Student Code lookup.

---

## 11. How to Run

```bash
# Development server
npm run start

# Production build
npm run build
```

---
*This document is the single source of truth for Mada Quest's architecture, brand system, and roadmap. Update it at the end of every phase.*