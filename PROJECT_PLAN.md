# 🎯 Mada Quest — Complete Master Project Plan & Reference

> **This is the single source of truth for the project.** It contains everything: what the product is, what has been built, exactly what remains, the prompts to execute each remaining step, and the process for closing out every step (build → commit → update this file → push).
>
> **Current status**: Light Design System & Home Redesign complete ✅ | **Active phase**: Phase 8 (Advanced / Realtime) ⏳ | **Next up**: Phase 8 (8.1 Realtime Leaderboard, 8.2 Notifications, 8.3 Multi-Tenancy Review, 8.4 Final Review)

---

# PART 1 — PROJECT REFERENCE (CURRENT STATE & DESIGN SYSTEM)

## 1. Project Overview

**Mada Quest** is a generic, reusable gamified educational platform for managing classes and motivating students through XP, Levels, Badges, Achievements, Challenges, and a real-time Leaderboard. It serves four audiences — Instructors, Students, Parents, and Admins.

The platform is built as a **generic, brand-agnostic core engine** reusable across different academies, instructors, educational communities, and learning programs. Mada's presence on the public site is conceptually a **sponsor credit** — subtle, not a dominant advertising layer.

---

## 2. Generic Gamification Platform — Light Design System Specification

### 2.1 Core Visual Philosophy
- **Light Mode First Experience**: Warm Off-White main background (`#FAF7F2`), pure white cards (`#FFFFFF`), soft mint/teal secondary surfaces (`#ECFDF5` / `#CCFBF1`).
- **Target Audience**: Appeals to age 5 to 16+ without becoming childish ("Premium educational technology platform + playful gamification").
- **High Text Visibility & Contrast**: Primary text Deep Navy (`#0F172A`), high-contrast secondary text (`#475569`). Zero low-contrast or light gray text on white.

### 2.2 Color System Tokens
| Semantic Role | Token Variable | Hex Code | Usage |
|---|---|---|---|
| Primary Interaction | `--clr-primary` | `#0D9488` | Primary buttons, active nav, progress, interactive states |
| Primary Dark | `--clr-primary-dark` | `#0F766E` | Hover states |
| Light Teal | `--clr-primary-light` | `#CCFBF1` | Subtle teal sections |
| Soft Mint Surface | `--clr-surface-mint` | `#ECFDF5` | Secondary card & panel surfaces |
| Deep Navy | `--clr-navy` / `--clr-text` | `#0F172A` | Primary typography, headings, numbers |
| Energetic Accent | `--clr-accent` | `#F59E0B` | Amber accent for XP, rewards, streaks, podium, celebration |
| Warm Off-White | `--clr-bg` | `#FAF7F2` | Main application background |
| Pure White Surface | `--clr-surface` | `#FFFFFF` | Cards & modal surfaces |
| Muted Teal | `--clr-muted-teal` | `#6B8E8D` | Subtle icons & secondary highlights |
| High Contrast Text | `--clr-text-muted` | `#475569` | Secondary text, captions, subtitles |
| Border Token | `--clr-border` | `#E2E8F0` | Soft card & divider borders |

### 2.3 Text Visibility & Button Rules
- **On Teal Background**: Button text MUST be Pure White (`#FFFFFF`).
- **On Amber Background**: Button text MUST be Deep Navy (`#0F172A`).
- **Primary Text**: Deep Navy (`#0F172A`) everywhere — no light gray body text.

### 2.4 Typography System
- **Arabic**: Cairo (`font-family: var(--font-arabic)`)
- **English**: Inter (`font-family: var(--font-sans)`)
- **Monospace/Numbers**: JetBrains Mono (`font-family: var(--font-mono)`)
- **Hierarchy**: Display (bold impact), H1 (strong title), H2 (section), H3 (card), Body (readable 16px), Caption (13px high contrast).

### 2.5 Border Radii Hierarchy
- Small: `8px` (`--radius-sm`)
- Medium: `12px` (`--radius-md`)
- Large: `16px` (`--radius-lg`)
- Featured Cards: `20px` (`--radius-xl`)
- Hero / Major Sections: `24px` (`--radius-hero`)

### 2.6 Shadows & Elevation
- Extremely subtle, soft low-opacity shadows with large blur (`0 6px 16px rgba(15, 23, 42, 0.06)`).

### 2.7 Brand Usage Rule
- DO NOT hardcode Mada in routes, DB entities, class names, or component names.
- "Powered by Mada · بدعم من مدى" sponsor credit appears once, small and subtle, in the public Home Page footer only.

---

## 3. Tech Stack & Architecture

