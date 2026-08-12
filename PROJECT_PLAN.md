# 🎯 مدى Quest (Mada Quest) — Master Project Documentation & Roadmap

> **حالة المشروع الحالية**: المرحلة 6 مكتملة بنجاح ✅ | **الخطوة القادمة**: المرحلة 7 (AI Assistant) ⏳

---

## 📌 1. نظرة عامة على المشروع (Project Overview)

**مدى Quest** هي منصة تعليمية تفاعلية مبنية على أسلوب التحفيز والتعليم بالألعاب (**Gamification Platform**). تهدف المنصة لإدارة الفصول الدراسية، تحفيز الطلاب عبر نقاط الخبرة (XP)، المستويات (Levels)، الأوسمة (Badges)، الإنجازات (Achievements)، التحديات اليومية (Challenges)، وسلّم المتصدرين (Leaderboard) لحظياً.

---

## 🛠️ 2. الهيكل التقني والتطويري (Tech Stack & Architecture)

| المكون (Component) | التقنية المستخدة (Technology) | التفاصيل والقرارات التقنية |
| :--- | :--- | :--- |
| **Frontend Framework** | Angular 22 (Standalone Components) | الاعتماد الكامل على Standalone Components، Signals (`signal`, `computed`, `effect`), و Reactive Forms. |
| **Styling & Design System** | Pure Vanilla CSS | نظام تصميم مخصص باستخدام **CSS Custom Properties** والـ BEM. **بدون Tailwind CSS** و**بدون SCSS preprocessors** (تم تحويل كافة الملفات إلى plain `.css`). |
| **Theme & Dark Mode** | Dynamic `[data-theme]` | تبديل سلس بين الوضع الداكن والفتح عبر `ThemeService` مع حفظ التفضيلات في `localStorage`. |
| **i18n & RTL** | Custom `I18nService` | دعم كامل للغتين العربية (مع اتجاه RTL ونشاط خط Cairo) والإنجليزية (LTR). **بدون مكتبات خارجية**. |
| **Icons System** | Custom SVG `IconComponent` | نظام أيقونات Lucide SVG مدمج محلياً في `src/app/shared/ui/icon/` **بدون استدعاء مكتبات ثقيلة**. |
| **Backend & Database** | Supabase (PostgreSQL + Auth + RLS) | قاعدة بيانات PostgreSQL مع سياسات أمان صارمة (RLS) ومستودع migrations مرقم وموثق. |
| **State Management** | Angular Signals | إدارة الحالة التفاعلية في الواجهة باستخدام Signals الافتراضية في أنجولار. |

---

## 📐 3. قواعد وطريقة العمل المتفق عليها (Development Rules & Process)

1. **العمل خطوة بخطوة (One Step at a Time)**:
   - التنفيذ يتم مرحلة بمرحلة (Phase by Phase)، ولا ننتقل لمرحلة جديدة إلا بعد تأكيد واختبار المرحلة الحالية بنجاح.
2. **الفحص والتأكد قبل التنفيذ (Discovery Before Build)**:
   - قبل بدء كل مرحلة، يتم فحص الملفات المتاحة، جداول Supabase، والـ Services الموجودة لمعرفة المتاح والمطلوب بدقة.
3. **السياسة النظيفة للتصميم (Pure CSS Standard)**:
   - استخدام Plain CSS مع CSS Custom Properties. **يُمنع استخدام Tailwind CSS أو SCSS**.
4. **نظام الأيقونات المحلي (Inline SVG Icons)**:
   - استخدام المكون المحترس `<app-icon name="..." />` المحمّل من `icons.constants.ts`. يُمنع استدعاء مكتبات خارجية.
5. **التحقق البرمجي التلقائي (Build Verification)**:
   - تشغيل `npm run build` بعد كل خطوة للتأكد من عدم وجود أية أخطاء TypeScript أو HTML أو CSS.
