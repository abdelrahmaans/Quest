# 🎯 Mada Quest — Master Project Reference & Roadmap

> **Current status**: Phases 0–6 & Interim Phase complete ✅ | **Active phase**: Phase 7 (AI Assistant) ⏳

---

## 1. Project Overview

**Mada Quest** is a gamified educational platform for managing classes, motivating students through XP, Levels, Badges, Achievements, Challenges, and a real-time Leaderboard. It serves four audiences — Instructors, Students, Parents, and Admins — and is designed to feel like a real product, not a demo dashboard.

Mada Quest is built as a **generic, brand-agnostic core engine**. Mada Academy is the primary brand and the visual identity is modeled on Mada, but the platform must remain reusable for other academies later. Mada's presence on the public site is conceptually that of a **sponsor** — a subtle, tasteful "Powered by Mada" presence, not a dominant advertising layer.

---

## 2. Brand Identity & Design System (Mada)

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

### 2.4 "Powered by Mada" — Sponsor Credit
- Mada Quest is the primary product identity. Mada appears as a **sponsor-style credit**, not a headline brand.
- "Powered by Mada · بدعم من مدى" added once, small and subtle in the public Home Page footer.

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
│   ├── seed/
│   │   └── temp_demo_seed.sql
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       ├── 0002_rls_and_auth_trigger.sql
│       └── 0003_admin_policies_and_fixes.sql
├── angular.json
├── package.json
└── PROJECT_PLAN.md
```

---

## 6. Database & Security Status

- 22 core tables created in `0001_initial_schema.sql`.
- RLS enabled and auth trigger (auto-profile-on-signup) added in `0002_rls_and_auth_trigger.sql`.
- Admin full-access policies via `is_admin()` helper, `audit_log` table (admin-read-only, no direct insert), `organization_id` columns added, and `xp_events` corrected to an **append-only ledger** (insert-only for instructors, no update/delete) in `0003_admin_policies_and_fixes.sql`.

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
[ Interim: Verification / Seed / Brand ]    ✅ Complete
[ Phase 7: AI Assistant ]                   ⏳ Active Phase (Next)
[ Phase 8: Advanced Realtime ]              ⏳ Pending
```

---

## 8. Detailed Accomplishments (Phases 0–6 & Interim)

- **Phase 0**: Angular 22 standalone project scaffolded; Supabase client wired to environment variables; `core/`, `shared/`, `features/` structure established.
- **Phase 1**: 22-table schema, RLS, auth trigger, admin policies, append-only `xp_events`; `AuthService`, `authGuard`, `roleGuard`; `ThemeService`; `I18nService` (AR/EN, RTL/LTR).
- **Phase 2**: Public landing page at `/home` with 7 sections.
- **Phase 3**: Instructor shell (collapsible dark sidebar) + live overview dashboard pulling real Supabase stats.
- **Phase 4**: Class management (cards + creation form), quick XP-award buttons (+5 to +100) with reason tags and a live activity feed, leaderboard with podium view for top 3 + full ranking table.
- **Phase 5**: Session list (`/instructor/sessions`) with status filters and creation form; live session screen (`/instructor/sessions/:id/live`) with live timer HUD, attendance (P/L/A), batched live XP bar, live activity stream.
- **Phase 6**: Admin shell (obsidian/gold sidebar), system-wide overview stats, user/role management (`/admin/users`), level & XP configuration (`/admin/config`), audit log viewer (`/admin/logs`).
- **Interim Phase**: Completed Step A (100% real Supabase connectivity audit), Step B (temporary testing auth bypass & dev role switcher), Step C (additive demo seed data in `supabase/seed/temp_demo_seed.sql`), Step D (Mada brand palette, Cairo/Inter/JetBrains Mono typography, "Powered by Mada" sponsor credit), and Step E (full cleanup of testing bypass code & 0 remaining `TEMP-TESTING` tags).

---

## 9. Next Phases & Roadmap

### ⏳ Phase 7 — AI Gamification Assistant (Active Phase)
- Session-context-aware suggestion engine (challenges, XP rules, engagement fixes) per the age-safety and human-approval rules from the original product spec.
- AI never auto-applies changes to XP rules, scores, badges, or class configuration without explicit instructor/admin confirmation.

### ⏳ Phase 8 — Advanced / Realtime
- Supabase Realtime for live leaderboard and session events (scoped subscriptions only, not blanket table subscriptions).
- In-app notifications (badge unlocked, achievement unlocked, level up, challenge start/end, session completed).
- Student-facing public view (achievement tree, badge showcase) via Student Code lookup.

---

## 10. How to Run

```bash
# Development server
npm run start

# Production build
npm run build
```

---
*This document is the single source of truth for Mada Quest's architecture, brand system, and roadmap. Update it at the end of every phase.*