import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/admin-shell').then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./overview/admin-overview').then(
            m => m.AdminOverviewComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users-list').then(m => m.AdminUsersComponent),
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./config/gamification-config').then(
            m => m.GamificationConfigComponent,
          ),
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./logs/audit-logs').then(m => m.AdminAuditLogsComponent),
      },
    ],
  },
];
