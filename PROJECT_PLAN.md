# 🎯 Mada Quest — Complete Master Project Plan & Reference

> **This is the single source of truth for the project.** It contains everything: what the product is, what has been built, exactly what remains, the prompts to execute each remaining step, and the process for closing out every step (build → commit → update this file → push).
>
> **Current status**: Step 8.1 Realtime Leaderboard & Session Events complete ✅ | **Active phase**: Phase 8 (Advanced / Realtime) ⏳ | **Next up**: Step 8.2 In-App Notifications

---

# PART 1 — PROJECT REFERENCE (CURRENT STATE & DESIGN SYSTEM)

## 1. Project Overview

**Mada Quest** is a generic, reusable gamified educational platform for managing classes and motivating students through XP, Levels, Badges, Achievements, Challenges, and a real-time Leaderboard. It serves four audiences — Instructors, Students, Parents, and Admins.

The platform is built as a **generic, brand-agnostic core engine** reusable across different academies, instructors, educational communities, and learning programs. Mada's presence on the public site is conceptually a **sponsor credit** — subtle, not a dominant advertising layer.

---

## 2. Generic Gamification Platform — Light & Dark Design System Specification

### 2.1 Core Visual Philosophy
- **Light Mode First Experience**: Warm Off-White main background (`#FAF7F2`), pure white cards (`#FFFFFF`), soft mint/teal secondary surfaces (`#ECFDF5` / `#CCFBF1`).
- **Dark Mode System**: Obsidian Navy background (`#0F172A`), dark cards (`#111827`), high-contrast text (`#F8FAFC`), mapped `--clr-navy` variable ensuring 100% heading text contrast in dark mode, and seamless glassmorphic Navbar header.
- **Vibrant Educational Palette**: Primary interaction color upgraded to cheerful Electric Vibrant Teal (`#14B8A6` / hover `#0D9488`).
- **Target Audience**: Appeals to age 5 to 16+ without becoming childish ("Premium educational technology platform + playful gamification").
- **High Text Visibility & Contrast**: Primary text Deep Navy (`#0F172A` in light, `#F8FAFC` in dark). Zero low-contrast or light gray text on white or dark surfaces.
- **Full Arabic & English i18n Across All Shells**: Built-in translation dictionary (`translations.ts`) supporting Cairo font (Arabic RTL) and Inter font (English LTR). Language switcher (`app-lang-toggle`) integrated in Home, Instructor Shell, and Admin Shell topbars.
- **Realtime Infrastructure Enabled**: Supabase Realtime Channels active on `xp_events`, `attendance`, and `students` tables with clean `ngOnDestroy()` channel unsubscription teardown.
- **Temporary Dev Testing Bypass**: Auth and Role Guards relaxed to allow direct 1-click dev testing across `/instructor`, `/admin`, and all sub-routes.

### 2.2 Color System Tokens
| Semantic Role | Token Variable | Hex Code (Light) | Hex Code (Dark) | Usage |
|---|---|---|---|---|
| Primary Interaction | `--clr-primary` | `#14B8A6` | `#14B8A6` | Cheerful Vibrant Teal for primary actions, active nav, progress |
| Primary Dark | `--clr-primary-dark` | `#0D9488` | `#0D9488` | Hover states |
| Light Teal | `--clr-primary-light` | `#CCFBF1` | `#1E4E49` | Subtle teal sections |
| Soft Mint Surface | `--clr-surface-mint` | `#ECFDF5` | `#133D39` | Secondary card & panel surfaces |
| Deep Navy / High Contrast | `--clr-navy` / `--clr-text` | `#0F172A` | `#F8FAFC` | Primary typography, headings, numbers |
| Energetic Accent | `--clr-accent` | `#F59E0B` | `#F59E0B` | Amber accent for XP, rewards, streaks, podium, celebration |
| Main Background | `--clr-bg` | `#FAF7F2` | `#0F172A` | Main application background |
| Surface / Cards | `--clr-surface` | `#FFFFFF` | `#111827` | Cards & modal surfaces |
| Muted Teal | `--clr-muted-teal` | `#6B8E8D` | `#6B8E8D` | Subtle icons & secondary highlights |
| High Contrast Text | `--clr-text-muted` | `#475569` | `#CBD5E1` | Secondary text, captions, subtitles |
| Border Token | `--clr-border` | `#E2E8F0` | `#334155` | Soft card & divider borders |