| Component | Technology | Notes |
|---|---|---|
| Frontend | Angular 22 (Standalone Components) | Signals + Reactive Forms |
| Styling | Pure Vanilla CSS | CSS Custom Properties, BEM |
| Theme | Dynamic `[data-theme]` | Light Mode First (`#FAF7F2` bg) |
| i18n & RTL | Custom `I18nService` | Arabic (RTL/Cairo), English (LTR/Inter) |
| Icons | Custom SVG `IconComponent` | Local inline SVGs |
| Backend | Supabase (PostgreSQL + Auth + RLS) | Numbered, documented migrations |
| State | Angular Signals | No external state library |

---

## 4. Working Process & Workflow

1. **One step at a time.** Only the step explicitly requested gets implemented.
2. **Discovery before build.** Inspect what already exists before writing code.
3. **Pure CSS, no Tailwind/SCSS. Local icons only.**
4. **Build verification.** `npm run build` must pass with zero errors.
5. **Security discipline.** RLS mandatory on sensitive tables, no secrets in frontend code.
6. **Standard Step-Closure Ritual (Section 4.1)**:
   `npm run build` → Git commit → Push to `https://github.com/abdelrahmaans/Quest.git` → Update `PROJECT_PLAN.md`.

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
│   │   │   └── services/ (supabase.service.ts, ai.service.ts, theme.service.ts, i18n.service.ts)
│   │   ├── shared/ui/ (icon/, ai-assistant-drawer/, theme-toggle.ts, lang-toggle.ts)
│   │   └── features/
│   │       ├── auth/ (login, signup, forgot-password, reset-password)
│   │       ├── home/ (home-page, dashboard)
│   │       ├── instructor/ (shell, overview, classes, gamification, leaderboard, sessions)
│   │       └── admin/ (shell, overview, users, config, logs)
│   ├── styles.css
│   └── environments/ (environment.ts, environment.prod.ts)
├── supabase/
│   ├── functions/
│   │   └── ai-gamification-assistant/ (index.ts)
│   ├── migrations/ (0001_initial_schema.sql, 0002_rls_and_auth_trigger.sql, 0003_admin_policies_and_fixes.sql)
│   └── seed/ (temp_demo_seed.sql)
├── angular.json / package.json
└── PROJECT_PLAN.md   ← this file
```

---

## 6. Database & Security Status

- 22 core tables (`0001_initial_schema.sql`).
- RLS + auth trigger (`0002_rls_and_auth_trigger.sql`).
- `is_admin()` helper, full admin policies, `audit_log` (admin-read-only), `organization_id` columns, `xp_events` corrected to **append-only ledger** (`0003_admin_policies_and_fixes.sql`).
- All 13 existing screens confirmed reading/writing real Supabase data through anon key.

---

## 7. Phases Progress

```
[ Phase 0: Setup ]                          ✅ Complete
[ Phase 1: Foundation & Auth ]              ✅ Complete
[ Phase 2: Landing Page ]                   ✅ Complete (Redesigned with Light System)
[ Phase 3: Instructor Shell ]               ✅ Complete
[ Phase 4: Gamification Engine ]            ✅ Complete
[ Phase 5: Live Session Workspace ]         ✅ Complete
[ Phase 6: Admin Dashboard ]                ✅ Complete
[ Interim: Verify / Seed / Brand ]          ✅ Complete
[ Phase 7: AI Gamification Assistant ]      ✅ Complete (Steps 7.1, 7.2, 7.3)
[ Light Design System & Home Redesign ]     ✅ Complete
[ Phase 8: Advanced / Realtime ]            ⏳ Active Phase (Next)
    Step 8.1 — Realtime Leaderboard         ⏳ Pending
    Step 8.2 — In-App Notifications         ⏳ Pending
    Step 8.3 — Multi-Tenancy Review         ⏳ Pending
    Step 8.4 — Final Full-Project Review    ⏳ Pending
```

---

## 8. Detailed Accomplishments Log

- **Phase 0 to 6**: Scaffolded Angular 22 standalone app, Supabase client, RLS migrations, Auth, Instructor dashboard, Live workspace, Admin dashboard.
- **Interim Phase**: Verified real Supabase connectivity, created additive seed data in `supabase/seed/temp_demo_seed.sql`, and cleaned up testing bypass code.
- **Phase 7 (AI Assistant)**: Built secure Supabase Edge Function `ai-gamification-assistant`, `AIService`, and `AiAssistantDrawerComponent` with explicit human-confirmation modals.
- **Light Design System Pass**: Embedded full 45-point Generic Gamification Platform specification in `PROJECT_PLAN.md`. Applied Light Mode First tokens (`#FAF7F2` warm bg, `#FFFFFF` cards, `#ECFDF5` mint surfaces, `#0F172A` deep navy high-contrast text, `#0D9488` teal, `#F59E0B` amber). Completely redesigned public Home Page (`/home`) with interactive search (Student Code / Group Code), leaderboard tabs & podium, achievers feed, collectible badges, active challenges, and sponsor credit.

---
*This file is the single source of truth for Mada Quest.*