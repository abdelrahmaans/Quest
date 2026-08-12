import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { UserRole } from '../../../core/models/role.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly UserRole = UserRole;

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