---

## 3. Tech Stack & Architecture

| Component | Technology | Notes |
|---|---|---|
| Frontend | Angular 22 (Standalone Components) | Signals + Reactive Forms |
| Styling | Pure Vanilla CSS | CSS Custom Properties, BEM |
| Theme | Dynamic `[data-theme]` | Light Mode First (`#FAF7F2` bg) + Dark System |
| Realtime | Supabase Realtime Channels | Postgres changes listener (`INSERT`, `UPDATE`) |
| i18n & RTL | Custom `I18nService` | Full Arabic (RTL/Cairo) & English (LTR/Inter) across all screens |
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
│   │   │   └── services/ (supabase.service.ts, ai.service.ts, theme.service.ts, i18n.service.ts, translations.ts)
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
[ Phase 1: Foundation & Auth ]              ✅ Complete (Theme + i18n + Left Panel Fix)
[ Phase 2: Landing Page ]                   ✅ Complete (Full Redesign + CTA Banner Light/Dark Polish)
[ Phase 3: Instructor Shell ]               ✅ Complete (Theme + i18n topbar aligned)
[ Phase 4: Gamification Engine ]            ✅ Complete (Theme + i18n aligned)
[ Phase 5: Live Session Workspace ]         ✅ Complete (Theme + i18n aligned)
[ Phase 6: Admin Dashboard ]                ✅ Complete (Theme + i18n topbar aligned)
[ Interim: Verify / Seed / Brand ]          ✅ Complete
[ Phase 7: AI Gamification Assistant ]      ✅ Complete (Steps 7.1, 7.2, 7.3)
[ Phase 8: Advanced / Realtime ]            ⏳ Active Phase
    Step 8.1 — Realtime Leaderboard         ✅ Complete
    Step 8.2 — In-App Notifications         ⏳ Active Step (Next)
    Step 8.3 — Multi-Tenancy Review         ⏳ Pending
    Step 8.4 — Final Full-Project Review    ⏳ Pending
```

---

## 8. Detailed Accomplishments Log

- **Phase 0 to 6**: Scaffolded Angular 22 standalone app, Supabase client, RLS migrations, Auth, Instructor dashboard, Live workspace, Admin dashboard.
- **Interim Phase**: Verified real Supabase connectivity, created additive seed data in `supabase/seed/temp_demo_seed.sql`, and cleaned up testing bypass code.
- **Phase 7 (AI Assistant)**: Built secure Supabase Edge Function `ai-gamification-assistant`, `AIService`, and `AiAssistantDrawerComponent` with explicit human-confirmation modals.
- **Phase 8 — Step 8.1 (Realtime Leaderboard & Session Events)**:
  - Subscribed `LiveWorkspaceComponent` to Supabase Realtime postgres_changes on `xp_events` and `attendance` tables.
  - Dynamically updated local student XP totals, pushed live feed events, and updated total XP in real time across multiple open browser windows without page refreshes.
  - Subscribed `LeaderboardComponent` to Realtime postgres_changes on `xp_events` to re-rank leaderboard entries dynamically.
  - Implemented proper `ngOnDestroy()` teardown via `supabase.client.removeChannel()` to guarantee zero memory leaks.
  - Added visual `🔴 Realtime Live` status indicator pills to live session HUD header and leaderboard header.
  - Verified clean build with 0 TypeScript/HTML/CSS compilation errors.

---
*This file is the single source of truth for Mada Quest.*