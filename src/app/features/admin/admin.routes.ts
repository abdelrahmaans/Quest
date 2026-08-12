import { Routes } from '@angular/router';

// Stub — will be populated in Phase 6 (Admin Dashboard)
export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../home/dashboard/dashboard').then(m => m.DashboardComponent),
  },
];
