import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/role.enum';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // ─── Home / Landing Page (public) ────────────────────────
  {
    path: 'home',
    loadChildren: () =>
      import('./features/home/home.routes').then(m => m.homeRoutes),
  },

  // ─── Auth (public) ────────────────────────────────────────────
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then(m => m.LoginComponent),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./features/auth/signup/signup').then(m => m.SignupComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then(
            m => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then(
            m => m.ResetPasswordComponent,
          ),
      },
      // OAuth callback — redirects handled by Supabase client
      { path: 'callback', redirectTo: '/auth/login' },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // ─── Instructor (protected) ───────────────────────────────────
  {
    path: 'instructor',
    canActivate: [authGuard, roleGuard([UserRole.INSTRUCTOR, UserRole.ADMIN])],
    loadChildren: () =>
      import('./features/instructor/instructor.routes').then(
        m => m.instructorRoutes,
      ),
  },

  // ─── Admin (protected) ────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard([UserRole.ADMIN])],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },

  // ─── Unauthorized ─────────────────────────────────────────────
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/home/dashboard/dashboard').then(
        m => m.DashboardComponent,
      ),
  },

  // ─── 404 fallback ─────────────────────────────────────────────
  { path: '**', redirectTo: '/auth/login' },
];
