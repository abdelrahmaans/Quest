# 🎯 Mada Quest — Gamified Educational Platform

**Mada Quest** is a modern, generic, brand-agnostic educational gamification platform designed to manage classes, engage students, and track learning progress through points (XP), levels, badges, team duels, live challenges, and real-time leaderboards.

---

## 🌟 Core Features & Modules

### 👨‍🏫 1. Instructor Management Hub
- **Class & Schedule Management**: Create classes with age profiles, topics, and auto-generated recurring schedules.
- **Roster & Quick Enroll**: Search existing student records or create/enroll new students with auto-generated public codes.
- **Unified Sessions Timeline**: Interactive monthly calendar with today's agenda and session status filters (`Scheduled`, `Live`, `Completed`).
- **Live Classroom Workspace HUD**:
  - 1-click interactive attendance marking (`Present`, `Late`, `Absent`).
  - Real-time Supabase Realtime synchronization across multi-tab setups.
  - Multi-engine gamification support:
    - ⚡ **XP & Levels**: Quick points awarding with live feed.
    - 🛡️ **Team Quests & Duels**: Phoenix vs Titans arena battles.
    - 🏆 **Badges & Mastery**: Unlockable skill milestone badges.
    - 🎯 **Hybrid Quests**: Combined interactive gamification.
  - Optional activity timer with Web Audio API harmonic sound synthesizer.
  - Live podium leaderboard modal (🥇, 🥈, 🥉).
  - End-of-session MVP celebration summary and `audit_log` recording.
- **AI Gamification Assistant**: Integrated Google Gemini 2.0 Flash side-drawer for real-time quiz generation, pedagogical tips, and challenges.

### 🛡️ 2. Admin & System Management
- **Multi-Tenant Security**: Role-based access control (`admin`, `instructor`, `parent`, `student`) with PostgreSQL Row-Level Security (RLS).
- **Gamification Configuration**: Dynamic XP scaling, badge presets, and system parameters.
- **Audit Logs**: Comprehensive event trail for critical actions and session completions.

### 🌐 3. Globalization & UI Experience
- **Bilingual & RTL**: Native Arabic (Cairo font, RTL) & English (Inter font, LTR) switching.
- **Design System**: Tailored Light (`#FAF7F2`) and Dark (`#0F172A`) palettes with brand electric teal (`#14B8A6`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Angular 22 (Standalone Components + Signals) |
| **Styling** | Pure Vanilla CSS (CSS Variables, BEM, Glassmorphism) |
| **Backend & DB** | Supabase (PostgreSQL, Realtime Channels, Auth, RLS) |
| **AI Integration** | Supabase Edge Functions + Google Gemini 2.0 Flash API |
| **State Management** | Angular Signals & Reactive Computations |
| **Audio Engine** | Web Audio API (`AudioContext` Synthesizer) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/abdelrahmaans/Quest.git
cd QUEST

# Install dependencies
npm install

# Start development server
npm start
```
Navigate to `http://localhost:4200/` in your browser.

### 3. Production Build
```bash
npm run build
```
Build artifacts will be generated in `dist/mada-quest/`.

---

## 🗄️ Database Migrations (Supabase)

All database schema definitions and security policies are versioned in `supabase/migrations/`:
- `0001_initial_schema.sql`: Core relational schema.
- `0002_rls_and_auth_trigger.sql`: Profiles trigger and initial RLS.
- `0003_admin_policies_and_fixes.sql`: Admin privileges and append-only XP events ledger.
- `0004_multi_tenancy_rls_policies.sql`: Multi-tenant organization isolation.
- `0005_xp_events_created_by.sql`: Centralized actor column on XP events.
- `0006_instructor_rls_and_gamification_mode.sql`: Gamification engine modes.
- `0007` to `0015`: Classes, sessions, attendance, and challenges synchronization.
- `0016_classes_duration_minutes.sql`: Class session length configuration.

---

## 📄 License & Attribution
Mada Quest is built as an open gamified educational architecture. All rights reserved.
