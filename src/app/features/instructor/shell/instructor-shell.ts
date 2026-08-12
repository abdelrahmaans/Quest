import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle';
import { LangToggleComponent } from '../../../shared/ui/lang-toggle';
import { NotificationDropdownComponent } from '../../../shared/ui/notification-dropdown/notification-dropdown';
import type { IconName } from '../../../shared/ui/icon/icons.constants';

interface NavItem { icon: IconName; label: string; route: string; }

@Component({
  selector: 'app-instructor-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ThemeToggleComponent, LangToggleComponent, NotificationDropdownComponent],
  templateUrl: './instructor-shell.html',
  styleUrl: './instructor-shell.css',
})
export class InstructorShellComponent {
  readonly auth   = inject(AuthService);
  readonly router = inject(Router);
  readonly sidebarOpen = signal(true);

  readonly navItems: NavItem[] = [
    { icon: 'bar-chart-2',   label: 'Overview',      route: '/instructor' },
    { icon: 'radio',         label: 'Live Sessions', route: '/instructor/sessions' },
    { icon: 'graduation-cap',label: 'Classes',        route: '/instructor/classes' },
    { icon: 'user',          label: 'Students',       route: '/instructor/students' },
    { icon: 'zap',           label: 'Gamification',   route: '/instructor/gamification' },
    { icon: 'target',        label: 'Challenges',     route: '/instructor/challenges' },
    { icon: 'trophy',        label: 'Leaderboard',    route: '/instructor/leaderboard' },
    { icon: 'bell',          label: 'Feedback',       route: '/instructor/feedback' },
    { icon: 'settings',      label: 'Settings',       route: '/instructor/settings' },
  ];

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