6. **التحديث المستمر وتزامن GitHub (Automatic Doc Update & Git Commit)**:
   - يتم تحديث ملف [`PROJECT_PLAN.md`](file:///d:/Full%20Stack/Frontend/QUEST/PROJECT_PLAN.md) وعمل Git Commit وصفي موثق مرفوع على GitHub [`https://github.com/abdelrahmaans/Quest.git`](https://github.com/abdelrahmaans/Quest.git) بنهاية كل مرحلة.

---

## 📁 4. هيكل المجلدات الحالي (Directory Structure)

```
d:/Full Stack/Frontend/QUEST/
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
│   ├── styles.css (Global Design Tokens & Reset)
│   └── environments/ (environment.ts, environment.prod.ts)
├── supabase/
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       ├── 0002_rls_and_auth_trigger.sql
│       └── 0003_admin_policies_and_fixes.sql
├── angular.json
├── package.json
└── PROJECT_PLAN.md
```

---

## 🚦 5. حالة المراحل والتطور التنفيذي (Phases Progress)

```
[ Phase 0: Setup ] ──────────────► ✅ مكتملة
[ Phase 1: Foundation & Auth ] ──► ✅ مكتملة
[ Phase 2: Landing Page ] ───────► ✅ مكتملة
[ Phase 3: Instructor Shell ] ───► ✅ مكتملة
[ Phase 4: Gamification Engine] ─► ✅ مكتملة
[ Phase 5: Live Session Workspace]►✅ مكتملة
[ Phase 6: Admin Dashboard ] ───► ✅ مكتملة
[ Phase 7: AI Assistant ] ───────► ⏳ قيد الانتظار (الخطوة القادمة)
[ Phase 8: Advanced Realtime ] ──► ⏳ قيد الانتظار
```

---

## 📑 6. تفاصيل المراحل وما تم إنجازه (Detailed Accomplishments)

### ✅ Phase 0 — البنية التحتية والمشروع الأساسي
- [x] إنشاء مشروع Angular 22 بمعمارية Standalone Components.
- [x] إعداد Supabase Client وربط المتغيرات البيئية (`environment.ts`).
- [x] تنظيم مجلدات المشروع (`core/`, `shared/`, `features/`).

### ✅ Phase 1 — الأساسيات: قاعدة البيانات، الأمن، المصادقة، الثيم واللغات
- [x] **قواعد البيانات (Migrations)**:
  - `0001_initial_schema.sql`: بناء 22 جدول متكامل لجميع الكيانات.
  - `0002_rls_and_auth_trigger`: تفعيل الـ RLS و Auth trigger.
  - `0003_admin_policies_and_fixes`: إنشاء `is_admin()` وصلاحيات الأدمن.
- [x] **المصادقة والثيم واللغة**:
  - `AuthService`, `authGuard`, `roleGuard`.
  - `ThemeService` (Dark/Light mode) & `I18nService` (AR/EN RTL/LTR).

### ✅ Phase 2 — الصفحة الرئيسية (Landing Page)
- [x] بناء صفحة هبوط تفاعلية فاخرة عند `/home` تتكون من 7 أقسام متكاملة.

### ✅ Phase 3 — لوحة تحكم المعلم (Instructor Dashboard Shell & Overview)
- [x] `InstructorShell`: شريط جانبي (Sidebar) داكن يقبل الطي والفتح.
- [x] `InstructorOverview`: لوحة العرض الرئيسية تعكس إحصائيات حية من Supabase.

### ✅ Phase 4 — محرك الـ Gamification وإدارة الفصول
- [x] **إدارة الفصول (`classes`)**: كروت الفصول مع عدد الطلاب ونموذج إنشاء فصل جديد.
- [x] **منح النقاط (`gamification`)**: أزرار منح الـ XP السريعة (`+5` لـ `+100`) وشرائح الأسباب وسجل الأنشطة الحية.
- [x] **قائمة المتصدرين (`leaderboard`)**: منصة التتويج البصرية (Podium) لأول 3 طلاب وجدول الترتيب الكامل.

### ✅ Phase 5 — مساحة عمل الحصة المباشرة (Live Session Workspace)
- [x] **جدول الحصص المباشرة (`/instructor/sessions`)**: تصفية الحصص حسب الحالة، نموذج الإنشاء، زر إطلاق الحصة.
- [x] **شاشة الحصة المباشرة الجارية (`/instructor/sessions/:id/live`)**:
  - الـ Top HUD مع مؤقت حي ومؤشرات حالة الـ LIVE.
  - تسجيل الحضور والغياب الحي (P/L/A).
  - شريط الـ Live XP الدفعي ونشاط البث الحي المباشر (Live Stream Feed).

### ✅ Phase 6 — لوحة تحكم الأدمن (Admin Dashboard)
- [x] **شريط الأدمن الهيكلي (`AdminShellComponent` عند `/admin`)**:
  - شريط جانبي أوبسيديان داكن بلمسات ذهبية للأدمن، ترويسة علوية بـ Admin Badge، وملاحة سلسة.
- [x] **لوحة إحصائيات النظام الشاملة (`AdminOverviewComponent` عند `/admin`)**:
  - إحصائيات حية من Supabase: إجمالي الحسابات، عدد المعلمين، عدد الأدمنز، إجمالي الفصول، إجمالي الطلاب، وإجمالي الـ XP الممنوحة بالنظام.
  - سجل أحدث الحسابات المسجلة بالمنصة وتوزيع الأدوار.
- [x] **إدارة الحسابات والأدوار (`AdminUsersComponent` عند `/admin/users`)**:
  - بحث بالاسم، تصفية حسب الدور (الكل، معلم، أدمن).
  - تغيير دور المستخدم فورياً (ترقية لأدمن / تنزيل لمعلم)، وتفعيل/تعطيل الحسابات.
- [x] **إعدادات المستويات والـ XP (`GamificationConfigComponent` عند `/admin/config`)**:
  - جدول شجرة المستويات، نموذج إضافة مستوى جديد وحد النقاط المطلوبة والعنوان.
- [x] **سجل العمليات والأمان (`AdminAuditLogsComponent` عند `/admin/logs`)**:
  - تدفق أحداث النظام وسجل العمليات الأمنية.

---

## 🎯 7. الخطة المستقبلية والخطوات القادمة (Next Phases & Roadmap)

### ⏳ Phase 7 — المساعد الذكي (AI Assistant)
- [ ] محرك اقتراحات الـ Gamification الذكي بناءً على أداء الفصول.
- [ ] توليد التحديات والأسئلة التفاعلية تلقائياً.

### ⏳ Phase 8 — الميزات المتقدمة والتفاعل اللحظي (Advanced Realtime)
- [ ] تفعيل Supabase Realtime لاشتقاق تنبيهات لحظية وصوتية للطلاب عند كسب XP أو فتح وسام جديد.
- [ ] واجهة الطالب الخاصة وتصفح شجرة الإنجازات وشارات التكريم.

---

## 📋 8. كيفية التشغيل والبناء (Development Commands)

```bash
# تشغيل خادم التطوير
npm run start

# بناء النسخة الإنتاجية
npm run build
```

---
*تم تحديث هذا المستند تلقائياً في نهاية المرحلة 6 ويُمثّل المرجع الرئيسي للمشروع.*
