import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../models/role.enum';

/**
 * Factory that returns a CanActivateFn checking whether the current user
 * holds one of the required roles.
 *
 * Usage in routes:
 *   canActivate: [authGuard, roleGuard([UserRole.ADMIN])]
 */
export const roleGuard = (requiredRoles: UserRole[]): CanActivateFn => {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Not authenticated at all → send to login
    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    // Wrong role → send to /unauthorized
    if (!authService.hasRole(...requiredRoles)) {
      return router.createUrlTree(['/unauthorized']);
    }

    return true;
  };
};
