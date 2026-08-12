// TEMP-TESTING: Dev-only floating badge for switching roles during internal testing
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserRole } from '../../core/models/role.enum';
import { isAuthBypassActive, tempTestingRole } from '../../core/config/temp-testing.flag';

@Component({
  selector: 'app-temp-dev-badge',
  standalone: true,
  template: `
    <!-- TEMP-TESTING: Only renders when bypass flag is active -->
    @if (isActive()) {
      <div class="temp-dev-badge" title="Temporary Dev Testing Mode">
        <span class="badge-title">⚡ TESTING BYPASS ACTIVE</span>
        <div class="badge-role-wrap">
          <span class="badge-role">Role: <strong>{{ currentRole() }}</strong></span>
          <button type="button" class="badge-btn" (click)="toggleRole()">
            Switch to {{ currentRole() === 'admin' ? 'Instructor' : 'Admin' }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    /* TEMP-TESTING: Floating badge styles */
    .temp-dev-badge {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 99999;
      background: #0F172A;
      border: 1.5px solid #F59E0B;
      border-radius: 12px;
      padding: .625rem .875rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      color: #F8FAFC;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: .75rem;
      display: flex;
      flex-direction: column;
      gap: .375rem;
      animation: pulse-border 2s infinite;
    }

    @keyframes pulse-border {
      0%, 100% { border-color: #F59E0B; }
      50% { border-color: #3B82F6; }
    }

    .badge-title {
      font-weight: 800;
      color: #F59E0B;
      letter-spacing: .05em;
    }

    .badge-role-wrap {
      display: flex;
      align-items: center;
      gap: .625rem;
    }

    .badge-role strong {
      color: #0D9488;
      text-transform: capitalize;
    }

    .badge-btn {
      background: #1E293B;
      border: 1px solid #334155;
      color: #F8FAFC;
      font-size: .6875rem;
      font-weight: 600;
      padding: .2rem .5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .badge-btn:hover {
      background: #334155;
    }
  `]
})
export class TempDevBadgeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // TEMP-TESTING: Check if bypass is active
  isActive(): boolean {
    return isAuthBypassActive();
  }

  // TEMP-TESTING: Current role display
  currentRole(): string {
    return tempTestingRole();
  }

  // TEMP-TESTING: Switch role dynamically
  toggleRole(): void {
    const newRole = tempTestingRole() === UserRole.ADMIN ? UserRole.INSTRUCTOR : UserRole.ADMIN;
    tempTestingRole.set(newRole);
    this.auth.setupTempTestingUser();
    this.router.navigate([this.auth.postLoginRoute()]);
  }
}
