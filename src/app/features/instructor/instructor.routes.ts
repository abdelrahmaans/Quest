import { Routes } from '@angular/router';

export const instructorRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/instructor-shell').then(m => m.InstructorShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./overview/overview').then(m => m.InstructorOverviewComponent),
      },
      {
        path: 'classes',
        loadComponent: () =>
          import('./classes/classes').then(m => m.InstructorClassesComponent),
      },
      {
        path: 'classes/:id',
        loadComponent: () =>
          import('./classes/class-detail/class-detail').then(m => m.ClassDetailComponent),
      },
      {
        path: 'gamification',
        loadComponent: () =>
          import('./gamification/gamification').then(m => m.GamificationComponent),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./leaderboard/leaderboard').then(m => m.LeaderboardComponent),
      },
      {
        path: 'sessions',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./sessions/sessions-list/sessions-list').then(
                m => m.SessionsListComponent,
              ),
          },
          {
            path: ':id/live',
            loadComponent: () =>
              import('./sessions/live-workspace/live-workspace').then(
                m => m.LiveWorkspaceComponent,
              ),
          },
        ],
      },
      // Remaining stubs
      {
        path: 'students',
        loadComponent: () =>
          import('./overview/overview').then(m => m.InstructorOverviewComponent),
      },
      {
        path: 'challenges',
        loadComponent: () =>
          import('./overview/overview').then(m => m.InstructorOverviewComponent),
      },
      {
        path: 'feedback',
        loadComponent: () =>
          import('./overview/overview').then(m => m.InstructorOverviewComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./overview/overview').then(m => m.InstructorOverviewComponent),
      },
    ],
  },
];
