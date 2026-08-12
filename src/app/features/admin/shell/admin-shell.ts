import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle';
import type { IconName } from '../../../shared/ui/icon/icons.constants';

interface AdminNavItem { icon: IconName; label: string; route: string; }

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ThemeToggleComponent],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
})
export class AdminShellComponent {
  readonly auth   = inject(AuthService);
  readonly router = inject(Router);
  readonly sidebarOpen = signal(true);

  readonly navItems: AdminNavItem[] = [
    { icon: 'bar-chart-2',  label: 'Overview',   route: '/admin' },
    { icon: 'users',        label: 'Users',      route: '/admin/users' },
    { icon: 'settings',     label: 'Levels Config', route: '/admin/config' },
    { icon: 'shield-check', label: 'Audit Logs', route: '/admin/logs' },
  ];

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
